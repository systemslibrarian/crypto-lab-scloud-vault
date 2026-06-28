# crypto-lab-scloud-vault

## What It Is

Scloud+ Explorer is an interactive, **client-side** browser demo that teaches **Scloud+**, a post-quantum Key Encapsulation Mechanism (KEM) from China — ePrint 2024/1306 (Wang et al., Tsinghua / Huawei / PBC), also published at SSR 2024 and proposed as an IETF hybrid-TLS draft.

Scloud+ is a lattice-based KEM built on the **unstructured** Learning With Errors (LWE) problem, featuring **ternary secrets** with fixed Hamming weight, **centered-binomial** error, **Barnes-Wall BW₃₂ lattice coding** for error correction, and a real **Fujisaki-Okamoto transform** (with implicit rejection) for IND-CCA2 security.

Every cryptographic primitive — SHA3-256/512, SHAKE-256, BW₃₂ encode/decode, ternary + binomial sampling, and the full KEM round-trip — is implemented in **pure TypeScript** with zero runtime dependencies, and runs entirely in your browser.

> **Learning tool, not a library.** For readable, fast in-browser demos the KEM uses a faithful but *simplified* single-vector formulation, so the bytes it produces are smaller than the official spec sizes (which are shown alongside, sourced from the paper). The algorithm, security model, and FO transform are real; only the matrix structure is scaled down. Not constant-time, not audited, not for production.

## When to Use It

- Use it to learn how an **unstructured-LWE KEM** differs from structured (module-lattice) schemes like ML-KEM, with to-scale size comparisons against FrodoKEM and ML-KEM.
- Use it to walk a full **KeyGen → Encaps → Decaps → FO check** round-trip on toy parameters, seeing ternary sampling, BW₃₂ coding, and implicit rejection step by step.
- Use it to reason about the **conservative-vs-performance tradeoff** in post-quantum KEM selection, with the real cryptanalysis history laid out honestly.
- Do NOT use it as a library or for production — by design it is a simplified, non-constant-time, unaudited teaching tool, not the official spec implementation.

## Live Demo

**[systemslibrarian.github.io/crypto-lab-scloud-vault](https://systemslibrarian.github.io/crypto-lab-scloud-vault/)**

The demo is organized into twelve sections ordered easiest to deepest, from a plain-English "what is a KEM" explanation through the LWE core (`b = A·s + e mod q`), a ternary-secret visualizer, BW₃₂ lattice encode/decode with a measurable error-correction radius, full Scloud+-128/192/256 key generation, a real Encaps/Decaps round-trip with re-encryption check and tamper/implicit-rejection, to-scale comparisons against FrodoKEM and ML-KEM, a balanced unstructured-vs-structured analysis, live in-browser timing against published cycle counts, a transparency/review section, and primary-source references — no math background needed to start.

## What Can Go Wrong

- **Confusing demo sizes with spec sizes** — the demo's simplified single-vector formulation produces smaller bytes than the official Scloud+ parameter sets; only the spec sizes (shown alongside) reflect real deployments.
- **Treating the implementation as constant-time** — it is not; a real KEM must avoid secret-dependent timing in sampling, decoding, and the FO comparison to resist side-channel attacks.
- **Decryption failures** — LWE KEMs have a non-zero decryption-failure rate; parameters must bound it low enough that an attacker cannot exploit failures to recover the secret.
- **Skipping the FO transform** — the raw LWE PKE is only CPA-secure; the Fujisaki-Okamoto transform with implicit rejection is what provides the IND-CCA2 security needed against active attackers.
- **Less public cryptanalysis than ML-KEM** — Scloud+ is a newer, less-scrutinized proposal; the conservative case for unstructured lattices is a bet on assumptions, not a proof that structured lattices are broken.

## Real-World Usage

- **Post-quantum key establishment** — lattice-based KEMs are the leading approach for replacing classical (RSA/ECDH) key exchange against "harvest-now, decrypt-later" adversaries.
- **Hybrid TLS** — Scloud+ has been proposed as an IETF hybrid-TLS draft, combining a PQ KEM with a classical exchange so security holds if either component survives.
- **Conservative / unstructured-lattice deployments** — FrodoKEM-style unstructured-LWE KEMs are chosen by risk-averse deployments that prefer fewer algebraic-structure assumptions over speed and size.
- **Standardization track** — Scloud+ sits in the academic and standardization pipeline (ePrint 2024/1306, SSR 2024, IETF draft), the same process that produced NIST FIPS 203 (ML-KEM).

## How to Run Locally

```bash
git clone https://github.com/systemslibrarian/crypto-lab-scloud-vault
cd crypto-lab-scloud-vault
npm install
npm run dev
```

## Related Demos

- [crypto-lab-frodo-vault](https://systemslibrarian.github.io/crypto-lab-frodo-vault/) — FrodoKEM, the canonical unstructured-LWE KEM that Scloud+ is benchmarked against.
- [crypto-lab-kyber-vault](https://systemslibrarian.github.io/crypto-lab-kyber-vault/) — ML-KEM (FIPS 203), the standardized structured (module-lattice) KEM.
- [crypto-lab-hqc-vault](https://systemslibrarian.github.io/crypto-lab-hqc-vault/) — HQC, a code-based KEM offering a different post-quantum hardness assumption.
- [crypto-lab-mceliece-gate](https://systemslibrarian.github.io/crypto-lab-mceliece-gate/) — Classic McEliece, the conservative code-based KEM with decades of scrutiny.
- [crypto-lab-pq-families](https://systemslibrarian.github.io/crypto-lab-pq-families/) — overview of the five post-quantum families and where lattice KEMs fit among them.

## What You'll See

Sections are ordered easiest → deepest; no math background needed to start.

| # | Section | Focus |
|---|---------|-------|
| 1 | The Big Picture (Plain English) | What a KEM is, the "safe" analogy, honest Scloud+ vs ML-KEM Q&A — no math |
| 2 | Guided Walkthrough | Click through one full KeyGen → Encaps → Decaps → FO check on toy params (n = 16) |
| 3 | The LWE Core | Interactive toy demo of `b = A·s + e mod q` |
| 4 | Ternary Secret Visualizer | Fisher-Yates shuffle generating weight-n/2 ternary vectors |
| 5 | BW₃₂ Lattice Coding | Encode / decode with noise and a measurable error-correction radius |
| 6 | Key Generation | Full Scloud+-128/192/256 keygen; demo vs official sizes |
| 7 | Encaps, Decaps & the FO Transform | Real round-trip with re-encryption check + tamper / implicit rejection |
| 8 | Scloud+ vs FrodoKEM vs ML-KEM | To-scale size bar charts, structured-vs-unstructured visual, real numbers |
| 9 | Is the Conservative Bet Crazy? | Balanced analysis of unstructured vs structured lattices |
| 10 | Performance | Live in-browser timing + real published cycle counts vs FrodoKEM |
| 11 | Transparency & Review | How much public scrutiny Scloud+ vs ML-KEM has had, and why it matters |
| 12 | References & Further Reading | Primary sources for every claim |

## Accuracy notes

- Official sizes, security levels, decryption-failure rates and cycle counts are taken **verbatim** from ePrint 2024/1306 (Tables 2–8) and the IETF draft.
- The structured-vs-unstructured discussion cites the actual Ideal-SVP cryptanalysis line (Biasse–Song 2016; Cramer–Ducas–Wesolowski 2017/2021; Ducas–Plançon–Wesolowski 2019) and recent module-lattice work (Ducas et al. 2025), and explains, with balance, why the conservative choice is rational without claiming ML-KEM is broken.

---

*One of 120+ browser demos in the [Crypto Lab](https://crypto-lab.systemslibrarian.dev/) suite.*

*"So whether you eat or drink or whatever you do, do it all for the glory of God." — 1 Corinthians 10:31*
