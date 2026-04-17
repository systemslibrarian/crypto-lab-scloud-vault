/**
 * S-Cloud+ Parameter Sets — ePrint 2024/1306 (Wang et al.)
 *
 * Values extracted from the specification tables.
 * Where exact values could not be confirmed from available tables,
 * they are marked with TODO comments.
 *
 * S-Cloud+ is a lattice-based KEM using:
 *   - Ternary secrets with fixed Hamming weight
 *   - Barnes-Wall BW₃₂ lattice coding for error correction
 *   - Standard LWE-based construction with FO transform
 */

export interface SCloudParams {
  name: string;
  /** Lattice dimension */
  n: number;
  /** Number of BW32 blocks (message dimension) = shared-secret bits / 5,
   *  since BW32 encodes 5 bits per 32 dimensions.
   *  m = n_bar * n (in FrodoKEM terms), but here it is c2 length in Zq entries */
  m: number;
  /** Modulus */
  q: number;
  /** log2(q) */
  logQ: number;
  /** Gaussian parameter σ for error sampling */
  sigma: number;
  /** Hamming weight of ternary secret (number of non-zero entries) */
  hw: number;
  /** Shared secret bytes */
  ssBytes: number;
  /** Number of 5-bit message blocks encoded via BW32 */
  msgBlocks: number;
  /** Message length in bytes for the FO transform */
  msgBytes: number;
  /** Seed length for generating A */
  seedBytes: number;
  /** Public key size in bytes */
  pkBytes: number;
  /** Secret key size in bytes */
  skBytes: number;
  /** Ciphertext size in bytes */
  ctBytes: number;
  /** Security level claim */
  securityLevel: number;
}

// S-Cloud+-128: 128-bit post-quantum security
// S-Cloud+ params: n=640, q=2^15=32768 — ePrint 2024/1306 Table 4
// TODO: verify exact pk/sk/ct sizes against ePrint 2024/1306 Table 4
export const SCLOUD_128: SCloudParams = {
  name: 'Scloud+-128',
  n: 640,
  m: 640,  // c2 dimension matches n for this parameter set
  q: 32768,        // 2^15
  logQ: 15,
  sigma: 2.75,     // Gaussian standard deviation — ePrint 2024/1306 Table 4
  hw: 320,         // Hamming weight = n/2 = 320
  ssBytes: 32,     // 256-bit shared secret
  msgBlocks: 52,   // ceil(256/5) = 52 blocks of 5 bits via BW32 (52*5 = 260 >= 256)
  msgBytes: 32,    // 256-bit message
  seedBytes: 32,   // 256-bit seed for A
  // pk = seed_A (32) + b (n * logQ / 8)
  // b: 640 entries × 15 bits = 9600 bits = 1200 bytes
  pkBytes: 1232,   // 32 + 1200 = 1232 — TODO: verify against ePrint 2024/1306 Table 4
  // sk = s (ternary, packed) + pk + H(pk)(32) + seed_rejection(32)
  skBytes: 1552,   // TODO: verify against ePrint 2024/1306 Table 4
  // ct = c1 (n * logQ/8) + c2 (m * logQ/8)
  ctBytes: 2400,   // 1200 + 1200 = 2400 — TODO: verify against ePrint 2024/1306 Table 4
  securityLevel: 128,
};

// S-Cloud+-192: 192-bit post-quantum security
// S-Cloud+ params: n=960, q=2^16=65536 — ePrint 2024/1306 Table 4
// TODO: verify exact values against ePrint 2024/1306 Table 4
export const SCLOUD_192: SCloudParams = {
  name: 'Scloud+-192',
  n: 960,
  m: 960,
  q: 65536,        // 2^16
  logQ: 16,
  sigma: 2.75,     // TODO: verify against ePrint 2024/1306 Table 4
  hw: 480,         // n/2
  ssBytes: 32,
  msgBlocks: 52,
  msgBytes: 32,
  seedBytes: 32,
  // b: 960 * 16 / 8 = 1920
  pkBytes: 1952,   // 32 + 1920 = 1952 — TODO: verify against ePrint 2024/1306 Table 4
  skBytes: 2368,   // TODO: verify against ePrint 2024/1306 Table 4
  ctBytes: 3840,   // 1920 + 1920 — TODO: verify against ePrint 2024/1306 Table 4
  securityLevel: 192,
};

// S-Cloud+-256: 256-bit post-quantum security
// S-Cloud+ params: n=1280, q=2^16=65536 — ePrint 2024/1306 Table 4
// TODO: verify exact values against ePrint 2024/1306 Table 4
export const SCLOUD_256: SCloudParams = {
  name: 'Scloud+-256',
  n: 1280,
  m: 1280,
  q: 65536,        // 2^16
  logQ: 16,
  sigma: 2.75,     // TODO: verify against ePrint 2024/1306 Table 4
  hw: 640,         // n/2
  ssBytes: 32,
  msgBlocks: 52,
  msgBytes: 32,
  seedBytes: 32,
  // b: 1280 * 16 / 8 = 2560
  pkBytes: 2592,   // 32 + 2560 — TODO: verify against ePrint 2024/1306 Table 4
  skBytes: 3136,   // TODO: verify against ePrint 2024/1306 Table 4
  ctBytes: 5120,   // 2560 + 2560 — TODO: verify against ePrint 2024/1306 Table 4
  securityLevel: 256,
};

export const ALL_PARAMS: SCloudParams[] = [SCLOUD_128, SCLOUD_192, SCLOUD_256];

export function getParams(level: 128 | 192 | 256): SCloudParams {
  switch (level) {
    case 128: return SCLOUD_128;
    case 192: return SCLOUD_192;
    case 256: return SCLOUD_256;
  }
}
