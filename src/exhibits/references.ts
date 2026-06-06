/**
 * Exhibit: References & Further Reading
 * Primary sources for everything claimed in this demo, so learners can verify
 * and go deeper. Grouped by topic.
 */

interface Ref { authors: string; year: string; title: string; venue: string; url: string; }

const SCLOUD: Ref[] = [
  { authors: 'Wang, Zheng, Zhao, Qiu, Zeng, Yuan, Mu, Wang', year: '2024', title: 'Scloud+: An Efficient LWE-based KEM Without Ring/Module Structure', venue: 'IACR ePrint 2024/1306 · SSR 2024', url: 'https://eprint.iacr.org/2024/1306' },
  { authors: 'Zheng, Wang, Fan, Zhao, Liu, Zhang', year: '2020', title: 'SCloud: Public Key Encryption and KEM Based on Learning With Errors (the original, predecessor of Scloud+)', venue: 'IACR ePrint 2020/095', url: 'https://eprint.iacr.org/2020/095' },
  { authors: 'Tian, Wei, Xu, Wang, Wang, Qiu, Yao, Zeng', year: '2025', title: 'Fast Scloud+: A Fast Hardware Implementation for the Unstructured LWE-based KEM', venue: 'IACR ePrint 2025/497', url: 'https://eprint.iacr.org/2025/497' },
  { authors: 'Wang et al.', year: '2024', title: 'Post-quantum Hybrid ECDHE-Scloud+ Key Exchange for TLS 1.3', venue: 'IETF Internet-Draft (individual, not endorsed)', url: 'https://datatracker.ietf.org/doc/draft-wang-tls-hybrid-ecdh-scloud/' },
];

const STANDARDS: Ref[] = [
  { authors: 'NIST', year: '2024', title: 'ML-KEM (Module-Lattice KEM)', venue: 'FIPS 203', url: 'https://csrc.nist.gov/pubs/fips/203/final' },
  { authors: 'Naehrig, Alkim, Bos, Ducas, Easterbrook, LaMacchia, Longa, Mironov, Nikolaenko, Peikert, Raghunathan, Stebila', year: '2020', title: 'FrodoKEM: Learning With Errors Key Encapsulation', venue: 'NIST PQC / ISO', url: 'https://frodokem.org/' },
  { authors: 'de Boer, van Woerden', year: '2025', title: 'Lattice-based Cryptography: A survey on the security of the NIST finalists (Kyber/Dilithium/Falcon)', venue: 'IACR ePrint 2025/304', url: 'https://eprint.iacr.org/2025/304' },
];

// Independent cryptanalysis OF Scloud+ — early, but it has begun.
const SCLOUD_ATTACKS: Ref[] = [
  { authors: 'Bai, Huang, Duan, Hu', year: '2025', title: 'Efficient Key Recovery via Correlation Power Analysis on Scloud+ (a side-channel attack on an unprotected implementation — not a break of the math)', venue: 'IACR ePrint 2025/721', url: 'https://eprint.iacr.org/2025/721' },
];

const IDEAL_SVP: Ref[] = [
  { authors: 'Ducas', year: '2017', title: 'Advances on Quantum Cryptanalysis of Ideal Lattices (accessible survey — start here)', venue: 'Nieuw Archief voor Wiskunde 5/18', url: 'https://www.nieuwarchief.nl/serie5/pdf/naw5-2017-18-3-184.pdf' },
  { authors: 'Cramer, Ducas, Peikert, Regev', year: '2016', title: 'Recovering Short Generators of Principal Ideals in Cyclotomic Rings', venue: 'EUROCRYPT 2016 · ePrint 2015/313', url: 'https://eprint.iacr.org/2015/313' },
  { authors: 'de Boer, Ducas, Fehr', year: '2019', title: 'On the Quantum Complexity of the Continuous Hidden Subgroup Problem (machinery behind the ideal-SVP attacks)', venue: 'EUROCRYPT 2020 · ePrint 2019/716', url: 'https://eprint.iacr.org/2019/716' },
  { authors: 'de Boer, Ducas, Pellet-Mary, Wesolowski', year: '2020', title: 'Random Self-reducibility of Ideal-SVP via Arakelov Random Walks (evidence FOR ideal-lattice hardness)', venue: 'CRYPTO 2020 · ePrint 2020/297', url: 'https://eprint.iacr.org/2020/297' },
  { authors: 'Cramer, Ducas, Wesolowski', year: '2017', title: 'Short Stickelberger Class Relations and Application to Ideal-SVP', venue: 'EUROCRYPT 2017 · ePrint 2016/885', url: 'https://eprint.iacr.org/2016/885' },
  { authors: 'Ducas, Plançon, Wesolowski', year: '2019', title: 'On the Shortness of Vectors to be found by the Ideal-SVP Quantum Algorithm', venue: 'CRYPTO 2019 · ePrint 2019/234', url: 'https://eprint.iacr.org/2019/234' },
  { authors: 'Cramer, Ducas, Wesolowski', year: '2021', title: 'Mildly Short Vectors in Cyclotomic Ideal Lattices in Quantum Polynomial Time', venue: 'Journal of the ACM 68(2)', url: 'https://hal.science/hal-03102234' },
  { authors: 'Biasse, Song', year: '2016', title: 'Efficient quantum algorithms for computing class groups and solving the principal ideal problem in arbitrary degree number fields', venue: 'SODA 2016', url: 'https://epubs.siam.org/doi/10.1137/1.9781611974331.ch64' },
  { authors: 'Boudgoust, Gachon, Pellet-Mary', year: '2022', title: 'Some Easy Instances of Ideal-SVP (more automorphisms stabilizing an ideal → easier short vectors)', venue: 'CRYPTO 2022 · ePrint 2022/709', url: 'https://eprint.iacr.org/2022/709' },
];

// Recent work probing whether algebraic structure actually helps attackers.
const MODULE_ANALYSIS: Ref[] = [
  { authors: 'Ogilvie', year: '2026', title: 'On the Concrete Hardness Gap Between MLWE and LWE (the "structure = pure efficiency" heuristic fails at realistic parameters)', venue: 'IACR ePrint 2026/279', url: 'https://eprint.iacr.org/2026/279' },
  { authors: 'Hou, Jiang', year: '2026', title: 'Careful with the Ring: Enhanced Hybrid Decoding Attacks against Module/Ring-LWE', venue: 'IACR ePrint 2026/366', url: 'https://eprint.iacr.org/2026/366' },
  { authors: 'Raya, Kumar, Dey, Gangopadhyay', year: '2026', title: 'CoNAN: A Structure-Aware Framework for Lattice Cryptanalysis (algebraic structure exploited to lower attack cost)', venue: 'IACR ePrint 2026/1041', url: 'https://eprint.iacr.org/2026/1041' },
  { authors: 'Ducas, Engelberts, de Perthuis', year: '2025', title: 'Predicting Module-Lattice Reduction (answering Kyber’s open question Q8)', venue: 'IACR ePrint 2025/1904', url: 'https://eprint.iacr.org/2025/1904' },
  { authors: 'Ducas, Loyer', year: '2025', title: 'Lattice Reduction via Dense Sublattices: A Cryptanalytic No-Go', venue: 'IACR ePrint 2025/1694', url: 'https://eprint.iacr.org/2025/1694' },
];

// Ongoing general lattice cryptanalysis — why concrete security estimates for
// ALL these schemes keep moving, and why conservative margins matter.
const CRYPTANALYSIS_STATE: Ref[] = [
  { authors: 'Ducas, Pulles', year: '2023', title: 'Does the Dual-Sieve Attack on Learning with Errors even Work?', venue: 'CRYPTO 2023 · ePrint 2023/302', url: 'https://eprint.iacr.org/2023/302' },
  { authors: 'Ducas, Pulles', year: '2023', title: 'Accurate Score Prediction for Dual-Sieve Attacks', venue: 'IACR ePrint 2023/1850', url: 'https://eprint.iacr.org/2023/1850' },
  { authors: 'Albrecht, Ducas', year: '2021', title: 'Lattice Attacks on NTRU and LWE: A History of Refinements', venue: 'survey · ePrint 2021/799', url: 'https://eprint.iacr.org/2021/799' },
  { authors: 'Ducas, van Woerden', year: '2021', title: 'NTRU Fatigue: How Stretched is Overstretched? (when a STRUCTURED scheme weakens)', venue: 'ASIACRYPT 2021 · ePrint 2021/999', url: 'https://eprint.iacr.org/2021/999' },
  { authors: 'Albrecht, Ducas, Herold, Kirshanova, Postlethwaite, Stevens', year: '2019', title: 'The General Sieve Kernel and New Records in Lattice Reduction (G6K — the practical attack engine)', venue: 'EUROCRYPT 2019 · ePrint 2019/089', url: 'https://eprint.iacr.org/2019/089' },
  { authors: 'Ducas, Pulles, Stevens', year: '2025', title: 'Towards a Modern LLL Implementation (BLASter)', venue: 'IACR ePrint 2025/774', url: 'https://eprint.iacr.org/2025/774' },
];

// Concrete proof that open scrutiny breaks things — other PQC candidates that
// fell soon after publication. Context for why limited review is a real caveat.
const SCRUTINY_CAUGHT: Ref[] = [
  { authors: 'Ducas, Yu', year: '2018', title: 'Learning Strikes Again: the Case of the DRS Signature Scheme (a NIST round-1 candidate, broken)', venue: 'ASIACRYPT 2018 · ePrint 2018/294', url: 'https://eprint.iacr.org/2018/294' },
  { authors: 'de Boer, Ducas, Jeffery, de Wolf', year: '2018', title: 'Attacks on the AJPS Mersenne-based Cryptosystem', venue: 'PQCrypto 2018 · ePrint 2017/1171', url: 'https://eprint.iacr.org/2017/1171' },
];

// Ternary / sparse-secret specific attacks — the trade-off Scloud+'s fixed
// Hamming-weight ternary secret has to manage.
const TERNARY_ATTACKS: Ref[] = [
  { authors: 'May', year: '2021', title: 'How to Meet Ternary LWE Keys (meet-in-the-middle on ternary secrets)', venue: 'CRYPTO 2021 · ePrint 2021/216', url: 'https://eprint.iacr.org/2021/216' },
  { authors: 'Chi, Cho, Kim, Lee', year: '2026', title: 'Asymptotic Analysis of Ternary Sparse LWE', venue: 'IACR ePrint 2026/630', url: 'https://eprint.iacr.org/2026/630' },
  { authors: 'Bi, Liu, Lu, Luo, Wang', year: '2026', title: 'An Improved Hybrid Dual Attack on LWE with Sparse Secrets', venue: 'IACR ePrint 2026/1060', url: 'https://eprint.iacr.org/2026/1060' },
  { authors: 'Hhan, Hong, Kim, Lee, Lee', year: '2026', title: 'From Perfect to Approximate Hints: Efficient LWE Secret Recovery Leveraging Low Hamming Weight', venue: 'IACR ePrint 2026/1081', url: 'https://eprint.iacr.org/2026/1081' },
  { authors: 'Kalam, Sarkar, Meier', year: '2024', title: 'A Combinatorial Attack on Ternary Sparse Learning with Errors (sLWE)', venue: 'IACR ePrint 2024/2007', url: 'https://eprint.iacr.org/2024/2007' },
];

// Authoritative guidance favoring conservative / unstructured assumptions.
const GUIDANCE: Ref[] = [
  { authors: 'ANSSI (France)', year: '2022', title: 'ANSSI views on the Post-Quantum Cryptography transition', venue: 'National cybersecurity agency guidance', url: 'https://cyber.gouv.fr/en/publications/anssi-views-post-quantum-cryptography-transition' },
  { authors: 'BSI (Germany)', year: '2024', title: 'Cryptographic Mechanisms: Recommendations and Key Lengths (TR-02102)', venue: 'Federal Office for Information Security', url: 'https://www.bsi.bund.de/EN/Themen/Unternehmen-und-Organisationen/Standards-und-Zertifizierung/Technische-Richtlinien/TR-nach-Thema-sortiert/tr02102/tr02102_node.html' },
];

// The BW₃₂ / lattice-coding angle — what lets Scloud+ shrink its parameters.
const BW_CODING: Ref[] = [
  { authors: 'Kuninets, Leevik, Malygina, Melnichuk, Nabokov', year: '2025', title: 'On the Construction of Barnes-Wall Lattices and their Application in Cryptography (constructions + Reed-Muller connections)', venue: 'IACR ePrint 2025/1640', url: 'https://eprint.iacr.org/2025/1640' },
  { authors: 'Micciancio, Nicolosi', year: '2008', title: 'Efficient Bounded Distance Decoders for Barnes-Wall Lattices (the BW decoder Scloud+ uses)', venue: 'ISIT 2008', url: 'https://ieeexplore.ieee.org/document/4595427' },
  { authors: 'Lyu, Liu, Lai, Ling, Chen', year: '2022', title: 'Lattice Codes for Lattice-Based PKE', venue: 'Designs, Codes and Cryptography · ePrint 2022/874', url: 'https://eprint.iacr.org/2022/874' },
  { authors: 'Saliba, Luzzi, Ling', year: '2020', title: 'Wyner-Ziv Reconciliation for Key Exchange based on Ring-LWE (Barnes-Wall + bounded-distance decoding in a KEM)', venue: 'IACR ePrint 2020/076', url: 'https://eprint.iacr.org/2020/076' },
  { authors: 'et al.', year: '2024', title: 'Tailorable Codes for Lattice-Based KEMs, with Applications to Compact ML-KEM Instantiations', venue: 'TCHES 2025 · ePrint 2024/1243', url: 'https://eprint.iacr.org/2024/1243' },
];

const FOUNDATIONS: Ref[] = [
  { authors: 'Regev', year: '2005', title: 'On Lattices, Learning with Errors, Random Linear Codes, and Cryptography', venue: 'STOC 2005 · J. ACM 2009', url: 'https://cims.nyu.edu/~regev/papers/qcrypto.pdf' },
  { authors: 'Hofheinz, Hövelmanns, Kiltz', year: '2017', title: 'A Modular Analysis of the Fujisaki-Okamoto Transformation', venue: 'TCC 2017 · ePrint 2017/604', url: 'https://eprint.iacr.org/2017/604' },
];

export function renderReferences(container: HTMLElement): void {
  container.innerHTML = `
    <p>Everything in this demo traces back to public, primary sources. Use these to verify the
       claims and dig deeper.</p>
    ${group('The scheme itself', SCLOUD)}
    ${group('Independent cryptanalysis of Scloud+ (early, but it has started)', SCLOUD_ATTACKS)}
    ${group('Standards & the schemes it is compared to', STANDARDS)}
    ${group('Why avoid structured lattices? (the Ideal-SVP / Ring-LWE concern)', IDEAL_SVP)}
    ${group('Does structure actually help attackers? (recent, mixed evidence)', MODULE_ANALYSIS)}
    ${group('Ternary / sparse-secret attacks (the trade-off ternary secrets manage)', TERNARY_ATTACKS)}
    ${group('The moving target of lattice cryptanalysis (why margins matter)', CRYPTANALYSIS_STATE)}
    ${group('What public scrutiny has caught (other PQC candidates broken)', SCRUTINY_CAUGHT)}
    ${group('Conservative guidance from national agencies', GUIDANCE)}
    ${group('Barnes-Wall lattices & error-correcting codes for KEMs (the BW₃₂ angle)', BW_CODING)}
    ${group('Foundations (LWE & the FO transform)', FOUNDATIONS)}
    <div class="callout"><span class="callout-title">A note on the comparison</span>
      The Ideal-SVP results above do <strong>not</strong> break Ring-LWE / Module-LWE or ML-KEM.
      They establish a hardness <em>gap</em> between ideal and general lattices, which is the
      published rationale for conservative, unstructured designs like Scloud+ and FrodoKEM.</div>
  `;
}

function group(title: string, refs: Ref[]): string {
  const items = refs.map(r => `
    <li style="margin-bottom:0.6rem">
      <a href="${r.url}" target="_blank" rel="noopener"><strong>${r.title}</strong></a><br>
      <span style="color:var(--text-muted);font-size:0.85rem">${r.authors} (${r.year}) — ${r.venue}</span>
    </li>`).join('');
  return `<h4 style="margin-top:1.25rem">${title}</h4><ul style="list-style:none;margin-left:0">${items}</ul>`;
}
