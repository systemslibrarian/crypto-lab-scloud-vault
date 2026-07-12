import { describe, it, expect } from 'vitest';
import { sha3_256, sha3_512, shake128, shake256 } from '../src/crypto/keccak';

/**
 * FIPS-202 Known-Answer Tests.
 *
 * The whole KEM is deterministic only because Keccak is correct: SHAKE-128
 * expands the public matrix A, SHAKE-256 expands the FO coins, SHA3-256/512 are
 * the H/G hashes. A single wrong rotation offset or round constant would still
 * "look random" and pass a round-trip test while silently diverging from the
 * spec, so we pin the primitives to the published FIPS-202 / NIST CAVP vectors.
 */

const enc = (s: string) => new TextEncoder().encode(s);
const hex = (u: Uint8Array) =>
  Array.from(u).map((b) => b.toString(16).padStart(2, '0')).join('');

describe('SHA3-256 (FIPS 202)', () => {
  it('hashes the empty string', () => {
    expect(hex(sha3_256(new Uint8Array(0)))).toBe(
      'a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a',
    );
  });

  it('hashes "abc"', () => {
    expect(hex(sha3_256(enc('abc')))).toBe(
      '3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532',
    );
  });

  it('always emits exactly 32 bytes', () => {
    expect(sha3_256(enc('anything')).length).toBe(32);
  });
});

describe('SHA3-512 (FIPS 202)', () => {
  it('hashes the empty string', () => {
    expect(hex(sha3_512(new Uint8Array(0)))).toBe(
      'a69f73cca23a9ac5c8b567dc185a756e97c982164fe25859e0d1dcc1475c80a6' +
        '15b2123af1f5f94c11e3e9402c3ac558f500199d95b6d3e301758586281dcd26',
    );
  });

  it('hashes "abc"', () => {
    expect(hex(sha3_512(enc('abc')))).toBe(
      'b751850b1a57168a5693cd924b6b096e08f621827444f70d884f5d0240d2712e' +
        '10e116e9192af3c91a7ec57647e3934057340b4cf408d5a56592f8274eec53f0',
    );
  });

  it('always emits exactly 64 bytes', () => {
    expect(sha3_512(enc('anything')).length).toBe(64);
  });
});

describe('SHAKE-128 XOF (FIPS 202)', () => {
  it('squeezes the documented empty-input prefix', () => {
    expect(hex(shake128(new Uint8Array(0), 32))).toBe(
      '7f9c2ba4e88f827d616045507605853ed73b8093f6efbc88eb1a6eacfa66ef26',
    );
  });

  it('squeezes "abc" to a known 32-byte prefix', () => {
    expect(hex(shake128(enc('abc'), 32))).toBe(
      '5881092dd818bf5cf8a3ddb793fbcba74097d5c526a6d35f97b83351940f2cc8',
    );
  });

  it('is a proper XOF: a longer squeeze extends the shorter one', () => {
    const short = shake128(enc('scloud'), 32);
    const long = shake128(enc('scloud'), 96);
    expect(hex(long.slice(0, 32))).toBe(hex(short));
    expect(long.length).toBe(96);
  });
});

describe('SHAKE-256 XOF (FIPS 202)', () => {
  it('squeezes the documented empty-input prefix', () => {
    expect(hex(shake256(new Uint8Array(0), 32))).toBe(
      '46b9dd2b0ba88d13233b3feb743eeb243fcd52ea62b81b82b50c27646ed5762f',
    );
  });

  it('squeezes "abc" to a known 64-byte value', () => {
    expect(hex(shake256(enc('abc'), 64))).toBe(
      '483366601360a8771c6863080cc4114d8db44530f8f1e1ee4f94ea37e78b5739' +
        'd5a15bef186a5386c75744c0527e1faa9f8726e462a12a4feb06bd8801e751e4',
    );
  });

  it('is a proper XOF: the prefix is stable across output lengths', () => {
    const a = shake256(enc('x'), 40);
    const b = shake256(enc('x'), 200);
    expect(hex(b.slice(0, 40))).toBe(hex(a));
  });

  it('crosses a rate boundary correctly (SHAKE-256 rate = 136 bytes)', () => {
    // Squeezing 300 bytes forces multiple permutation calls in the squeeze
    // phase; the multi-block output must still be self-consistent.
    const out = shake256(enc('rate-boundary'), 300);
    const outPrefix = shake256(enc('rate-boundary'), 136);
    expect(hex(out.slice(0, 136))).toBe(hex(outPrefix));
  });
});
