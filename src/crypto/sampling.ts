/**
 * Ternary secret and Gaussian error sampling for S-Cloud+.
 * ePrint 2024/1306 — Section 3 (Key Generation).
 *
 * Ternary secrets s ∈ {-1, 0, 1}^n with Hamming weight exactly n/2:
 *   - n/4 entries of +1
 *   - n/4 entries of -1
 *   - n/2 entries of 0
 *
 * Error terms sampled from a rounded Gaussian with parameter σ.
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

/**
 * Sample a Gaussian error vector of length n with parameter σ.
 * Uses the Box-Muller transform with rounding to nearest integer.
 *
 * Per ePrint 2024/1306, error distribution is (rounded) Gaussian.
 */
export function sampleGaussianError(n: number, sigma: number): Int16Array {
  const result = new Int16Array(n);
  const buf = new Uint8Array(8);

  for (let i = 0; i < n; i += 2) {
    // Box-Muller: two uniform [0,1) → two standard normals
    let u1: number, u2: number;
    do {
      crypto.getRandomValues(buf);
      u1 = bytesToFloat(buf, 0);
      u2 = bytesToFloat(buf, 4);
    } while (u1 === 0); // Avoid log(0)

    const mag = sigma * Math.sqrt(-2 * Math.log(u1));
    const angle = 2 * Math.PI * u2;
    result[i] = Math.round(mag * Math.cos(angle));
    if (i + 1 < n) {
      result[i + 1] = Math.round(mag * Math.sin(angle));
    }
  }

  return result;
}

/**
 * Convert 4 random bytes to a float in [0, 1).
 */
function bytesToFloat(buf: Uint8Array, offset: number): number {
  const u32 = (buf[offset] | (buf[offset + 1] << 8) |
    (buf[offset + 2] << 16) | ((buf[offset + 3] & 0x7F) << 24)) >>> 0;
  return u32 / 0x80000000;
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
