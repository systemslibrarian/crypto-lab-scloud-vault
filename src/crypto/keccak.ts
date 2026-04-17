/**
 * Pure TypeScript Keccak-f[1600] permutation and SHA-3 / SHAKE sponge.
 * Needed for SHAKE-128 and SHAKE-256 (matrix A generation in S-Cloud+).
 *
 * Reference: NIST FIPS 202.
 * Uses BigInt for 64-bit lane operations (no external deps).
 */

const ROUNDS = 24;

const RC: bigint[] = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808An,
  0x8000000080008000n, 0x000000000000808Bn, 0x0000000080000001n,
  0x8000000080008081n, 0x8000000000008009n, 0x000000000000008An,
  0x0000000000000088n, 0x0000000080008009n, 0x000000008000000An,
  0x000000008000808Bn, 0x800000000000008Bn, 0x8000000000008089n,
  0x8000000000008003n, 0x8000000000008002n, 0x8000000000000080n,
  0x000000000000800An, 0x800000008000000An, 0x8000000080008081n,
  0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
];

const ROT_OFFSETS: number[] = [
  0,  1, 62, 28, 27,
  36, 44,  6, 55, 20,
  3, 10, 43, 25, 39,
  41, 45, 15, 21,  8,
  18,  2, 61, 56, 14,
];

const PI: number[] = [
  0, 10, 20,  5, 15,
  16,  1, 11, 21,  6,
  7, 17,  2, 12, 22,
  23,  8, 18,  3, 13,
  14, 24,  9, 19,  4,
];

const MASK64 = 0xFFFFFFFFFFFFFFFFn;

function rotl64(x: bigint, n: number): bigint {
  return ((x << BigInt(n)) | (x >> BigInt(64 - n))) & MASK64;
}

function keccakF1600(state: bigint[]): void {
  const C = new Array<bigint>(5);
  const D = new Array<bigint>(5);
  const B = new Array<bigint>(25);

  for (let round = 0; round < ROUNDS; round++) {
    // θ step
    for (let x = 0; x < 5; x++) {
      C[x] = state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20];
    }
    for (let x = 0; x < 5; x++) {
      D[x] = C[(x + 4) % 5] ^ rotl64(C[(x + 1) % 5], 1);
    }
    for (let i = 0; i < 25; i++) {
      state[i] = (state[i] ^ D[i % 5]) & MASK64;
    }

    // ρ and π steps
    for (let i = 0; i < 25; i++) {
      B[PI[i]] = rotl64(state[i], ROT_OFFSETS[i]);
    }

    // χ step
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const idx = x + 5 * y;
        state[idx] = (B[idx] ^ ((~B[(x + 1) % 5 + 5 * y] & MASK64) & B[(x + 2) % 5 + 5 * y])) & MASK64;
      }
    }

    // ι step
    state[0] = (state[0] ^ RC[round]) & MASK64;
  }
}

function bytesToLanes(bytes: Uint8Array, rateBytes: number, state: bigint[]): void {
  for (let i = 0; i < rateBytes; i += 8) {
    let lane = 0n;
    for (let b = 0; b < 8 && i + b < rateBytes; b++) {
      lane |= BigInt(bytes[i + b]) << BigInt(8 * b);
    }
    state[i >> 3] ^= lane;
  }
}

function lanesToBytes(state: bigint[], rateBytes: number, out: Uint8Array, offset: number): number {
  let written = 0;
  for (let i = 0; i < rateBytes && offset + written < out.length; i += 8) {
    const lane = state[i >> 3];
    for (let b = 0; b < 8 && offset + written < out.length; b++) {
      out[offset + written] = Number((lane >> BigInt(8 * b)) & 0xFFn);
      written++;
    }
  }
  return written;
}

/**
 * Keccak sponge: absorb input, squeeze outputLen bytes.
 * @param rate Rate in bytes
 * @param input Input data
 * @param outputLen Desired output length in bytes
 * @param domainByte Domain separation byte (0x06 for SHA-3, 0x1F for SHAKE)
 */
function keccakSponge(rate: number, input: Uint8Array, outputLen: number, domainByte: number): Uint8Array {
  const state = new Array<bigint>(25).fill(0n);

  // Pad: input || domainByte || 0x00* || 0x80
  const padded = new Uint8Array(Math.ceil((input.length + 1) / rate) * rate || rate);
  padded.set(input);
  padded[input.length] = domainByte;
  padded[padded.length - 1] |= 0x80;

  // Absorb
  for (let off = 0; off < padded.length; off += rate) {
    const block = padded.subarray(off, off + rate);
    bytesToLanes(block, rate, state);
    keccakF1600(state);
  }

  // Squeeze
  const output = new Uint8Array(outputLen);
  let pos = 0;
  while (pos < outputLen) {
    const chunk = lanesToBytes(state, rate, output, pos);
    pos += chunk;
    if (pos < outputLen) {
      keccakF1600(state);
    }
  }

  return output;
}

/** SHAKE-128 XOF: arbitrary-length output */
export function shake128(input: Uint8Array, outputLen: number): Uint8Array {
  // SHAKE-128: rate = 1600 - 2*128 = 1344 bits = 168 bytes
  return keccakSponge(168, input, outputLen, 0x1F);
}

/** SHAKE-256 XOF: arbitrary-length output */
export function shake256(input: Uint8Array, outputLen: number): Uint8Array {
  // SHAKE-256: rate = 1600 - 2*256 = 1088 bits = 136 bytes
  return keccakSponge(136, input, outputLen, 0x1F);
}

/** SHA3-256 hash */
export function sha3_256(input: Uint8Array): Uint8Array {
  // SHA3-256: rate = 1600 - 2*256 = 1088 bits = 136 bytes, output = 32 bytes
  return keccakSponge(136, input, 32, 0x06);
}

/** SHA3-512 hash */
export function sha3_512(input: Uint8Array): Uint8Array {
  // SHA3-512: rate = 1600 - 2*512 = 576 bits = 72 bytes, output = 64 bytes
  return keccakSponge(72, input, 64, 0x06);
}
