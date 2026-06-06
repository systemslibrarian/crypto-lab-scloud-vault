/**
 * Scloud+ KEM — educational implementation.
 * ePrint 2024/1306 (Wang, Zheng, Zhao, Qiu, Zeng, Yuan, Mu, Wang)
 *
 * Implements:
 *   - Scloud+.PKE  (IND-CPA public-key encryption)        — Algorithms 4–6
 *   - Scloud+.KEM  (IND-CCA2 via Fujisaki-Okamoto)         — Algorithms 9–11
 *
 * Faithful pieces:
 *   - Ternary secret with Hamming weight n/2 (constant-weight distribution)
 *   - Centered-binomial error ρ(η)
 *   - BW₃₂-style lattice coding for error correction
 *   - REAL FO transform with implicit rejection: decaps re-encrypts the
 *     recovered message and returns a pseudo-random key on any mismatch.
 *   - Hash instantiation matching the paper: H = SHA3-256, G = SHA3-512,
 *     K/F = SHAKE-256.
 *
 * Simplification (see params.ts): the real scheme keeps B as an m×n̄ matrix and
 * applies modulus switching (q,q1,q2) plus Z[i] BW₃₂ labeling. For readable,
 * fast in-browser demos we use a single-vector formulation. The math is still
 * real unstructured LWE + ternary + binomial + BW₃₂ + FO — just smaller.
 */

import { SCloudParams } from './params';
import { shake256, sha3_256, sha3_512 } from './keccak';
import {
  sampleTernarySecret,
  sampleCenteredBinomial,
  deterministicCenteredBinomial,
} from './sampling';
import { generateMatrixA, matVecMul, matTransVecMul, vecAdd } from './matrix';
import { bw32EncodeMessage, bw32DecodeMessage } from './bw32';
import {
  randomBytes, concatBytes, constantTimeEquals, packIntegers,
  unpackIntegers, bytesToHex,
} from './utils';

// ── Key Types ──────────────────────────

export interface SCloudPublicKey {
  seedA: Uint8Array;
  b: Int32Array;       // n-dimensional vector in Z_q  (demo's stand-in for B)
}

export interface SCloudSecretKey {
  s: Int16Array;       // ternary secret
  pk: SCloudPublicKey;
  hPk: Uint8Array;     // H(pk) — hash of public key
  z: Uint8Array;       // implicit-rejection seed (paper's z)
}

export interface SCloudCiphertext {
  c1: Int32Array;      // n-dimensional vector in Z_q
  c2: Int32Array;      // (msgBlocks · 32)-dimensional vector in Z_q
}

export interface SCloudKeyPair {
  pk: SCloudPublicKey;
  sk: SCloudSecretKey;
}

export interface SCloudEncapsResult {
  ct: SCloudCiphertext;
  ss: Uint8Array;
}

// ── Serialization ──────────────────────

export function serializePublicKey(pk: SCloudPublicKey, params: SCloudParams): Uint8Array {
  const bPacked = packIntegers(Array.from(pk.b), params.logQ);
  return concatBytes(pk.seedA, bPacked);
}

export function deserializePublicKey(data: Uint8Array, params: SCloudParams): SCloudPublicKey {
  const seedA = data.slice(0, params.seedBytes);
  const bPacked = data.slice(params.seedBytes);
  const b = new Int32Array(unpackIntegers(bPacked, params.n, params.logQ));
  return { seedA, b };
}

export function serializeCiphertext(ct: SCloudCiphertext, params: SCloudParams): Uint8Array {
  const c1Packed = packIntegers(Array.from(ct.c1), params.logQ);
  const c2Packed = packIntegers(Array.from(ct.c2), params.logQ);
  return concatBytes(c1Packed, c2Packed);
}

export function deserializeCiphertext(data: Uint8Array, params: SCloudParams): SCloudCiphertext {
  const c1ByteLen = Math.ceil((params.n * params.logQ) / 8);
  const c1Packed = data.slice(0, c1ByteLen);
  const c2Packed = data.slice(c1ByteLen);
  const c1 = new Int32Array(unpackIntegers(c1Packed, params.n, params.logQ));
  const c2Entries = params.msgBlocks * 32;
  const c2 = new Int32Array(unpackIntegers(c2Packed, c2Entries, params.logQ));
  return { c1, c2 };
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
  sPrime: Int16Array;   // ephemeral ternary secret
  ePrime: Int16Array;   // error for c1 (length n)
  eDoublePrime: Int16Array; // error for c2 (length msgBlocks·32)
}

/**
 * Expand `coins` (via SHAKE-256, the paper's F) into the ephemeral secret and
 * the two error vectors. Deterministic: the same coins always yield the same
 * randomness, which is exactly what the FO re-encryption check relies on.
 */
function expandCoins(coins: Uint8Array, params: SCloudParams): EncRandomness {
  const c2Len = params.msgBlocks * 32;
  const etaBytesN = Math.ceil((2 * params.eta * params.n) / 8);
  const etaBytesC2 = Math.ceil((2 * params.eta * c2Len) / 8);
  // bytes for ternary permutation (4 per index is plenty) + both error streams
  const ternBytes = params.n * 4;
  const total = ternBytes + etaBytesN + etaBytesC2;
  const stream = shake256(coins, total);

  let off = 0;
  const sPrime = deterministicTernary(stream.subarray(off, off + ternBytes), params.n, params.hw);
  off += ternBytes;
  const ePrime = deterministicCenteredBinomial(stream.subarray(off, off + etaBytesN), params.n, params.eta);
  off += etaBytesN;
  const eDoublePrime = deterministicCenteredBinomial(stream.subarray(off, off + etaBytesC2), c2Len, params.eta);

  return { sPrime, ePrime, eDoublePrime };
}

/** Deterministic constant-weight ternary vector from a byte stream. */
function deterministicTernary(rand: Uint8Array, n: number, hw: number): Int16Array {
  const nPlus = hw >> 1;
  const nMinus = hw >> 1;
  const arr = new Int16Array(n);
  for (let i = 0; i < nPlus; i++) arr[i] = 1;
  for (let i = nPlus; i < nPlus + nMinus; i++) arr[i] = -1;
  // Deterministic Fisher-Yates using the supplied randomness (4 bytes / step)
  for (let i = n - 1; i > 0; i--) {
    const o = (i * 4) % (rand.length - 3);
    const r = (rand[o] | (rand[o + 1] << 8) | (rand[o + 2] << 16) | ((rand[o + 3] & 0x7f) << 24)) >>> 0;
    const j = r % (i + 1);
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

// ── PKE core ──────────────────────────

/**
 * Scloud+.PKE.Enc — deterministic given message `m` and coins.
 * c1 = Aᵀ·s' + e'                       (LWE sample hiding s')
 * c2 = (b·s') + e'' + Encode(m)         (message masked by a shared LWE term)
 */
export function pkeEncrypt(
  pk: SCloudPublicKey, m: Uint8Array, coins: Uint8Array, params: SCloudParams
): SCloudCiphertext {
  const A = generateMatrixA(pk.seedA, params);
  const { sPrime, ePrime, eDoublePrime } = expandCoins(coins, params);

  // c1 = Aᵀ·s' + e'  (mod q)
  const ATs = matTransVecMul(A, sPrime, params.n, params.q);
  const c1 = vecAdd(ATs, ePrime, params.n, params.q);

  // shared scalar  b·s'  (mod q) — the demo's stand-in for B'·s'
  let bDotS = 0;
  for (let i = 0; i < params.n; i++) bDotS += pk.b[i] * sPrime[i];
  bDotS = ((bDotS % params.q) + params.q) % params.q;

  const encoded = bw32EncodeMessage(m, params.msgBlocks, params.q);
  const c2Len = params.msgBlocks * 32;
  const c2 = new Int32Array(c2Len);
  for (let i = 0; i < c2Len; i++) {
    c2[i] = (((bDotS + eDoublePrime[i] + encoded[i]) % params.q) + params.q) % params.q;
  }
  return { c1, c2 };
}

/**
 * Scloud+.PKE.Dec — recover the message.
 * v = c2 − (s·c1);  m' = BW₃₂-decode(v)
 */
export function pkeDecrypt(sk: SCloudSecretKey, ct: SCloudCiphertext, params: SCloudParams): Uint8Array {
  let sDotC1 = 0;
  for (let i = 0; i < params.n; i++) sDotC1 += sk.s[i] * ct.c1[i];
  sDotC1 = ((sDotC1 % params.q) + params.q) % params.q;

  const c2Len = params.msgBlocks * 32;
  const v = new Int32Array(c2Len);
  for (let i = 0; i < c2Len; i++) {
    v[i] = (((ct.c2[i] - sDotC1) % params.q) + params.q) % params.q;
  }
  const decoded = bw32DecodeMessage(v, params.msgBlocks, params.q);
  return decoded.slice(0, params.msgBytes);
}

// ── KEM (KeyGen / Encaps / Decaps) ──────

/**
 * Scloud+.KEM.KeyGen — Algorithm 9.
 *   s ← ternary(n, hw);  e ← ρ(η)
 *   b = A·s + e ;  pk = (seedA, b)
 *   sk = (s, pk, H(pk), z)
 */
export function keyGen(params: SCloudParams): SCloudKeyPair {
  const seedA = randomBytes(params.seedBytes);
  const A = generateMatrixA(seedA, params);
  const s = sampleTernarySecret(params.n, params.hw);
  const e = sampleCenteredBinomial(params.n, params.eta);
  const As = matVecMul(A, s, params.n, params.q);
  const b = vecAdd(As, e, params.n, params.q);

  const pk: SCloudPublicKey = { seedA, b };
  const hPk = H(pk, params);
  const z = randomBytes(32);
  const sk: SCloudSecretKey = { s, pk, hPk, z };
  return { pk, sk };
}

/**
 * Scloud+.KEM.Encaps — Algorithm 10.
 *   m ← random ;  (coins, k) = G(m ‖ H(pk))
 *   C = Enc(pk, m, coins) ;  ss = K(k ‖ C)
 */
export function encaps(pk: SCloudPublicKey, params: SCloudParams): SCloudEncapsResult {
  const r = encapsDetailed(pk, params);
  return { ct: r.ct, ss: r.ss };
}

export interface EncapsDetail extends SCloudEncapsResult {
  m: Uint8Array;
  coins: Uint8Array;
  k: Uint8Array;
}

export function encapsDetailed(pk: SCloudPublicKey, params: SCloudParams): EncapsDetail {
  const m = randomBytes(params.msgBytes);
  const hPk = H(pk, params);
  const { coins, k } = G(m, hPk);
  const ct = pkeEncrypt(pk, m, coins, params);
  const ss = K(k, serializeCiphertext(ct, params), params.ssBytes);
  return { ct, ss, m, coins, k };
}

/**
 * Scloud+.KEM.Decaps — Algorithm 11 (FO with implicit rejection).
 *   m' = Dec(sk, C)
 *   (coins', k') = G(m' ‖ H(pk))
 *   C' = Enc(pk, m', coins')
 *   ss = K(k' ‖ C)  if C == C'   else   K(z ‖ C)
 */
export function decaps(sk: SCloudSecretKey, ct: SCloudCiphertext, params: SCloudParams): Uint8Array {
  return decapsDetailed(sk, ct, params).ss;
}

export interface DecapsDetail {
  mPrime: Uint8Array;
  ctPrime: SCloudCiphertext;
  reEncMatch: boolean;   // did re-encryption reproduce the ciphertext?
  rejected: boolean;     // implicit-rejection path taken?
  ss: Uint8Array;
}

export function decapsDetailed(
  sk: SCloudSecretKey, ct: SCloudCiphertext, params: SCloudParams
): DecapsDetail {
  const mPrime = pkeDecrypt(sk, ct, params);
  const { coins, k } = G(mPrime, sk.hPk);
  const ctPrime = pkeEncrypt(sk.pk, mPrime, coins, params);

  const ctBytes = serializeCiphertext(ct, params);
  const ctPrimeBytes = serializeCiphertext(ctPrime, params);
  const reEncMatch = constantTimeEquals(ctBytes, ctPrimeBytes);

  const ss = reEncMatch
    ? K(k, ctBytes, params.ssBytes)        // accept: ss = K(k' ‖ C)
    : K(sk.z, ctBytes, params.ssBytes);    // reject: ss = K(z  ‖ C)

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
  // tamper results
  tamperedCt?: SCloudCiphertext;
  ssTampered?: Uint8Array;
  tamperMatch?: boolean;
  tamperDecaps?: DecapsDetail;
  // sizes / display
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
  const sPacked = packIntegers(Array.from(sk.s).map(v => v + 1), 2);
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

// ── Toy LWE demo for Exhibit "The LWE Core" ──────

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
    b[i] = (((sum + e[i]) % q) + q) % q;
  }
  return { A, s, e, b, n, q };
}
