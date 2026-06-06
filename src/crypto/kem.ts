/**
 * Scloud+ KEM — educational implementation.
 * ePrint 2024/1306 (Wang, Zheng, Zhao, Qiu, Zeng, Yuan, Mu, Wang)
 *
 * Implements:
 *   - Scloud+.PKE  (IND-CPA public-key encryption)        — Algorithms 4–6
 *   - Scloud+.KEM  (IND-CCA2 via Fujisaki-Okamoto)         — Algorithms 9–11
 *
 * Faithful pieces:
 *   - Matrix LWE (FrodoKEM-style): the public key is a matrix B = A·S + E, so
 *     EVERY ciphertext coordinate gets an INDEPENDENT mask. (An earlier version
 *     masked c2 with a single shared scalar — that leaks message differences and
 *     is not IND-CPA. This version fixes that.)
 *   - Ternary secret columns/rows with Hamming weight n/2
 *   - Centered-binomial error ρ(η)
 *   - BW₃₂-style lattice coding for error correction (one 32-dim codeword per row)
 *   - REAL FO transform with implicit rejection: decaps re-encrypts the recovered
 *     message and returns a pseudo-random key on any mismatch.
 *   - Hashes per the paper: H = SHA3-256, G = SHA3-512, K/F = SHAKE-256.
 *
 * Simplification (see params.ts): we use a small message width n̄ = 32 (one BW₃₂
 * block per row) and the demo's simplified 5-bits-per-block BW₃₂ coder, with
 * modest dimensions so it runs fast in the browser and the data stays readable.
 * The math is real matrix-LWE + ternary + binomial + BW₃₂ + FO — just scaled
 * down, so byte sizes differ from the official spec sizes (shown alongside).
 */

import { SCloudParams } from './params';
import { shake256, sha3_256, sha3_512 } from './keccak';
import {
  sampleTernarySecret,
  sampleCenteredBinomial,
  deterministicCenteredBinomial,
} from './sampling';
import { generateMatrixA } from './matrix';
import { bw32EncodeMessage, bw32DecodeMessage } from './bw32';
import {
  randomBytes, concatBytes, constantTimeEquals, packIntegers,
  unpackIntegers, bytesToHex,
} from './utils';

/** Message width: each row of the message/ciphertext is one 32-dim BW₃₂ block. */
const NBAR = 32;

// ── Key Types ──────────────────────────
// Matrices are stored flat, row-major, with dimensions given by the params:
//   B : n × NBAR        (public)
//   S : n × NBAR        (secret)
//   C1: msgBlocks × n   (ciphertext part 1)
//   C2: msgBlocks × NBAR(ciphertext part 2)

export interface SCloudPublicKey {
  seedA: Uint8Array;
  B: Int32Array;       // n × NBAR, flat row-major
}

export interface SCloudSecretKey {
  S: Int16Array;       // n × NBAR ternary, flat row-major
  pk: SCloudPublicKey;
  hPk: Uint8Array;     // H(pk)
  z: Uint8Array;       // implicit-rejection seed
}

export interface SCloudCiphertext {
  C1: Int32Array;      // msgBlocks × n, flat row-major
  C2: Int32Array;      // msgBlocks × NBAR, flat row-major
}

export interface SCloudKeyPair { pk: SCloudPublicKey; sk: SCloudSecretKey; }
export interface SCloudEncapsResult { ct: SCloudCiphertext; ss: Uint8Array; }

const mod = (x: number, q: number) => ((x % q) + q) % q;

// ── Serialization ──────────────────────

export function serializePublicKey(pk: SCloudPublicKey, params: SCloudParams): Uint8Array {
  return concatBytes(pk.seedA, packIntegers(Array.from(pk.B), params.logQ));
}

export function deserializePublicKey(data: Uint8Array, params: SCloudParams): SCloudPublicKey {
  const seedA = data.slice(0, params.seedBytes);
  const B = new Int32Array(unpackIntegers(data.slice(params.seedBytes), params.n * NBAR, params.logQ));
  return { seedA, B };
}

export function serializeCiphertext(ct: SCloudCiphertext, params: SCloudParams): Uint8Array {
  const c1 = packIntegers(Array.from(ct.C1), params.logQ);
  const c2 = packIntegers(Array.from(ct.C2), params.logQ);
  return concatBytes(c1, c2);
}

export function deserializeCiphertext(data: Uint8Array, params: SCloudParams): SCloudCiphertext {
  const c1Entries = params.msgBlocks * params.n;
  const c1ByteLen = Math.ceil((c1Entries * params.logQ) / 8);
  const C1 = new Int32Array(unpackIntegers(data.slice(0, c1ByteLen), c1Entries, params.logQ));
  const C2 = new Int32Array(unpackIntegers(data.slice(c1ByteLen), params.msgBlocks * NBAR, params.logQ));
  return { C1, C2 };
}

// ── Hash functions (H, G, K) — paper §7 instantiation ──

/** H : pk → 32 bytes (SHA3-256) */
function H(pk: SCloudPublicKey, params: SCloudParams): Uint8Array {
  return sha3_256(serializePublicKey(pk, params));
}

/** G : (m ‖ H(pk)) → (coins, k), each 32 bytes (SHA3-512) */
function G(m: Uint8Array, hPk: Uint8Array): { coins: Uint8Array; k: Uint8Array } {
  const out = sha3_512(concatBytes(m, hPk));
  return { coins: out.slice(0, 32), k: out.slice(32, 64) };
}

/** K : (key ‖ ct) → shared secret of ssBytes (SHAKE-256) */
function K(key: Uint8Array, ctBytes: Uint8Array, ssBytes: number): Uint8Array {
  return shake256(concatBytes(key, ctBytes), ssBytes);
}

// ── Deterministic randomness for Enc (the FO "coins") ──

interface EncRandomness {
  Sp: Int16Array;   // ephemeral secret S'  (msgBlocks × n)
  E1: Int16Array;   // error for C1         (msgBlocks × n)
  E2: Int16Array;   // error for C2         (msgBlocks × NBAR)
}

/**
 * Expand `coins` (via SHAKE-256, the paper's F) into S', E1, E2. Deterministic:
 * identical coins → identical randomness, which is what the FO re-encryption
 * check relies on.
 */
function expandCoins(coins: Uint8Array, params: SCloudParams): EncRandomness {
  const { n, msgBlocks, eta } = params;
  const ternBytesPerRow = n * 4;                       // 4 bytes / Fisher-Yates step
  const ternBytes = ternBytesPerRow * msgBlocks;
  const e1Bytes = Math.ceil((2 * eta * msgBlocks * n) / 8);
  const e2Bytes = Math.ceil((2 * eta * msgBlocks * NBAR) / 8);
  const stream = shake256(coins, ternBytes + e1Bytes + e2Bytes);

  let off = 0;
  const Sp = new Int16Array(msgBlocks * n);
  for (let i = 0; i < msgBlocks; i++) {
    const row = deterministicTernary(stream.subarray(off, off + ternBytesPerRow), n, params.hw);
    Sp.set(row, i * n);
    off += ternBytesPerRow;
  }
  const E1 = deterministicCenteredBinomial(stream.subarray(off, off + e1Bytes), msgBlocks * n, eta);
  off += e1Bytes;
  const E2 = deterministicCenteredBinomial(stream.subarray(off, off + e2Bytes), msgBlocks * NBAR, eta);

  return { Sp, E1, E2 };
}

/**
 * Deterministic constant-weight ternary vector from a byte stream.
 * Requires rand.length >= 4·n so each Fisher-Yates step reads its own
 * non-overlapping 4-byte window (no reuse, no modular wrap-around).
 */
function deterministicTernary(rand: Uint8Array, n: number, hw: number): Int16Array {
  const nPlus = hw >> 1;
  const arr = new Int16Array(n);
  for (let i = 0; i < nPlus; i++) arr[i] = 1;
  for (let i = nPlus; i < nPlus + nPlus; i++) arr[i] = -1;
  for (let i = n - 1; i > 0; i--) {
    const o = i * 4; // non-overlapping window; rand is sized 4n
    const r = (rand[o] | (rand[o + 1] << 8) | (rand[o + 2] << 16) | ((rand[o + 3] & 0x7f) << 24)) >>> 0;
    const j = r % (i + 1);
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

// ── PKE core (matrix LWE) ─────────────

/**
 * Scloud+.PKE.Enc — deterministic given message `m` and coins.
 * C1 = S'·A + E1                        (msgBlocks × n)  — hides S'
 * C2 = S'·B + E2 + Encode(m)            (msgBlocks × NBAR) — message, independently masked
 */
export function pkeEncrypt(
  pk: SCloudPublicKey, m: Uint8Array, coins: Uint8Array, params: SCloudParams
): SCloudCiphertext {
  const { n, q, msgBlocks } = params;
  const A = generateMatrixA(pk.seedA, params); // n × n (rows)
  const { Sp, E1, E2 } = expandCoins(coins, params);

  // C1 = S'·A + E1
  const C1 = new Int32Array(msgBlocks * n);
  for (let i = 0; i < msgBlocks; i++) {
    for (let t = 0; t < n; t++) {
      let acc = 0;
      for (let u = 0; u < n; u++) acc += Sp[i * n + u] * A[u][t];
      C1[i * n + t] = mod(acc + E1[i * n + t], q);
    }
  }

  // C2 = S'·B + E2 + Encode(m)
  const encoded = bw32EncodeMessage(m, msgBlocks, q); // msgBlocks × NBAR, row-major
  const C2 = new Int32Array(msgBlocks * NBAR);
  for (let i = 0; i < msgBlocks; i++) {
    for (let k = 0; k < NBAR; k++) {
      let acc = 0;
      for (let u = 0; u < n; u++) acc += Sp[i * n + u] * pk.B[u * NBAR + k];
      C2[i * NBAR + k] = mod(acc + E2[i * NBAR + k] + encoded[i * NBAR + k], q);
    }
  }

  return { C1, C2 };
}

/**
 * Scloud+.PKE.Dec — recover the message.
 * D = C2 − C1·S ;  m' = BW₃₂-decode(D row by row)
 */
export function pkeDecrypt(sk: SCloudSecretKey, ct: SCloudCiphertext, params: SCloudParams): Uint8Array {
  const { n, q, msgBlocks } = params;
  const D = new Int32Array(msgBlocks * NBAR);
  for (let i = 0; i < msgBlocks; i++) {
    for (let k = 0; k < NBAR; k++) {
      let acc = 0;
      for (let u = 0; u < n; u++) acc += ct.C1[i * n + u] * sk.S[u * NBAR + k];
      D[i * NBAR + k] = mod(ct.C2[i * NBAR + k] - acc, q);
    }
  }
  return bw32DecodeMessage(D, msgBlocks, q).slice(0, params.msgBytes);
}

// ── KEM (KeyGen / Encaps / Decaps) ──────

/**
 * Scloud+.KEM.KeyGen — Algorithm 9.
 *   S ← ternary (n × n̄, weight n/2 per column);  E ← ρ(η)
 *   B = A·S + E ;  pk = (seedA, B) ;  sk = (S, pk, H(pk), z)
 */
export function keyGen(params: SCloudParams): SCloudKeyPair {
  const { n, q } = params;
  const seedA = randomBytes(params.seedBytes);
  const A = generateMatrixA(seedA, params);

  // S: each column an independent ternary vector of weight hw
  const S = new Int16Array(n * NBAR);
  for (let k = 0; k < NBAR; k++) {
    const col = sampleTernarySecret(n, params.hw);
    for (let j = 0; j < n; j++) S[j * NBAR + k] = col[j];
  }
  const E = sampleCenteredBinomial(n * NBAR, params.eta);

  // B = A·S + E
  const B = new Int32Array(n * NBAR);
  for (let j = 0; j < n; j++) {
    for (let k = 0; k < NBAR; k++) {
      let acc = 0;
      for (let t = 0; t < n; t++) acc += A[j][t] * S[t * NBAR + k];
      B[j * NBAR + k] = mod(acc + E[j * NBAR + k], q);
    }
  }

  const pk: SCloudPublicKey = { seedA, B };
  const hPk = H(pk, params);
  const z = randomBytes(32);
  return { pk, sk: { S, pk, hPk, z } };
}

/** Scloud+.KEM.Encaps — Algorithm 10. */
export function encaps(pk: SCloudPublicKey, params: SCloudParams): SCloudEncapsResult {
  const r = encapsDetailed(pk, params);
  return { ct: r.ct, ss: r.ss };
}

export interface EncapsDetail extends SCloudEncapsResult {
  m: Uint8Array; coins: Uint8Array; k: Uint8Array;
}

export function encapsDetailed(pk: SCloudPublicKey, params: SCloudParams): EncapsDetail {
  const m = randomBytes(params.msgBytes);
  const hPk = H(pk, params);
  const { coins, k } = G(m, hPk);
  const ct = pkeEncrypt(pk, m, coins, params);
  const ss = K(k, serializeCiphertext(ct, params), params.ssBytes);
  return { ct, ss, m, coins, k };
}

/** Scloud+.KEM.Decaps — Algorithm 11 (FO with implicit rejection). */
export function decaps(sk: SCloudSecretKey, ct: SCloudCiphertext, params: SCloudParams): Uint8Array {
  return decapsDetailed(sk, ct, params).ss;
}

export interface DecapsDetail {
  mPrime: Uint8Array;
  ctPrime: SCloudCiphertext;
  reEncMatch: boolean;
  rejected: boolean;
  ss: Uint8Array;
}

export function decapsDetailed(
  sk: SCloudSecretKey, ct: SCloudCiphertext, params: SCloudParams
): DecapsDetail {
  const mPrime = pkeDecrypt(sk, ct, params);
  const { coins, k } = G(mPrime, sk.hPk);
  const ctPrime = pkeEncrypt(sk.pk, mPrime, coins, params);

  const ctBytes = serializeCiphertext(ct, params);
  const reEncMatch = constantTimeEquals(ctBytes, serializeCiphertext(ctPrime, params));

  const ss = reEncMatch
    ? K(k, ctBytes, params.ssBytes)      // accept: ss = K(k' ‖ C)
    : K(sk.z, ctBytes, params.ssBytes);  // reject: ss = K(z  ‖ C)

  return { mPrime, ctPrime, reEncMatch, rejected: !reEncMatch, ss };
}

// ── Round-trip + tamper demo ──────────

export interface KEMRoundtripResult {
  pk: SCloudPublicKey;
  sk: SCloudSecretKey;
  ct: SCloudCiphertext;
  ssEncaps: Uint8Array;
  ssDecaps: Uint8Array;
  match: boolean;
  decaps: DecapsDetail;
  tamperedCt?: SCloudCiphertext;
  ssTampered?: Uint8Array;
  tamperMatch?: boolean;
  tamperDecaps?: DecapsDetail;
  seedA: string;
  pkSize: number;
  skSize: number;
  ctSize: number;
}

export function fullRoundtrip(params: SCloudParams, tamper = false): KEMRoundtripResult {
  const { pk, sk } = keyGen(params);
  const { ct, ss: ssEncaps } = encaps(pk, params);
  const decap = decapsDetailed(sk, ct, params);

  const pkSize = serializePublicKey(pk, params).length;
  const sPacked = packIntegers(Array.from(sk.S).map(v => v + 1), 2);
  const skSize = sPacked.length + pkSize + 32 + 32;

  const result: KEMRoundtripResult = {
    pk, sk, ct,
    ssEncaps,
    ssDecaps: decap.ss,
    match: bytesToHex(ssEncaps) === bytesToHex(decap.ss),
    decaps: decap,
    seedA: bytesToHex(pk.seedA),
    pkSize,
    skSize,
    ctSize: serializeCiphertext(ct, params).length,
  };

  if (tamper) {
    const ctBytes = serializeCiphertext(ct, params);
    ctBytes[0] ^= 0xff;
    ctBytes[1] ^= 0xff;
    ctBytes[Math.min(10, ctBytes.length - 1)] ^= 0xff;
    const tamperedCt = deserializeCiphertext(ctBytes, params);
    const tamperDecaps = decapsDetailed(sk, tamperedCt, params);
    result.tamperedCt = tamperedCt;
    result.ssTampered = tamperDecaps.ss;
    result.tamperMatch = bytesToHex(ssEncaps) === bytesToHex(tamperDecaps.ss);
    result.tamperDecaps = tamperDecaps;
  }

  return result;
}

// ── Toy single-vector LWE demo for the "LWE Core" exhibit ──────
// (A deliberately minimal b = A·s + e illustration — not the KEM.)

export interface ToyLWEDemo {
  A: Int32Array[];
  s: Int16Array;
  e: Int16Array;
  b: Int32Array;
  n: number;
  q: number;
}

export function toyLWEDemo(n = 8, q = 251): ToyLWEDemo {
  const A = generateMatrixA(randomBytes(32), { n, q, logQ: Math.ceil(Math.log2(q)) } as SCloudParams);
  const s = sampleTernarySecret(n, n >> 1);
  const e = sampleCenteredBinomial(n, 2);
  const b = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) sum += A[i][j] * s[j];
    b[i] = mod(sum + e[i], q);
  }
  return { A, s, e, b, n, q };
}
