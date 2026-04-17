/**
 * Utility functions for S-Cloud+ implementation.
 * Modular arithmetic, byte packing, random bytes.
 */

/** Modular reduction to [0, q) */
export function mod(a: number, q: number): number {
  return ((a % q) + q) % q;
}

/** Centered modular reduction to (-q/2, q/2] */
export function modCentered(a: number, q: number): number {
  const r = mod(a, q);
  return r > q / 2 ? r - q : r;
}

/** Cryptographically secure random bytes using Web Crypto API */
export function randomBytes(n: number): Uint8Array {
  const buf = new Uint8Array(n);
  crypto.getRandomValues(buf);
  return buf;
}

/** Pack an array of integers into bytes, each value using `bits` bits (little-endian packing) */
export function packIntegers(values: number[], bits: number): Uint8Array {
  const totalBits = values.length * bits;
  const out = new Uint8Array(Math.ceil(totalBits / 8));
  let bitPos = 0;
  for (const v of values) {
    let val = v;
    let remaining = bits;
    while (remaining > 0) {
      const byteIdx = bitPos >> 3;
      const bitIdx = bitPos & 7;
      const canWrite = Math.min(remaining, 8 - bitIdx);
      const mask = (1 << canWrite) - 1;
      out[byteIdx] |= (val & mask) << bitIdx;
      val >>= canWrite;
      remaining -= canWrite;
      bitPos += canWrite;
    }
  }
  return out;
}

/** Unpack bytes into an array of integers, each using `bits` bits */
export function unpackIntegers(data: Uint8Array, count: number, bits: number): number[] {
  const result = new Array<number>(count);
  let bitPos = 0;
  for (let i = 0; i < count; i++) {
    let val = 0;
    let remaining = bits;
    let shift = 0;
    while (remaining > 0) {
      const byteIdx = bitPos >> 3;
      const bitIdx = bitPos & 7;
      const canRead = Math.min(remaining, 8 - bitIdx);
      const mask = (1 << canRead) - 1;
      val |= ((data[byteIdx] >> bitIdx) & mask) << shift;
      shift += canRead;
      remaining -= canRead;
      bitPos += canRead;
    }
    result[i] = val;
  }
  return result;
}

/** Concatenate multiple Uint8Arrays */
export function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

/** Constant-time comparison of two byte arrays */
export function constantTimeEquals(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

/** Convert bytes to hex string */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Convert hex string to bytes */
export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
