/**
 * Matrix generation for S-Cloud+ using SHAKE-128.
 * ePrint 2024/1306 — Section 3.
 *
 * A is an n×n matrix over Z_q, generated deterministically
 * from a 32-byte seed using SHAKE-128 expansion.
 */

import { shake128 } from './keccak';
import { SCloudParams } from './params';

/**
 * Generate the n×n matrix A from a seed using SHAKE-128.
 * Each entry A[i][j] ∈ [0, q).
 *
 * Method: Expand seed via SHAKE-128 to produce enough bytes,
 * then interpret consecutive `ceil(log2(q))` bits as matrix entries mod q.
 *
 * For efficiency with large n, we use a row-by-row generation:
 * A[i] = SHAKE-128(seed || i) squeezed to produce n entries.
 */
export function generateMatrixA(seed: Uint8Array, params: SCloudParams): Int32Array[] {
  const { n, q, logQ } = params;
  const A: Int32Array[] = new Array(n);

  // Bytes needed per row: n entries × logQ bits, rounded up
  const bytesPerRow = Math.ceil((n * logQ) / 8) + 16; // extra margin

  for (let i = 0; i < n; i++) {
    // Expand seed || row_index via SHAKE-128
    const input = new Uint8Array(seed.length + 2);
    input.set(seed);
    input[seed.length] = i & 0xFF;
    input[seed.length + 1] = (i >> 8) & 0xFF;

    const expanded = shake128(input, bytesPerRow);
    const row = new Int32Array(n);

    // Parse entries from the expanded bytes
    let bitPos = 0;
    for (let j = 0; j < n; j++) {
      let val = 0;
      for (let b = 0; b < logQ; b++) {
        const byteIdx = bitPos >> 3;
        const bitIdx = bitPos & 7;
        val |= ((expanded[byteIdx] >> bitIdx) & 1) << b;
        bitPos++;
      }
      row[j] = val % q;
    }

    A[i] = row;
  }

  return A;
}

/**
 * Matrix-vector product: result = A * v (mod q).
 * A is n×n, v is length n. Returns length-n vector.
 */
export function matVecMul(A: Int32Array[], v: Int16Array, n: number, q: number): Int32Array {
  const result = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      sum += A[i][j] * v[j];
    }
    result[i] = ((sum % q) + q) % q;
  }
  return result;
}

/**
 * Transposed matrix-vector product: result = A^T * v (mod q).
 * A is n×n, v is length n. Returns length-n vector.
 */
export function matTransVecMul(A: Int32Array[], v: Int16Array, n: number, q: number): Int32Array {
  const result = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      sum += A[j][i] * v[j];
    }
    result[i] = ((sum % q) + q) % q;
  }
  return result;
}

/**
 * Inner product of two vectors mod q: result = a^T · b (mod q).
 */
export function innerProduct(a: Int32Array, b: Int16Array, n: number, q: number): number {
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += a[i] * b[i];
  }
  return ((sum % q) + q) % q;
}

/**
 * Vector addition mod q: result[i] = (a[i] + b[i]) mod q.
 */
export function vecAdd(a: Int32Array, b: Int16Array, n: number, q: number): Int32Array {
  const result = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    result[i] = ((a[i] + b[i]) % q + q) % q;
  }
  return result;
}

/**
 * Vector subtraction mod q: result[i] = (a[i] - b[i]) mod q.
 */
export function vecSub(a: Int32Array, b: Int32Array, n: number, q: number): Int32Array {
  const result = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    result[i] = ((a[i] - b[i]) % q + q) % q;
  }
  return result;
}

/**
 * Generate a small toy matrix A for demos (n=8).
 * Uses SHAKE-128 to generate entries mod q.
 */
export function generateToyMatrix(seed: Uint8Array, n: number, q: number): Int32Array[] {
  const expanded = shake128(seed, n * n * 2);
  const A: Int32Array[] = new Array(n);
  let idx = 0;
  for (let i = 0; i < n; i++) {
    A[i] = new Int32Array(n);
    for (let j = 0; j < n; j++) {
      A[i][j] = (expanded[idx] | (expanded[idx + 1] << 8)) % q;
      idx += 2;
    }
  }
  return A;
}
