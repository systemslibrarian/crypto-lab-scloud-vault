/**
 * Exhibit: References & Further Reading
 * Primary sources for everything claimed in this demo, so learners can verify
 * and go deeper. Grouped by topic.
 */

interface Ref { authors: string; year: string; title: string; venue: string; url: string; }

const SCLOUD: Ref[] = [
  { authors: 'Wang, Zheng, Zhao, Qiu, Zeng, Yuan, Mu, Wang', year: '2024', title: 'Scloud+: An Efficient LWE-based KEM Without Ring/Module Structure', venue: 'IACR ePrint 2024/1306 · SSR 2024', url: 'https://eprint.iacr.org/2024/1306' },
  { authors: 'Wang et al.', year: '2024', title: 'Post-quantum Hybrid ECDHE-Scloud+ Key Exchange for TLS 1.3', venue: 'IETF Internet-Draft (individual, not endorsed)', url: 'https://datatracker.ietf.org/doc/draft-wang-tls-hybrid-ecdh-scloud/' },
];

const STANDARDS: Ref[] = [
  { authors: 'NIST', year: '2024', title: 'ML-KEM (Module-Lattice KEM)', venue: 'FIPS 203', url: 'https://csrc.nist.gov/pubs/fips/203/final' },
  { authors: 'Naehrig, Alkim, Bos, Ducas, Easterbrook, LaMacchia, Longa, Mironov, Nikolaenko, Peikert, Raghunathan, Stebila', year: '2020', title: 'FrodoKEM: Learning With Errors Key Encapsulation', venue: 'NIST PQC / ISO', url: 'https://frodokem.org/' },
];

const IDEAL_SVP: Ref[] = [
  { authors: 'Cramer, Ducas, Peikert, Regev', year: '2016', title: 'Recovering Short Generators of Principal Ideals in Cyclotomic Rings', venue: 'EUROCRYPT 2016 · ePrint 2015/313', url: 'https://eprint.iacr.org/2015/313' },
  { authors: 'Cramer, Ducas, Wesolowski', year: '2017', title: 'Short Stickelberger Class Relations and Application to Ideal-SVP', venue: 'EUROCRYPT 2017 · ePrint 2016/885', url: 'https://eprint.iacr.org/2016/885' },
  { authors: 'Ducas, Plançon, Wesolowski', year: '2019', title: 'On the Shortness of Vectors to be found by the Ideal-SVP Quantum Algorithm', venue: 'CRYPTO 2019 · ePrint 2019/234', url: 'https://eprint.iacr.org/2019/234' },
  { authors: 'Cramer, Ducas, Wesolowski', year: '2021', title: 'Mildly Short Vectors in Cyclotomic Ideal Lattices in Quantum Polynomial Time', venue: 'Journal of the ACM 68(2)', url: 'https://hal.science/hal-03102234' },
  { authors: 'Biasse, Song', year: '2016', title: 'Efficient quantum algorithms for computing class groups and solving the principal ideal problem in arbitrary degree number fields', venue: 'SODA 2016', url: 'https://epubs.siam.org/doi/10.1137/1.9781611974331.ch64' },
];

// Recent work probing whether algebraic structure actually helps attackers.
const MODULE_ANALYSIS: Ref[] = [
  { authors: 'Ducas, Engelberts, de Perthuis', year: '2025', title: 'Predicting Module-Lattice Reduction (answering Kyber’s open question Q8)', venue: 'IACR ePrint 2025/1904', url: 'https://eprint.iacr.org/2025/1904' },
  { authors: 'Ducas, Loyer', year: '2025', title: 'Lattice Reduction via Dense Sublattices: A Cryptanalytic No-Go', venue: 'IACR ePrint 2025/1694', url: 'https://eprint.iacr.org/2025/1694' },
];

// Ongoing general lattice cryptanalysis — why concrete security estimates for
// ALL these schemes keep moving, and why conservative margins matter.
const CRYPTANALYSIS_STATE: Ref[] = [
  { authors: 'Ducas, Pulles', year: '2023', title: 'Does the Dual-Sieve Attack on LWE even Work? (Accurate Score Prediction for Dual-Sieve Attacks)', venue: 'CRYPTO 2023 · ePrint 2023/1850', url: 'https://eprint.iacr.org/2023/1850' },
  { authors: 'Ducas, Engelberts, Loyer', year: '2025', title: "Wagner's Algorithm Provably Runs in Subexponential Time for SIS∞", venue: 'IACR ePrint 2025/575', url: 'https://eprint.iacr.org/2025/575' },
];

// Authoritative guidance favoring conservative / unstructured assumptions.
const GUIDANCE: Ref[] = [
  { authors: 'ANSSI (France)', year: '2022', title: 'ANSSI views on the Post-Quantum Cryptography transition', venue: 'National cybersecurity agency guidance', url: 'https://cyber.gouv.fr/en/publications/anssi-views-post-quantum-cryptography-transition' },
  { authors: 'BSI (Germany)', year: '2024', title: 'Cryptographic Mechanisms: Recommendations and Key Lengths (TR-02102)', venue: 'Federal Office for Information Security', url: 'https://www.bsi.bund.de/EN/Themen/Unternehmen-und-Organisationen/Standards-und-Zertifizierung/Technische-Richtlinien/TR-nach-Thema-sortiert/tr02102/tr02102_node.html' },
];

const FOUNDATIONS: Ref[] = [
  { authors: 'Regev', year: '2005', title: 'On Lattices, Learning with Errors, Random Linear Codes, and Cryptography', venue: 'STOC 2005 · J. ACM 2009', url: 'https://cims.nyu.edu/~regev/papers/qcrypto.pdf' },
  { authors: 'Hofheinz, Hövelmanns, Kiltz', year: '2017', title: 'A Modular Analysis of the Fujisaki-Okamoto Transformation', venue: 'TCC 2017 · ePrint 2017/604', url: 'https://eprint.iacr.org/2017/604' },
  { authors: 'Micciancio, Nicolosi', year: '2008', title: 'Efficient Bounded Distance Decoders for Barnes-Wall Lattices', venue: 'ISIT 2008', url: 'https://cseweb.ucsd.edu/~daniele/papers/BW.html' },
];

export function renderReferences(container: HTMLElement): void {
  container.innerHTML = `
    <p>Everything in this demo traces back to public, primary sources. Use these to verify the
       claims and dig deeper.</p>
    ${group('The scheme itself', SCLOUD)}
    ${group('Standards & the schemes it is compared to', STANDARDS)}
    ${group('Why avoid structured lattices? (the Ideal-SVP / Ring-LWE concern)', IDEAL_SVP)}
    ${group('Does structure actually help attackers? (recent, mixed evidence)', MODULE_ANALYSIS)}
    ${group('The moving target of lattice cryptanalysis (why margins matter)', CRYPTANALYSIS_STATE)}
    ${group('Conservative guidance from national agencies', GUIDANCE)}
    ${group('Foundations (LWE, FO transform, Barnes-Wall decoding)', FOUNDATIONS)}
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
