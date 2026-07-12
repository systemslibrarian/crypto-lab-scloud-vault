import { describe, it, expect } from 'vitest';
import {
  keyGen,
  encaps,
  encapsDetailed,
  decaps,
  decapsDetailed,
  pkeEncrypt,
  pkeDecrypt,
  fullRoundtrip,
  serializePublicKey,
  deserializePublicKey,
  serializeCiphertext,
  deserializeCiphertext,
} from '../src/crypto/kem';
import { getParams, SCLOUD_128, type SCloudParams } from '../src/crypto/params';

/**
 * KEM correctness tests: the round-trip, the FO implicit-rejection guard, and
 * the fact that decapsulation reads the ACTUAL transmitted ciphertext (not a
 * cached copy of the encapsulator's secret). These are the properties a
 * "faked crypto" implementation would fail.
 *
 * A small but real parameter set (n = 96, all the same machinery as the shipped
 * sets) keeps the heavy tests fast; one test also runs the real Scloud+-128
 * set as a smoke check that the shipped parameters actually round-trip.
 */

const hex = (u: Uint8Array) =>
  Array.from(u).map((b) => b.toString(16).padStart(2, '0')).join('');

// A genuine (not toy-faked) small Scloud+ instance: real matrix-LWE + ternary +
// binomial + BW32 + FO, just with small dimensions so keygen is fast.
const SMALL: SCloudParams = {
  ...SCLOUD_128,
  name: 'Scloud+-test',
  n: 96,
  hw: 48,
  eta: 3,
  msgBlocks: 26,
  msgBytes: 16,
  ssBytes: 16,
  m: 26 * 32,
};

describe('KEM round-trip (Encaps agrees with Decaps)', () => {
  it('derives the same shared secret on both sides (small real params)', () => {
    for (let i = 0; i < 5; i++) {
      const { pk, sk } = keyGen(SMALL);
      const { ct, ss } = encaps(pk, SMALL);
      const ss2 = decaps(sk, ct, SMALL);
      expect(hex(ss2)).toBe(hex(ss));
      expect(ss.length).toBe(SMALL.ssBytes);
    }
  });

  it('round-trips the real shipped Scloud+-128 parameters', () => {
    const params = getParams(128);
    const { pk, sk } = keyGen(params);
    const { ct, ss } = encaps(pk, params);
    expect(hex(decaps(sk, ct, params))).toBe(hex(ss));
  }, 20000);

  it('two independent keypairs yield different shared secrets', () => {
    const a = keyGen(SMALL);
    const b = keyGen(SMALL);
    const ea = encaps(a.pk, SMALL);
    const eb = encaps(b.pk, SMALL);
    expect(hex(ea.ss)).not.toBe(hex(eb.ss));
  });
});

describe('FO transform — implicit rejection on tampered ciphertext', () => {
  it('rejects a modified ciphertext and returns a DIFFERENT (pseudo-random) key', () => {
    const { pk, sk } = keyGen(SMALL);
    const { ct, ss } = encaps(pk, SMALL);

    // Flip bytes in the serialized ciphertext, then re-parse.
    const bytes = serializeCiphertext(ct, SMALL);
    bytes[0] ^= 0xff;
    bytes[3] ^= 0x0f;
    const tampered = deserializeCiphertext(bytes, SMALL);

    const detail = decapsDetailed(sk, tampered, SMALL);
    expect(detail.rejected).toBe(true);
    expect(detail.reEncMatch).toBe(false);
    // The rejected key must NOT equal the encapsulated key (implicit rejection
    // returns K(z ‖ ct), a value the attacker cannot predict).
    expect(hex(detail.ss)).not.toBe(hex(ss));
  });

  it('accepts an untampered ciphertext (re-encryption check matches)', () => {
    const { pk, sk } = keyGen(SMALL);
    const { ct } = encaps(pk, SMALL);
    const detail = decapsDetailed(sk, ct, SMALL);
    expect(detail.rejected).toBe(false);
    expect(detail.reEncMatch).toBe(true);
  });

  it('implicit-rejection key is bound to z: a different z gives a different key', () => {
    const { pk, sk } = keyGen(SMALL);
    const { ct } = encaps(pk, SMALL);
    const bytes = serializeCiphertext(ct, SMALL);
    bytes[1] ^= 0xff;
    const tampered = deserializeCiphertext(bytes, SMALL);

    const ss1 = decapsDetailed(sk, tampered, SMALL).ss;
    // Same key material but a different rejection seed z.
    const sk2 = { ...sk, z: sk.z.map((b) => b ^ 0xaa) };
    const ss2 = decapsDetailed(sk2, tampered, SMALL).ss;
    expect(hex(ss1)).not.toBe(hex(ss2));
  });
});

describe('PKE layer — decryption reads the actual ciphertext', () => {
  it('recovers the exact message from a freshly encrypted ciphertext', () => {
    const { pk, sk } = keyGen(SMALL);
    const detail = encapsDetailed(pk, SMALL);
    const recovered = pkeDecrypt(sk, detail.ct, SMALL);
    expect(hex(recovered)).toBe(hex(detail.m));
  });

  it('a one-bit change in the message changes the ciphertext (not a passthrough)', () => {
    const { pk } = keyGen(SMALL);
    const coins = new Uint8Array(32).map((_, i) => (i * 7) & 0xff);
    const m1 = new Uint8Array(SMALL.msgBytes).fill(0);
    const m2 = new Uint8Array(SMALL.msgBytes).fill(0);
    m2[0] = 1;
    const c1 = serializeCiphertext(pkeEncrypt(pk, m1, coins, SMALL), SMALL);
    const c2 = serializeCiphertext(pkeEncrypt(pk, m2, coins, SMALL), SMALL);
    expect(hex(c1)).not.toBe(hex(c2));
  });

  it('same message + same coins is deterministic (FO re-encryption relies on this)', () => {
    const { pk } = keyGen(SMALL);
    const coins = new Uint8Array(32).map((_, i) => (i * 13 + 5) & 0xff);
    const m = new Uint8Array(SMALL.msgBytes).map((_, i) => (i * 3) & 0xff);
    const a = serializeCiphertext(pkeEncrypt(pk, m, coins, SMALL), SMALL);
    const b = serializeCiphertext(pkeEncrypt(pk, m, coins, SMALL), SMALL);
    expect(hex(a)).toBe(hex(b));
  });
});

describe('Serialization round-trips', () => {
  it('public key survives serialize/deserialize', () => {
    const { pk } = keyGen(SMALL);
    const round = deserializePublicKey(serializePublicKey(pk, SMALL), SMALL);
    expect(hex(round.seedA)).toBe(hex(pk.seedA));
    expect(Array.from(round.B)).toEqual(Array.from(pk.B));
  });

  it('ciphertext survives serialize/deserialize and still decapsulates', () => {
    const { pk, sk } = keyGen(SMALL);
    const { ct, ss } = encaps(pk, SMALL);
    const round = deserializeCiphertext(serializeCiphertext(ct, SMALL), SMALL);
    expect(Array.from(round.C1)).toEqual(Array.from(ct.C1));
    expect(Array.from(round.C2)).toEqual(Array.from(ct.C2));
    expect(hex(decaps(sk, round, SMALL))).toBe(hex(ss));
  });
});

describe('fullRoundtrip demo helper', () => {
  it('reports a matching round-trip and a rejected tamper', () => {
    const r = fullRoundtrip(SMALL, true);
    expect(r.match).toBe(true);
    expect(r.tamperMatch).toBe(false);
    expect(r.tamperDecaps?.rejected).toBe(true);
    expect(r.pkSize).toBeGreaterThan(0);
    expect(r.ctSize).toBeGreaterThan(0);
  });
});
