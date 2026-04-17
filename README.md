# S-Cloud+ Vault

Interactive browser demo of the **S-Cloud+ Key Encapsulation Mechanism (KEM)** — faithful to ePrint 2024/1306.

S-Cloud+ is a lattice-based KEM built on the standard Learning With Errors (LWE) problem, featuring **ternary secrets** with fixed Hamming weight, **Barnes-Wall BW₃₂ lattice coding** for error correction, and a **Fujisaki-Okamoto transform** for IND-CCA2 security.

All cryptographic primitives — SHA-3, SHAKE-128/256, BW₃₂ encoding/decoding, ternary sampling, and the full KEM — are implemented in **pure TypeScript** with zero external dependencies.

---

## 🛡️ Reality Check

### What this project demonstrates

- Client-side encryption model
- Secure container concept
- Key derivation → encryption flow

### What this project simplifies

- No secure enclave / HSM
- No hardened authentication layer
- No malicious client defense

### What this project is NOT

- Not production-ready secure storage
- Not resistant to XSS or compromised browser
- Not a substitute for audited systems

---

## Live Demo

**<https://systemslibrarian.github.io/crypto-lab-scloud-vault/>**

## Run Locally

```bash
git clone https://github.com/systemslibrarian/crypto-lab-scloud-vault.git
cd crypto-lab-scloud-vault
npm install
npm run build
npm run preview
```

## What You'll See

| # | Exhibit | Focus |
|---|---------|-------|
| 1 | The LWE Core | Interactive toy demo (n = 8) of b = As + e mod q |
| 2 | Ternary Secret Visualizer | Fisher-Yates shuffle generating weight-n/2 ternary vectors |
| 3 | BW₃₂ Lattice Coding Explainer | Encode / decode with noise and error-correction radius |
| 4 | Key Generation | Full S-Cloud+-128/192/256 keygen with real parameters |
| 5 | Encaps + Decaps + Tamper Detection | Full KEM round-trip with implicit rejection demo |
| 6 | S-Cloud+ vs FrodoKEM vs ML-KEM | Three-column comparison table with decision tree |

## Part of Crypto Lab

One of 60+ live browser demos at [systemslibrarian.github.io/crypto-lab](https://systemslibrarian.github.io/crypto-lab/) — spanning Atbash (600 BCE) through NIST FIPS 203/204/205 (2024).

---

*Whether you eat or drink or whatever you do, do it all for the glory of God. — 1 Corinthians 10:31*

---

## 🔐 Security Model

**Encryption algorithm:** AES-256-GCM (or as implemented in S-Cloud+)

**Key derivation:** Argon2id (or as implemented in S-Cloud+)

**Key location:** Client-side only; never leaves the device

**Remote storage:** Only ciphertext is intended to be stored remotely

### Threats Considered
- Data-at-rest exposure
- Network interception

### Threats NOT Covered
- Malicious browser environment
- Keylogging
- XSS / injected scripts
