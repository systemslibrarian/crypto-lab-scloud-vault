/**
 * Scloud+ Parameter Sets — ePrint 2024/1306 / SSR 2024 (Wang, Zheng, Zhao,
 * Qiu, Zeng, Yuan, Mu, Wang) and the IETF draft
 * draft-wang-tls-hybrid-ecdh-scloud-00.
 *
 * Every published number below is taken verbatim from the paper (Tables 2–8).
 *
 * TWO kinds of numbers live here — keep them straight:
 *
 *   1. SPEC numbers (spec*, sec*, dfrLog2, cycles*). These are the REAL
 *      published values. We display them in comparisons so users see honest,
 *      sourced figures.
 *
 *   2. DEMO computational params (n, q, logQ, eta, hw, msgBlocks). The real
 *      Scloud+ stores B as a full m×n̄ matrix and uses BW₃₂ labeling over the
 *      Gaussian integers Z[i] with modulus switching (q,q1,q2). Doing all that
 *      in the browser for every keygen would be slow and the on-screen vectors
 *      would be unreadable. So our in-browser KEM uses a faithful-but-simplified
 *      single-vector formulation: still real unstructured LWE + ternary secret +
 *      centered-binomial error + BW₃₂-style coding + a real FO transform, just
 *      smaller in structure. The bytes our demo produces therefore do NOT equal
 *      the spec sizes — that is expected and is called out in the UI.
 *
 * Scloud+ design highlights:
 *   - Unstructured LWE (no ring/module structure) — conservative assumption
 *   - Ternary secrets {-1, 0, +1} with fixed Hamming weight n/2
 *   - Centered-binomial error ρ(η)
 *   - Barnes-Wall BW₃₂ lattice coding for error correction
 *   - Fujisaki-Okamoto transform (implicit rejection) for IND-CCA2 security
 */

export interface SCloudParams {
  name: string;
  /** Security level claim (bits) — also selects the parameter set */
  securityLevel: 128 | 192 | 256;

  // ── DEMO computational params (simplified, for the in-browser KEM) ──
  /** Lattice dimension used by the demo KEM */
  n: number;
  /** c2 dimension in Zq entries (demo: derived from msgBlocks) */
  m: number;
  /** Modulus — the REAL Scloud+ modulus q = 2^12 = 4096 (Table 2) */
  q: number;
  /** log2(q) */
  logQ: number;
  /** Centered-binomial parameter η for error sampling (Table 2, η1) */
  eta: number;
  /** Hamming weight of ternary secret = n/2 (number of non-zero entries) */
  hw: number;
  /** Number of 5-bit message blocks encoded via the demo's BW₃₂ coder */
  msgBlocks: number;
  /** Message length in bytes for the FO transform (= lm/8) */
  msgBytes: number;
  /** Shared-secret bytes produced by the demo KEM (= lss/8) */
  ssBytes: number;
  /** Seed length for generating A */
  seedBytes: number;

  // ── SPEC numbers (real, published — IETF draft Table 1 / paper Tables 4–8) ──
  /** Official public key (encapsulation key) size, bytes */
  specPkBytes: number;
  /** Official secret key (decapsulation key) size, bytes */
  specSkBytes: number;
  /** Official ciphertext size, bytes */
  specCtBytes: number;
  /** Official shared-secret size, bytes */
  specSsBytes: number;
  /** Real lattice dimensions (m, n) from Table 2 */
  specMN: [number, number];
  /** Estimated classical security in bits (hybrid attack — Table 4, the lowest) */
  classicalSec: number;
  /** Estimated quantum security in bits (Table 4, lowest column) */
  quantumSec: number;
  /** Decryption-failure-rate exponent: DFR ≈ 2^(-dfrLog2) (Table 4/5) */
  dfrLog2: number;
  /** KeyGen cost in 10^3 CPU cycles (paper Table 5, same platform as Frodo) */
  cyclesKeygen: number;
  /** Encaps cost in 10^3 CPU cycles (Table 5) */
  cyclesEncaps: number;
  /** Decaps cost in 10^3 CPU cycles (Table 5) */
  cyclesDecaps: number;
}

// Scloud+-128 — NIST level 1
export const SCLOUD_128: SCloudParams = {
  name: 'Scloud+-128',
  securityLevel: 128,
  n: 600,
  m: 26 * 32,
  q: 4096, // 2^12
  logQ: 12,
  eta: 7, // η1
  hw: 300, // n/2
  msgBlocks: 26, // ceil(128 / 5) for the demo's 5-bits-per-BW₃₂-block coder
  msgBytes: 16, // lm = 128 bits
  ssBytes: 16, // lss = 128 bits
  seedBytes: 32,
  specPkBytes: 7200,
  specSkBytes: 3168,
  specCtBytes: 5456,
  specSsBytes: 16,
  specMN: [600, 600],
  classicalSec: 136.07,
  quantumSec: 123.49,
  dfrLog2: 134.21,
  cyclesKeygen: 1052,
  cyclesEncaps: 1115,
  cyclesDecaps: 1109,
};

// Scloud+-192 — NIST level 3
export const SCLOUD_192: SCloudParams = {
  name: 'Scloud+-192',
  securityLevel: 192,
  n: 896,
  m: 39 * 32,
  q: 4096,
  logQ: 12,
  eta: 2, // η1
  hw: 448, // n/2
  msgBlocks: 39, // ceil(192 / 5)
  msgBytes: 24, // lm = 192 bits
  ssBytes: 24,
  seedBytes: 32,
  specPkBytes: 11136,
  specSkBytes: 31296,
  specCtBytes: 10832,
  specSsBytes: 24,
  specMN: [928, 896],
  classicalSec: 200.42,
  quantumSec: 183.65,
  dfrLog2: 200.64,
  cyclesKeygen: 2034,
  cyclesEncaps: 2226,
  cyclesDecaps: 2262,
};

// Scloud+-256 — NIST level 5
export const SCLOUD_256: SCloudParams = {
  name: 'Scloud+-256',
  securityLevel: 256,
  n: 1120,
  m: 52 * 32,
  q: 4096,
  logQ: 12,
  eta: 3, // η1
  hw: 560, // n/2
  msgBlocks: 52, // ceil(256 / 5)
  msgBytes: 32, // lm = 256 bits
  ssBytes: 32,
  seedBytes: 32,
  specPkBytes: 18744,
  specSkBytes: 43088,
  specCtBytes: 16916,
  specSsBytes: 32,
  specMN: [1136, 1120],
  classicalSec: 263.11,
  quantumSec: 242.21,
  dfrLog2: 265.74,
  cyclesKeygen: 3564,
  cyclesEncaps: 3738,
  cyclesDecaps: 3884,
};

export const ALL_PARAMS: SCloudParams[] = [SCLOUD_128, SCLOUD_192, SCLOUD_256];

export function getParams(level: 128 | 192 | 256): SCloudParams {
  switch (level) {
    case 128: return SCLOUD_128;
    case 192: return SCLOUD_192;
    case 256: return SCLOUD_256;
  }
}

/**
 * Reference sizes/perf for FrodoKEM and ML-KEM at each security level.
 * FrodoKEM sizes + cycles are from the Scloud+ paper Tables 7–8 (measured on
 * the SAME platform as Scloud+, so the cycle comparison is apples-to-apples).
 * ML-KEM sizes are from FIPS 203; ML-KEM cycles are omitted because the paper
 * did not measure them on this platform (it is structured-LWE and far faster).
 */
export interface KemReference {
  name: string;
  pk: number;
  ct: number;
  ss: number;
  /** combined encaps+decaps cost in 10^3 cycles, same platform (optional) */
  cyclesEncapsDecaps?: number;
  cyclesKeygen?: number;
}

export const FRODO_REF: Record<128 | 192 | 256, KemReference> = {
  128: { name: 'FrodoKEM-640', pk: 9616, ct: 9720, ss: 16, cyclesKeygen: 1375, cyclesEncapsDecaps: 3015 },
  192: { name: 'FrodoKEM-976', pk: 15632, ct: 15744, ss: 24, cyclesKeygen: 2786, cyclesEncapsDecaps: 5807 },
  256: { name: 'FrodoKEM-1344', pk: 21520, ct: 21632, ss: 32, cyclesKeygen: 4906, cyclesEncapsDecaps: 10174 },
};

export const MLKEM_REF: Record<128 | 192 | 256, KemReference> = {
  128: { name: 'ML-KEM-512', pk: 800, ct: 768, ss: 32 },
  192: { name: 'ML-KEM-768', pk: 1184, ct: 1088, ss: 32 },
  256: { name: 'ML-KEM-1024', pk: 1568, ct: 1568, ss: 32 },
};
