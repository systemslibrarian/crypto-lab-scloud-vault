# Scloud+ Explorer

An interactive, **client-side** browser demo that teaches **Scloud+**, a post-quantum Key
Encapsulation Mechanism (KEM) from China — ePrint 2024/1306 (Wang et al., Tsinghua / Huawei / PBC),
also published at SSR 2024 and proposed as an IETF hybrid-TLS draft.

Scloud+ is a lattice-based KEM built on the **unstructured** Learning With Errors (LWE) problem,
featuring **ternary secrets** with fixed Hamming weight, **centered-binomial** error, **Barnes-Wall
BW₃₂ lattice coding** for error correction, and a real **Fujisaki-Okamoto transform** (with implicit
rejection) for IND-CCA2 security.

Every cryptographic primitive — SHA3-256/512, SHAKE-256, BW₃₂ encode/decode, ternary + binomial
sampling, and the full KEM round-trip — is implemented in **pure TypeScript** with zero runtime
dependencies, and runs entirely in your browser.

> **Learning tool, not a library.** For readable, fast in-browser demos the KEM uses a faithful but
> *simplified* single-vector formulation, so the bytes it produces are smaller than the official
> spec sizes (which are shown alongside, sourced from the paper). The algorithm, security model, and
> FO transform are real; only the matrix structure is scaled down. Not constant-time, not audited,
> not for production.

## Live Demo

**<https://systemslibrarian.github.io/crypto-lab-scloud-vault/>**

## Run Locally

```bash
git clone https://github.com/systemslibrarian/crypto-lab-scloud-vault.git
cd crypto-lab-scloud-vault
npm install
npm run dev      # or: npm run build && npm run preview
```

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

- Official sizes, security levels, decryption-failure rates and cycle counts are taken **verbatim**
  from ePrint 2024/1306 (Tables 2–8) and the IETF draft.
- The structured-vs-unstructured discussion cites the actual Ideal-SVP cryptanalysis line
  (Biasse–Song 2016; Cramer–Ducas–Wesolowski 2017/2021; Ducas–Plançon–Wesolowski 2019) and recent
  module-lattice work (Ducas et al. 2025), and explains, with balance, why the conservative choice is
  rational without claiming ML-KEM is broken.

## Part of Crypto Lab

One of 90+ live browser demos at
[systemslibrarian.github.io/crypto-lab](https://systemslibrarian.github.io/crypto-lab/) — spanning
Atbash (600 BCE) through NIST FIPS 203/204/205 (2024).

---

*Whether you eat or drink or whatever you do, do it all for the glory of God. — 1 Corinthians 10:31*
