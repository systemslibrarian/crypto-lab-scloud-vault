import { describe, it, expect } from 'vitest';
import {
  bw32Encode,
  bw32Decode,
  bw32EncodeMessage,
  bw32DecodeMessage,
} from '../src/crypto/bw32';

/**
 * BW32 encode/decode + error-correction-radius tests.
 *
 * The BW32 coder is the reason the KEM tolerates LWE noise: each 5-bit block is
 * spread across a 32-dimensional codeword whose nearest-codeword (FWHT) decoder
 * recovers it as long as the accumulated noise stays inside the correction
 * radius. These tests pin (1) noiseless round-trip for every 5-bit symbol,
 * (2) the actual correction radius against a uniform per-coordinate bias, and
 * (3) the "signed peak, not absolute peak" property the decoder comment claims
 * — which a naive Math.abs() decoder would get wrong.
 */

const q = 4096;
const scale = Math.floor(q / 4); // 1024

describe('bw32Encode / bw32Decode — noiseless round-trip', () => {
  it('recovers every one of the 32 possible 5-bit symbols exactly', () => {
    for (let bits = 0; bits < 32; bits++) {
      const cw = bw32Encode(bits, q);
      expect(cw.length).toBe(32);
      expect(bw32Decode(cw, q)).toBe(bits);
    }
  });

  it('encodes symbol 0 as the constant +scale codeword', () => {
    const cw = bw32Encode(0, q);
    for (const v of cw) expect(v).toBe(scale);
  });
});

describe('bw32Decode — error-correction radius', () => {
  it('corrects a uniform per-coordinate bias up to just under q/4', () => {
    // Adding the same offset N to every coordinate shifts the whole received
    // vector; the correlation with the true codeword stays maximal until the
    // offset reaches q/4 (= scale), where the wrap-around flips the sign.
    for (const bits of [0, 1, 7, 16, 31]) {
      const cw = bw32Encode(bits, q);
      // A bias strictly below scale must still decode correctly.
      const withinRadius = Int32Array.from(cw, (v) => ((v + (scale - 1)) % q + q) % q);
      expect(bw32Decode(withinRadius, q)).toBe(bits);
    }
  });

  it('corrects random small Gaussian-style noise reliably', () => {
    let ok = 0;
    const trials = 400;
    for (let t = 0; t < trials; t++) {
      const bits = t & 31;
      const cw = bw32Encode(bits, q);
      const noisy = Int32Array.from(cw, (v) => {
        // uniform noise in [-scale/2, scale/2] — well inside the radius
        const noise = Math.floor((Math.random() - 0.5) * scale);
        return ((v + noise) % q + q) % q;
      });
      if (bw32Decode(noisy, q) === bits) ok++;
    }
    expect(ok).toBe(trials);
  });

  it('tolerates fully inverting several coordinates (a few hard errors)', () => {
    // Inverting a coordinate is the worst-case per-coordinate error. The BW32
    // codewords have minimum distance high enough to survive a handful of them.
    const bits = 10;
    const cw = bw32Encode(bits, q);
    const noisy = Int32Array.from(cw);
    for (let k = 0; k < 8; k++) noisy[k] = ((q - cw[k]) % q + q) % q;
    expect(bw32Decode(noisy, q)).toBe(bits);
  });
});

describe('bw32Decode — signed-peak (never a negated codeword)', () => {
  it('does NOT decode a globally negated codeword as a valid symbol', () => {
    // The encoder only ever emits +row(m). A globally negated received vector
    // correlates most *negatively* with some row; a wrong Math.abs() decoder
    // would pick that row's index. The correct signed-peak decoder must instead
    // return symbol 0 (the all-+scale constant is the closest true codeword to
    // a negated symbol-0 vector), never the negated index.
    const bits = 13;
    const cw = bw32Encode(bits, q);
    const negated = Int32Array.from(cw, (v) => ((q - v) % q + q) % q);
    const decoded = bw32Decode(negated, q);
    // The key invariant: the decoder never emits the raw "abs-peak" answer for
    // a negated codeword. For a negated non-zero symbol that answer would be
    // `bits`; the signed decoder must NOT return it.
    expect(decoded).not.toBe(bits);
  });
});

describe('bw32EncodeMessage / bw32DecodeMessage — byte round-trip', () => {
  it('round-trips arbitrary byte messages through 5-bit blocks', () => {
    const messages = [
      new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
      new Uint8Array([0x00, 0xff, 0x80, 0x01, 0x7f]),
      new Uint8Array(16).map((_, i) => (i * 37) & 0xff),
    ];
    for (const msg of messages) {
      const numBlocks = Math.ceil((msg.length * 8) / 5);
      const encoded = bw32EncodeMessage(msg, numBlocks, q);
      expect(encoded.length).toBe(numBlocks * 32);
      const decoded = bw32DecodeMessage(encoded, numBlocks, q).slice(0, msg.length);
      expect(Array.from(decoded)).toEqual(Array.from(msg));
    }
  });

  it('round-trips through the KEM message width (128-bit message, 26 blocks)', () => {
    const msg = new Uint8Array(16).map((_, i) => (i * 91 + 7) & 0xff);
    const numBlocks = 26;
    const encoded = bw32EncodeMessage(msg, numBlocks, q);
    const decoded = bw32DecodeMessage(encoded, numBlocks, q).slice(0, 16);
    expect(Array.from(decoded)).toEqual(Array.from(msg));
  });
});
