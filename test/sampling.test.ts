import { describe, it, expect } from 'vitest';
import {
  sampleTernarySecret,
  sampleCenteredBinomial,
  deterministicCenteredBinomial,
  binomialHistogram,
} from '../src/crypto/sampling';

/**
 * Distribution / structural tests for the secret + error samplers.
 *
 * Security of the KEM rests on these distributions being right: the ternary
 * secret must have EXACTLY the advertised Hamming weight (n/4 of +1 and n/4 of
 * -1, rest 0) and the error must be centered-binomial in [-eta, eta]. A biased
 * or mis-weighted sampler would still "run" but weaken or break the scheme.
 */

describe('sampleTernarySecret — constant-weight ternary structure', () => {
  it('produces exactly n/4 ones, n/4 minus-ones, rest zero', () => {
    for (const n of [16, 64, 600]) {
      const v = sampleTernarySecret(n);
      let ones = 0;
      let minus = 0;
      let zeros = 0;
      for (const x of v) {
        expect([-1, 0, 1]).toContain(x);
        if (x === 1) ones++;
        else if (x === -1) minus++;
        else zeros++;
      }
      const h = n >> 1;
      expect(ones).toBe(h >> 1);
      expect(minus).toBe(h >> 1);
      expect(zeros).toBe(n - ones - minus);
    }
  });

  it('respects an explicit Hamming weight', () => {
    const n = 100;
    const hw = 40;
    const v = sampleTernarySecret(n, hw);
    const nonZero = Array.from(v).filter((x) => x !== 0).length;
    expect(nonZero).toBe(hw);
  });

  it('is not a fixed permutation — successive samples differ', () => {
    const a = sampleTernarySecret(64);
    const b = sampleTernarySecret(64);
    // Overwhelmingly likely to differ; a constant sampler would fail this.
    expect(Array.from(a)).not.toEqual(Array.from(b));
  });
});

describe('sampleCenteredBinomial — range and shape', () => {
  it('stays within [-eta, eta] for a range of eta', () => {
    for (const eta of [2, 3, 7]) {
      const v = sampleCenteredBinomial(5000, eta);
      for (const x of v) {
        expect(x).toBeGreaterThanOrEqual(-eta);
        expect(x).toBeLessThanOrEqual(eta);
      }
    }
  });

  it('is centered at zero and symmetric (mean ~ 0)', () => {
    const eta = 7;
    const N = 20000;
    const v = sampleCenteredBinomial(N, eta);
    let sum = 0;
    for (const x of v) sum += x;
    const mean = sum / N;
    // Variance is eta/2; std of the mean ~ sqrt(eta/2/N). 0.1 is very generous.
    expect(Math.abs(mean)).toBeLessThan(0.1);
  });

  it('has 0 as its modal value (peaked at the center)', () => {
    const eta = 3;
    const v = sampleCenteredBinomial(20000, eta);
    const hist = binomialHistogram(v, eta);
    const zeroBin = hist[eta]; // index eta corresponds to value 0
    for (let i = 0; i < hist.length; i++) {
      if (i !== eta) expect(zeroBin).toBeGreaterThan(hist[i]);
    }
  });
});

describe('deterministicCenteredBinomial — reproducibility for the FO transform', () => {
  it('is a pure function of its input byte stream', () => {
    const bytes = new Uint8Array(64).map((_, i) => (i * 53 + 11) & 0xff);
    const a = deterministicCenteredBinomial(bytes, 32, 3);
    const b = deterministicCenteredBinomial(bytes, 32, 3);
    expect(Array.from(a)).toEqual(Array.from(b));
  });

  it('changes when the input stream changes', () => {
    const b1 = new Uint8Array(64).map((_, i) => i & 0xff);
    const b2 = new Uint8Array(64).map((_, i) => (i + 1) & 0xff);
    const a = deterministicCenteredBinomial(b1, 32, 3);
    const b = deterministicCenteredBinomial(b2, 32, 3);
    expect(Array.from(a)).not.toEqual(Array.from(b));
  });
});
