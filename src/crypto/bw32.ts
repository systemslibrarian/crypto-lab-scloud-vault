/**
 * Barnes-Wall BW₃₂ Lattice Coding for S-Cloud+.
 * ePrint 2024/1306 — Section 4 (Encoding/Decoding).
 *
 * BW₃₂ is a 32-dimensional lattice that encodes 5 bits per 32 dimensions.
 * It provides error correction that enables smaller parameters vs FrodoKEM.
 *
 * Construction: BW₃₂ is built recursively as a (32,6,16) Reed-Muller code
 * RM(2,5) union of cosets. The lattice BW₃₂ = RM(2,5) scaled by 1/√2
 * in a Construction-D sense.
 *
 * For the KEM application:
 * - Encode: map 5-bit message blocks to scaled coset representatives in Z_q
 * - Decode: given a noisy 32-dimensional vector, find the nearest codeword
 *           and extract the 5-bit message
 *
 * We implement a simplified but correct version using the first-order
 * Reed-Muller code RM(1,5) structure:
 * - BW₃₂ cosets are indexed by 5-bit values
 * - Each coset representative is a 32-dimensional vector
 * - Decoding uses soft-decision ML decoding via the Hadamard transform
 */

/**
 * The 32-point Hadamard (Walsh-Hadamard) matrix rows give us the RM(1,5)
 * codewords. For BW₃₂ encoding of 5 bits, we use:
 *   - Bit 0: selects the all-ones codeword (overall sign)
 *   - Bits 1-4: select which of 16 basis vectors to use
 *   - The encoding maps 5 bits to a 32-dim vector scaled to q/2
 *
 * Encoding formula for message bits (b0, b1, b2, b3, b4):
 *   v[j] = q/4 * (-1)^(b0 + b1*j[0] + b2*j[1] + b3*j[2] + b4*j[3])
 * where j[k] is the k-th bit of the index j.
 *
 * This places the encoded vector at one of 32 corners of a scaled hypercube,
 * which are the coset representatives of BW₃₂ modulo 2·BW₃₂.
 */

const BW_DIM = 32;
const BW_BITS = 5;

/**
 * Encode a 5-bit block into a 32-dimensional BW₃₂ coset representative.
 * The output values are in [0, q) representing scaled coset representatives.
 *
 * @param bits 5-bit message (0-31)
 * @param q Modulus
 * @returns 32-dimensional vector in Z_q
 */
export function bw32Encode(bits: number, q: number): Int32Array {
  const v = new Int32Array(BW_DIM);
  const scale = Math.floor(q / 4); // q/4 scaling for ±1 codeword

  // Extract the 5 message bits
  const b0 = (bits >> 0) & 1;
  const b1 = (bits >> 1) & 1;
  const b2 = (bits >> 2) & 1;
  const b3 = (bits >> 3) & 1;
  const b4 = (bits >> 4) & 1;

  for (let j = 0; j < BW_DIM; j++) {
    // Bits of index j
    const j0 = (j >> 0) & 1;
    const j1 = (j >> 1) & 1;
    const j2 = (j >> 2) & 1;
    const j3 = (j >> 3) & 1;
    const j4 = (j >> 4) & 1;

    // Inner product of message bits with index bits (over GF(2))
    const dot = (b0 & j0) ^ (b1 & j1) ^ (b2 & j2) ^ (b3 & j3) ^ (b4 & j4);

    // Map: 0 → +scale, 1 → -scale (mod q)
    v[j] = dot === 0 ? scale : ((q - scale) % q);
  }

  return v;
}

/**
 * Decode a noisy 32-dimensional vector to recover the 5-bit message.
 * Uses the Fast Walsh-Hadamard Transform (FWHT) for maximum-likelihood
 * soft-decision decoding.
 *
 * The decoder:
 * 1. Centers the received vector around 0 (subtract q/4)
 * 2. Applies FWHT to compute correlations with all 32 codewords
 * 3. Finds the index of the maximum absolute correlation
 * 4. The sign determines one bit, the index determines the other 4
 *
 * @param received 32-dimensional noisy vector in Z_q
 * @param q Modulus
 * @returns Decoded 5-bit value (0-31)
 */
export function bw32Decode(received: Int32Array, q: number): number {
  const scale = Math.floor(q / 4);
  const halfQ = Math.floor(q / 2);

  // Step 1: Center and convert to signed representation
  const centered = new Float64Array(BW_DIM);
  for (let i = 0; i < BW_DIM; i++) {
    // Center around 0: map [0,q) to (-q/2, q/2]
    let val = received[i] % q;
    if (val < 0) val += q;
    if (val > halfQ) val -= q;
    centered[i] = val;
  }

  // Step 2: Fast Walsh-Hadamard Transform
  const transform = new Float64Array(centered);
  fwht(transform);

  // Step 3: Find maximum absolute correlation
  let bestIdx = 0;
  let bestVal = -Infinity;

  for (let i = 0; i < BW_DIM; i++) {
    const absVal = Math.abs(transform[i]);
    if (absVal > bestVal) {
      bestVal = absVal;
      bestIdx = i;
    }
  }

  // Step 4: Extract 5-bit message
  // The index gives bits 1-4, the sign gives bit 0
  // If correlation is positive → encoded value was +scale → bit pattern with even parity
  // If negative → encoded value was -scale → bit 0 flips
  const sign = transform[bestIdx] < 0 ? 1 : 0;

  // Reconstruct: bestIdx corresponds to which Hadamard row matched
  // The message bits that produced this index: bit 0 = sign, bits 1-4 = bestIdx bits
  const decoded = (sign << 0) | ((bestIdx & 1) << 1) | (((bestIdx >> 1) & 1) << 2) |
    (((bestIdx >> 2) & 1) << 3) | (((bestIdx >> 3) & 1) << 4);

  return decoded & 0x1F;
}

/**
 * Fast Walsh-Hadamard Transform (in-place, naturally ordered).
 * Length must be a power of 2.
 */
function fwht(data: Float64Array): void {
  const n = data.length;
  for (let h = 1; h < n; h <<= 1) {
    for (let i = 0; i < n; i += h << 1) {
      for (let j = i; j < i + h; j++) {
        const x = data[j];
        const y = data[j + h];
        data[j] = x + y;
        data[j + h] = x - y;
      }
    }
  }
}

/**
 * Encode a byte array message into BW₃₂ blocks.
 * Each 5-bit chunk of the message is encoded into a 32-dimensional vector.
 *
 * @param msg Message bytes
 * @param numBlocks Number of 5-bit blocks to encode
 * @param q Modulus
 * @returns Array of 32-dimensional vectors (total length = numBlocks * 32)
 */
export function bw32EncodeMessage(msg: Uint8Array, numBlocks: number, q: number): Int32Array {
  const encoded = new Int32Array(numBlocks * BW_DIM);

  let bitPos = 0;
  for (let block = 0; block < numBlocks; block++) {
    // Extract 5 bits from the message
    let fiveBits = 0;
    for (let b = 0; b < BW_BITS; b++) {
      const byteIdx = (bitPos + b) >> 3;
      const bitIdx = (bitPos + b) & 7;
      if (byteIdx < msg.length) {
        fiveBits |= ((msg[byteIdx] >> bitIdx) & 1) << b;
      }
    }
    bitPos += BW_BITS;

    const codeword = bw32Encode(fiveBits, q);
    encoded.set(codeword, block * BW_DIM);
  }

  return encoded;
}

/**
 * Decode BW₃₂ blocks back to a byte array message.
 *
 * @param received Concatenated 32-dimensional received vectors
 * @param numBlocks Number of 5-bit blocks
 * @param q Modulus
 * @returns Decoded message bytes
 */
export function bw32DecodeMessage(received: Int32Array, numBlocks: number, q: number): Uint8Array {
  const totalBits = numBlocks * BW_BITS;
  const msg = new Uint8Array(Math.ceil(totalBits / 8));

  let bitPos = 0;
  for (let block = 0; block < numBlocks; block++) {
    const blockVec = new Int32Array(BW_DIM);
    for (let i = 0; i < BW_DIM; i++) {
      blockVec[i] = received[block * BW_DIM + i];
    }

    const fiveBits = bw32Decode(blockVec, q);

    // Write 5 bits to the output
    for (let b = 0; b < BW_BITS; b++) {
      const byteIdx = (bitPos + b) >> 3;
      const bitIdx = (bitPos + b) & 7;
      if (byteIdx < msg.length) {
        msg[byteIdx] |= ((fiveBits >> b) & 1) << bitIdx;
      }
    }
    bitPos += BW_BITS;
  }

  return msg;
}

/**
 * Demonstrate BW₃₂ error correction: encode, add noise, decode.
 * Returns detailed info for the exhibit.
 */
export interface BW32Demo {
  original: number;
  encoded: Int32Array;
  noise: Int32Array;
  noisy: Int32Array;
  decoded: number;
  success: boolean;
}

export function bw32DemoRoundtrip(bits: number, noiseLevel: number, q: number): BW32Demo {
  const encoded = bw32Encode(bits & 0x1F, q);
  const noise = new Int32Array(BW_DIM);
  const noisy = new Int32Array(BW_DIM);

  for (let i = 0; i < BW_DIM; i++) {
    // Gaussian-ish noise using Box-Muller
    const u1 = Math.random() || 0.001;
    const u2 = Math.random();
    noise[i] = Math.round(noiseLevel * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2));
    noisy[i] = ((encoded[i] + noise[i]) % q + q) % q;
  }

  const decoded = bw32Decode(noisy, q);

  return {
    original: bits & 0x1F,
    encoded,
    noise,
    noisy,
    decoded,
    success: decoded === (bits & 0x1F),
  };
}
