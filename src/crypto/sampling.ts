/**
 * Ternary secret and centered-binomial error sampling for Scloud+.
 * ePrint 2024/1306 — Sections 3–4 (Key Generation / Encryption).
 *
 * Ternary secrets s ∈ {-1, 0, 1}^n with Hamming weight exactly n/2:
 *   - n/4 entries of +1
 *   - n/4 entries of -1
 *   - n/2 entries of 0
 * (In the paper's matrix form, each column has h = n/4 ones and h minus-ones.)
 *
 * Error terms are sampled from the CENTERED BINOMIAL distribution ρ(η), the
 * same family Kyber/ML-KEM uses (FrodoKEM, by contrast, uses a rounded
 * Gaussian). A sample is Σ_{i=1}^{η}(x_i − y_i) with x_i, y_i ∈ {0,1} fair
 * SIDE-CHANNEL NOTE (teaching tool, not production): these samplers are NOT
 * constant-time. The Fisher-Yates rejection loop branches and iterates a
 * data-dependent number of times, and the binomial reader consumes bits in a
 * value-dependent way. A real deployment must remove such secret-dependent
 * timing (cf. the correlation-power-analysis result in ePrint 2025/721 cited in
 * the References exhibit). See README "What Can Go Wrong".
 *
 * coin flips, giving an integer in [−η, η] with mean 0 and variance η/2.
 */

import { randomBytes } from './utils';

/**
 * Sample a ternary vector of length n with Hamming weight hw = n/2.
 * Exactly n/4 entries are +1, n/4 are -1, n/2 are 0.
 * Uses Fisher-Yates shuffle for uniform random permutation.
 */
export function sampleTernarySecret(n: number, hw?: number): Int16Array {
  const weight = hw ?? (n >> 1);  // Default hw = n/2
  const nPlus = weight >> 1;      // n/4 entries of +1
  const nMinus = weight >> 1;     // n/4 entries of -1
  // Remaining are 0

  // Build the pre-populated array
  const arr = new Int16Array(n);
  for (let i = 0; i < nPlus; i++) arr[i] = 1;
  for (let i = nPlus; i < nPlus + nMinus; i++) arr[i] = -1;
  // Rest already 0

  // Fisher-Yates shuffle using cryptographic randomness
  fisherYatesShuffle(arr);

  return arr;
}

/**
 * Fisher-Yates shuffle using crypto.getRandomValues for uniform randomness.
 * Operates in-place on the array.
 */
export function fisherYatesShuffle(arr: Int16Array): void {
  const n = arr.length;
  // We need random indices — use rejection sampling for uniformity
  for (let i = n - 1; i > 0; i--) {
    const j = uniformRandomBelow(i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
}

/**
 * Returns a uniformly random integer in [0, bound) using rejection sampling.
 */
function uniformRandomBelow(bound: number): number {
  if (bound <= 1) return 0;
  // Find the smallest power of 2 >= bound
  const bits = Math.ceil(Math.log2(bound));
  const mask = (1 << bits) - 1;
  const buf = new Uint8Array(4);
  while (true) {
    crypto.getRandomValues(buf);
    const val = ((buf[0] | (buf[1] << 8) | (buf[2] << 16) | ((buf[3] & 0x7F) << 24))) & mask;
    if (val < bound) return val;
  }
}

// NOTE: a Box-Muller `sampleGaussianError` used to live here, annotated "Per
// ePrint 2024/1306, error distribution is (rounded) Gaussian". That annotation
// was wrong and unsourced: it contradicted this file's own header, params.ts,
// the glossary, the README and the Exhibit 6 comparison table, all of which
// (correctly) attribute the rounded Gaussian to FrodoKEM and give Scloud+ a
// centered-binomial error. The Scloud+ reference implementation confirms it —
// its noise sampler is a binomial-difference kernel (bd2 computes b₁ − b₂ from a
// bit pair, bd4 from a nibble), not a Gaussian CDF table. The function was dead
// code — nothing in src/ or test/ ever called it — so it has been removed rather
// than left to re-seed the same confusion.

/**
 * Sample a centered-binomial error vector of length n with parameter η.
 * Each entry = Σ_{i=1}^{η}(x_i − y_i), drawn from fresh cryptographic randomness.
 * This is the real Scloud+ error distribution ρ(η).
 */
export function sampleCenteredBinomial(n: number, eta: number): Int16Array {
  const result = new Int16Array(n);
  // 2·η coin flips per sample → ceil(2·η·n / 8) bytes of randomness.
  const totalBits = 2 * eta * n;
  const bytes = randomBytes(Math.ceil(totalBits / 8));
  fillCenteredBinomial(result, bytes, eta);
  return result;
}

/**
 * Deterministic centered-binomial sampling from a fixed byte stream.
 * Used by the FO transform so that re-encryption is reproducible.
 */
export function deterministicCenteredBinomial(
  bytes: Uint8Array, n: number, eta: number
): Int16Array {
  const result = new Int16Array(n);
  fillCenteredBinomial(result, bytes, eta);
  return result;
}

/** Shared core: read 2·η bits per entry from `bytes`, x-flips minus y-flips. */
function fillCenteredBinomial(out: Int16Array, bytes: Uint8Array, eta: number): void {
  let bitPos = 0;
  const readBit = (): number => {
    const byteIdx = bitPos >> 3;
    const bit = byteIdx < bytes.length ? (bytes[byteIdx] >> (bitPos & 7)) & 1 : 0;
    bitPos++;
    return bit;
  };
  for (let i = 0; i < out.length; i++) {
    let acc = 0;
    for (let k = 0; k < eta; k++) acc += readBit();
    for (let k = 0; k < eta; k++) acc -= readBit();
    out[i] = acc;
  }
}

/**
 * Build the (count, value) histogram of a centered-binomial-distributed vector,
 * for the educational distribution view. Returns bins from −η..η.
 */
export function binomialHistogram(arr: Int16Array, eta: number): number[] {
  const bins = new Array<number>(2 * eta + 1).fill(0);
  for (let i = 0; i < arr.length; i++) {
    const idx = arr[i] + eta;
    if (idx >= 0 && idx < bins.length) bins[idx]++;
  }
  return bins;
}

/**
 * Sample a ternary vector with visualization callback for animated display.
 * Returns the final array and the sequence of swap steps.
 */
export interface ShuffleStep {
  i: number;
  j: number;
  array: Int16Array;
}

export function sampleTernaryWithSteps(n: number): { result: Int16Array; steps: ShuffleStep[] } {
  const hw = n >> 1;
  const nPlus = hw >> 1;
  const nMinus = hw >> 1;

  const arr = new Int16Array(n);
  for (let i = 0; i < nPlus; i++) arr[i] = 1;
  for (let i = nPlus; i < nPlus + nMinus; i++) arr[i] = -1;

  const steps: ShuffleStep[] = [];
  steps.push({ i: -1, j: -1, array: Int16Array.from(arr) });

  for (let i = n - 1; i > 0; i--) {
    const j = uniformRandomBelow(i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
    steps.push({ i, j, array: Int16Array.from(arr) });
  }

  return { result: arr, steps };
}
