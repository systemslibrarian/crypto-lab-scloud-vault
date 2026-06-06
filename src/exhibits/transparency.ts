/**
 * Exhibit: Transparency & Review
 * A neutral, beginner-friendly look at how much public cryptanalysis and
 * independent review each scheme has had. The goal is to teach WHY openness and
 * scrutiny matter — not to alarm.
 */

export function renderTransparency(container: HTMLElement): void {
  container.innerHTML = `
    <p>A cryptographic scheme isn't trusted because it looks clever — it's trusted because <strong>many
       independent experts have tried hard to break it and failed</strong>, in the open, for a long
       time. This is the principle of <em>public scrutiny</em>, and it's where Scloud+ and ML-KEM
       differ the most today.</p>

    <div class="callout">
      <span class="callout-title">The core idea (Kerckhoffs's principle)</span>
      Security must rest on the secret <em>key</em>, never on keeping the <em>algorithm</em> secret.
      So algorithms are published, and the whole world is invited to attack them. Surviving that is
      the real evidence of security. "No one I asked could break it" is far weaker than "thousands
      tried in the open for years and couldn't."
    </div>

    <h4>How much review has each had?</h4>
    <div class="scrutiny-grid">
      <div class="scrutiny-card mlkem">
        <h4>ML-KEM (Kyber)</h4>
        <div class="sub">NIST FIPS 203 — standardized 2024</div>
        ${meter('Years of public analysis', 'high', '~8 years')}
        ${meter('Independent cryptanalysis papers', 'high', 'thousands')}
        ${meter('Standards-body review', 'high', 'extensive')}
        <ul>
          <li>Came through the multi-year, fully public NIST PQC competition (2016–2024).</li>
          <li>Three open rounds; every candidate attacked by teams worldwide.</li>
          <li>Parameters were revised in response to public cryptanalysis.</li>
          <li>Now a US federal standard, widely implemented and audited.</li>
        </ul>
      </div>
      <div class="scrutiny-card scloud">
        <h4>Scloud+</h4>
        <div class="sub">ePrint 2024/1306 · SSR 2024 · IETF draft (2024–)</div>
        ${meter('Years of public analysis', 'low', '~1–2 years')}
        ${meter('Independent cryptanalysis papers', 'low', 'few so far')}
        ${meter('Standards-body review', 'med', 'early / draft')}
        <ul>
          <li>Published as a research paper with a full security analysis <em>by its authors</em>.</li>
          <li>Has an individual IETF draft for hybrid TLS 1.3 — explicitly <em>not</em> endorsed by
              the IETF and with no formal standing yet.</li>
          <li>Builds on well-studied ingredients (unstructured LWE, FO, Barnes-Wall codes)…</li>
          <li>…but the specific construction has had limited <em>independent</em> review so far.</li>
          <li>Independent review <em>has begun</em>: a 2025 correlation-power-analysis side-channel
              attack (Bai et al.) already recovers keys from unprotected Scloud+ implementations — not
              a break of the math, but a normal early result and a reminder it needs side-channel
              countermeasures like every PQC scheme.</li>
        </ul>
      </div>
    </div>

    <div class="callout good">
      <span class="callout-title">This is normal — not a red flag</span>
      <strong>Every</strong> trusted algorithm started here. ML-KEM was once brand-new and unproven
      too. New ≠ weak; it means <em>not yet thoroughly tested by the community</em>. The healthy
      response is more open analysis over time, which is exactly the process Scloud+ is entering.
    </div>

    <h4>What ML-KEM's open process looked like</h4>
    <div class="timeline">
      <div class="timeline-item"><span class="timeline-year">2016</span><span class="timeline-text">NIST opens the public Post-Quantum Cryptography competition; anyone may submit and anyone may attack.</span></div>
      <div class="timeline-item"><span class="timeline-year">2017–22</span><span class="timeline-text">Three open rounds. Candidates broken or weakened by public cryptanalysis are dropped or revised.</span></div>
      <div class="timeline-item"><span class="timeline-year">2022</span><span class="timeline-text">Kyber selected for standardization after surviving years of scrutiny.</span></div>
      <div class="timeline-item"><span class="timeline-year">2024</span><span class="timeline-text">Published as ML-KEM in FIPS 203 — a finalized standard.</span></div>
    </div>

    <h4>Why scrutiny matters (a concrete example)</h4>
    <p>Public analysis genuinely changes what we believe is hard. For structured lattices, open
       research uncovered quantum algorithms that find short vectors in <em>ideal</em> lattices
       faster than in general ones — Biasse–Song (2016); Cramer–Ducas–Wesolowski (2017, 2021);
       Ducas–Plançon–Wesolowski (2019). That body of work didn't break ML-KEM, but it's precisely
       <em>why</em> conservative designs like Scloud+ and FrodoKEM avoid that structure. None of that
       insight would exist without open scrutiny — and Scloud+ has simply had far less of it so far.</p>
    <p>Scrutiny also keeps the <em>numbers</em> honest. Concrete attack estimates for every lattice
       scheme are a moving target: e.g. Ducas–Pulles (2023) showed a faster "dual-sieve" attack rests
       on shaky assumptions, so Scloud+ deliberately bases its security on the more conservative
       conventional attack and keeps an ~8-bit safety margin. That's the open process working — and
       it's the kind of independent checking Scloud+ still needs more of.</p>

    <div class="callout">
      <span class="callout-title">Scrutiny has teeth — it really does break things</span>
      This isn't hypothetical. Multiple early post-quantum candidates were broken within months of
      publication once experts looked closely: the DRS lattice-signature scheme (a NIST round-1 entry)
      fell to a learning attack, and the AJPS Mersenne-based cryptosystem was cut down by lattice and
      meet-in-the-middle attacks. That's the open process working as intended — and it's exactly the
      kind of independent stress-testing Scloud+ has had comparatively little of so far. It says
      nothing bad about Scloud+; it just means the evidence isn't in yet.
    </div>

    <div class="takeaway">
      <span class="callout-title">Takeaway for learners</span>
      <p>Judge a scheme by three things: the <strong>assumption</strong> it rests on, the
         <strong>proof</strong> connecting the scheme to that assumption, and the <strong>amount of
         open scrutiny</strong> it has survived. Scloud+ makes a conservative assumption and has a
         reasonable proof — but it's early on scrutiny. ML-KEM makes a slightly bolder assumption and
         has been scrutinized enormously. Understanding that trade-off is the real lesson.</p>
    </div>
  `;
}

function meter(label: string, level: 'high' | 'med' | 'low', value: string): string {
  const pct = level === 'high' ? 100 : level === 'med' ? 45 : 18;
  return `<div class="scrutiny-meter">
    <div class="label"><span>${label}</span><span>${value}</span></div>
    <div class="meter-track"><div class="meter-fill ${level}" style="width:${pct}%"></div></div>
  </div>`;
}
