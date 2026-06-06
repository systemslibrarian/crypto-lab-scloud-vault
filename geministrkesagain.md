# Bug Hunt Results: SCloud+ Demo

## 1. Cryptographic Security Break in `c2` Masking (kem.ts)
**Location:** `src/crypto/kem.ts` -> `pkeEncrypt`
**Description:** 
The demo simplifications replaced the real scheme's matrix $B$ ($m \times \bar{n}$) with a single vector $b$ (length $n$). Consequently, $b \cdot s'$ evaluates to a single scalar `bDotS`. The `c2` ciphertext is then incorrectly constructed by masking every element with this same scalar:
```typescript
for (let i = 0; i < c2Len; i++) {
  c2[i] = (((bDotS + eDoublePrime[i] + encoded[i]) % params.q) + params.q) % params.q;
}
```
This is a catastrophic break in IND-CPA security. It masks a multi-element array (length `msgBlocks * 32`) with the *exact same scalar value* `bDotS`. An attacker can effortlessly cancel out the mask by computing differences between ciphertext elements: `c2[i] - c2[j] = m_i - m_j + e''_i - e''_j`, leaking the encoded BW32 message differences directly. A secure unstructured LWE setup requires a full $B$ matrix so that each encoded message bit/block sequence receives an independent random mask.

## 2. Invalid Soft-Decision Decoding Peak Handling (bw32.ts)
**Location:** `src/crypto/bw32.ts` -> `bw32Decode`
**Description:**
The decoder uses a Fast Walsh-Hadamard Transform (FWHT) and searches for the maximum absolute correlation:
```typescript
const absVal = Math.abs(transform[i]);
// ...
return bestIdx & 0x1f;
```
While using `Math.abs` tests against 64 possible basis vectors (32 positive indices and 32 opposite negations), the encoder (`bw32Encode`) ONLY ever emits the 32 positive vectors. If noise pushes the received vector closest to a *negated* row, that definitively indicates an extreme noise event outside the valid codepsace. Instead of reporting a decoding failure, the decoder blindly takes the index (`bestIdx & 0x1f`) and mistakenly outputs it as valid, silently mapping a completely corrupted block to an arbitrary 5-bit token.

## 3. Highly Biased Deterministic Shuffle (kem.ts)
**Location:** `src/crypto/kem.ts` -> `deterministicTernary`
**Description:**
To select 4 bytes of randomness for each Fisher-Yates shuffle iteration, the function accesses overlapping slice offsets from the generated stream:
```typescript
const o = (i * 4) % (rand.length - 3);
```
Since `rand` only contains `n * 4` bytes drawn via `expandCoins`, the loop wraps around `rand.length - 3` and forces the shuffle algorithm to reuse overlapping 4-byte windows for permutations rather than extracting independent, non-overlapping values from the XOF stream. Since the modulo `rand.length - 3` can share factors with the step size of 4, the offsets sequence cycles prematurely and destroys the uniform distribution of the ternary secret, resulting in severely biased key generation.
