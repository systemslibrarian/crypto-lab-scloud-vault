# S-Cloud+ Vault

## What It Is

**S-Cloud+ Vault** is a browser-based, interactive demonstration of the **S-Cloud+ Key Encapsulation Mechanism (KEM)**, faithful to the specification published as **ePrint 2024/1306** (Wang, Zheng, Zhao, Qiu, Zeng, Yuan, Mu, Wang — Tsinghua University / Huawei / SDIBC / PBC).

S-Cloud+ is a lattice-based KEM built on the standard Learning With Errors (LWE) problem, distinguished by:
- **Ternary secrets** with fixed Hamming weight (instead of Gaussian secrets)
- **Barnes-Wall BW₃₂ lattice coding** for error correction (instead of no error correction)
- **Fujisaki-Okamoto transform** for IND-CCA2 security

All cryptographic primitives — including SHA-3, SHAKE-128/256, BW₃₂ encoding/decoding, ternary sampling, and the full KEM — are implemented in **pure TypeScript** with no external dependencies. Everything runs entirely in your browser.

## When to Use It

- **Learning** — Understand how S-Cloud+ works by seeing each step visualized
- **Teaching** — Walk students through LWE, ternary secrets, lattice coding, and KEM construction
- **Comparing** — See how S-Cloud+ relates to FrodoKEM and ML-KEM in a side-by-side table
- **Evaluating** — Run real key generation, encapsulation, and decapsulation in the browser

> ⚠️ **Not for production use.** This is an educational tool. Do not use it for real key exchange.

## Live Demo

🔗 **[https://systemslibrarian.github.io/crypto-lab-scloud-vault/](https://systemslibrarian.github.io/crypto-lab-scloud-vault/)**

### Exhibits

| # | Exhibit | Description |
|---|---------|-------------|
| 1 | **The LWE Core** | Interactive toy demo (n=8) of b = As + e mod q |
| 2 | **Ternary Secret Visualizer** | Animated Fisher-Yates shuffle generating weight-n/2 ternary vectors |
| 3 | **BW₃₂ Lattice Coding Explainer** | Encode/decode with noise, error correction radius visualization |
| 4 | **Key Generation** | Full Scloud+-128/192/256 keygen with real parameters |
| 5 | **Encaps + Decaps + Tamper Detection** | Full KEM round-trip with implicit rejection demo |
| 6 | **S-Cloud+ vs FrodoKEM vs ML-KEM** | Three-column comparison table with decision tree |

## How to Run Locally

```bash
git clone https://github.com/systemslibrarian/crypto-lab-scloud-vault.git
cd crypto-lab-scloud-vault
npm install
npm run build
npm run preview
```

Requirements: Node.js 18+ and npm.

For development with hot reload:
```bash
npm run dev
```

## Part of the Crypto-Lab Suite

S-Cloud+ Vault is one exhibit in the **Crypto-Lab** series of browser-based cryptography demonstrations:

| Vault | Scheme | Focus |
|-------|--------|-------|
| **scloud-vault** | S-Cloud+ KEM | Ternary LWE + BW₃₂ lattice coding |
| frodo-vault | FrodoKEM | Plain LWE + Gaussian secrets |
| ml-kem-vault | ML-KEM | Module LWE (NIST FIPS 203) |

Each vault is a standalone Vite + TypeScript app deployable to GitHub Pages.

---

*Whether you eat or drink or whatever you do, do it all for the glory of God. — 1 Corinthians 10:31*
Browser-based S-Cloud+ demo — unstructured LWE KEM with ternary secrets and BW₃₂ lattice coding, faithful to ePrint 2024/1306. China's conservative post-quantum KEM. Part of crypto-lab.
