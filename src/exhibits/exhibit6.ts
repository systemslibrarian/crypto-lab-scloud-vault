/**
 * Exhibit: Scloud+ vs FrodoKEM vs ML-KEM
 * Real published sizes (bar charts + table), a structured-vs-unstructured
 * lattice visual, and the cryptanalytic reason Scloud+ avoids ring structure.
 */

import { ALL_PARAMS, getParams, FRODO_REF, MLKEM_REF } from '../crypto/params';

export function renderExhibit6(container: HTMLElement): void {
  container.innerHTML = `
    <p>Three lattice KEMs, three philosophies. <strong>ML-KEM</strong> (NIST FIPS 203) uses
       <em>structured</em> lattices for tiny sizes. <strong>FrodoKEM</strong> uses plain
       <em>unstructured</em> LWE for maximum conservatism but huge sizes. <strong>Scloud+</strong>
       keeps the unstructured foundation but adds ternary secrets + BW₃₂ coding to land much closer
       to practical.</p>

    <div class="summary-chips">
      <div class="summary-chip"><div class="name mlkem">ML-KEM</div><div class="desc">Smallest &amp; fastest. Structured. The NIST standard.</div></div>
      <div class="summary-chip"><div class="name scloud">Scloud+</div><div class="desc">Middle ground: unstructured but far smaller than Frodo.</div></div>
      <div class="summary-chip"><div class="name frodo">FrodoKEM</div><div class="desc">Most conservative. Unstructured. Largest &amp; slowest.</div></div>
    </div>

    <div class="btn-group">
      <label class="inline-label">Security level:
        <select id="cmp-level" class="param-select">
          ${ALL_PARAMS.map(p => `<option value="${p.securityLevel}">${p.securityLevel}-bit</option>`).join('')}
        </select>
      </label>
    </div>

    <h4>Public key size (bytes — smaller is better)</h4>
    <div id="cmp-pk" class="barchart"></div>
    <h4>Ciphertext size (bytes — smaller is better)</h4>
    <div id="cmp-ct" class="barchart"></div>
    <div class="result-row src">Sources: Scloud+ &amp; FrodoKEM from ePrint 2024/1306 Tables 6–8;
       ML-KEM from FIPS 203. The bars are drawn to scale.</div>

    <h4 style="margin-top:1.5rem">Structured vs unstructured lattices</h4>
    <p>Where does the size difference come from? The public matrix <strong>A</strong>. ML-KEM's
       matrix is <em>structured</em>: a tiny seed-row determines the rest, so it barely needs storing.
       Scloud+/FrodoKEM use a fully random matrix — no shortcuts, nothing to exploit, but more to store.</p>
    <div id="lattice-viz" class="lattice-compare"></div>

    <div class="callout why">
      <span class="callout-title">Why would anyone avoid the structure?</span>
      The structure ML-KEM relies on lives in <strong>ideal/module lattices</strong>. Several results
      show quantum algorithms can find short vectors in <em>ideal</em> lattices of cyclotomic fields
      faster than in general lattices — a real hardness <em>gap</em>:
      <ul style="margin:0.5rem 0 0 1.2rem">
        <li>Biasse &amp; Song (2016) — quantum algorithm for the Principal Ideal Problem.</li>
        <li>Cramer, Ducas, Wesolowski (2017) — short Stickelberger relations &amp; Ideal-SVP.</li>
        <li>Cramer, Ducas, Wesolowski (2021) — <em>mildly short vectors in cyclotomic ideal lattices
            in quantum polynomial time</em>.</li>
        <li>Ducas, Plançon, Wesolowski (2019) — how short those vectors actually are.</li>
      </ul>
      <strong>Important nuance:</strong> this is <em>not</em> a break of Ring-/Module-LWE or ML-KEM —
      it does not directly apply to them, and ML-KEM remains unbroken. But it is a legitimate reason
      some groups prefer unstructured LWE for long-term / very-high-security use. Scloud+ and FrodoKEM
      take that conservative bet.
    </div>

    <h4 style="margin-top:1.5rem">Full comparison</h4>
    <div class="table-scroll" role="region" aria-label="KEM comparison table" tabindex="0">
    <table class="comparison-table">
      <thead>
        <tr><th>Property</th><th class="highlight">Scloud+</th><th>FrodoKEM</th><th>ML-KEM</th></tr>
      </thead>
      <tbody>
        <tr><td><strong>Matrix structure</strong></td><td>Unstructured LWE</td><td>Unstructured LWE</td><td>Module-LWE (structured)</td></tr>
        <tr><td><strong>Secret distribution</strong></td><td class="highlight">Ternary {−1,0,+1}, weight n/2</td><td>Rounded Gaussian</td><td>Centered binomial</td></tr>
        <tr><td><strong>Error distribution</strong></td><td>Centered binomial ρ(η)</td><td>Rounded Gaussian</td><td>Centered binomial</td></tr>
        <tr><td><strong>Error correction</strong></td><td class="highlight">BW₃₂ Barnes-Wall code</td><td>None</td><td>None</td></tr>
        <tr><td><strong>CCA transform</strong></td><td>FO, implicit rejection</td><td>FO, implicit rejection</td><td>FO, implicit rejection</td></tr>
        <tr><td><strong>Origin</strong></td><td>Tsinghua / Huawei / SDIBC / PBC (China)</td><td>Microsoft / CWI / NRC (US/EU)</td><td>CRYSTALS team (EU/US)</td></tr>
        <tr><td><strong>Standardization</strong></td><td>ePrint 2024/1306; IETF draft</td><td>NIST alternate; ISO</td><td class="best">NIST FIPS 203 (standard)</td></tr>
        <tr><td><strong>Public scrutiny</strong></td><td>Newer, limited</td><td>Extensive</td><td class="best">Extensive (multi-year)</td></tr>
      </tbody>
    </table>
    </div>

    <div class="decision-tree" role="region" aria-label="Which KEM to choose">
      <div class="question">Which KEM should I use?</div>
      <div class="node"><div class="question">Need a standard right now?</div>
        <div class="node"><span class="answer">→ ML-KEM (FIPS 203)</span> — smallest, fastest, standardized. Relies on structured-lattice assumptions.</div></div>
      <div class="node"><div class="question">Want maximum conservatism, size no object?</div>
        <div class="node"><span class="answer">→ FrodoKEM</span> — plain LWE, no structure, ~10–21 KB keys.</div></div>
      <div class="node"><div class="question">Want unstructured LWE but smaller than FrodoKEM?</div>
        <div class="node"><span class="answer">→ Scloud+</span> — BW₃₂ + ternary secrets shrink the unstructured approach. Newer, less reviewed (see Transparency &amp; Review).</div></div>
    </div>

    <h4 style="margin-top:1.5rem">When would you actually pick each?</h4>
    <div class="scenario-guide">
      <div class="scenario"><span class="pick mlkem">ML-KEM</span><span class="case">A TLS server, phone, or smart card today — you need a standard, small keys, and high speed, and you trust the years of public review.</span></div>
      <div class="scenario"><span class="pick scloud">Scloud+</span><span class="case">You want the conservative unstructured assumption but FrodoKEM's ~10–21 KB keys are too big for your bandwidth/storage — and you can accept a newer, less-reviewed scheme (ideally in a hybrid).</span></div>
      <div class="scenario"><span class="pick frodo">FrodoKEM</span><span class="case">Long-term/state-secret confidentiality where maximum conservatism matters more than size or speed, and you want the most-studied unstructured option.</span></div>
      <div class="scenario"><span class="pick scloud">Hybrid</span><span class="case">Highest assurance: run a structured scheme <em>and</em> an unstructured one together (e.g. ECDHE + Scloud+, as the IETF draft proposes) so a break in either alone isn't fatal.</span></div>
    </div>
  `;

  const levelSel = container.querySelector('#cmp-level') as HTMLSelectElement;
  const pkEl = container.querySelector('#cmp-pk') as HTMLElement;
  const ctEl = container.querySelector('#cmp-ct') as HTMLElement;
  const vizEl = container.querySelector('#lattice-viz') as HTMLElement;

  function draw(): void {
    const level = parseInt(levelSel.value) as 128 | 192 | 256;
    const s = getParams(level);
    const f = FRODO_REF[level];
    const m = MLKEM_REF[level];

    pkEl.innerHTML = barChart([
      { name: 'ML-KEM', val: m.pk, cls: 'mlkem' },
      { name: 'Scloud+', val: s.specPkBytes, cls: 'scloud' },
      { name: 'FrodoKEM', val: f.pk, cls: 'frodo' },
    ]);
    ctEl.innerHTML = barChart([
      { name: 'ML-KEM', val: m.ct, cls: 'mlkem' },
      { name: 'Scloud+', val: s.specCtBytes, cls: 'scloud' },
      { name: 'FrodoKEM', val: f.ct, cls: 'frodo' },
    ]);

    const pctPk = Math.round((s.specPkBytes / f.pk) * 100);
    const pctCt = Math.round((s.specCtBytes / f.ct) * 100);
    pkEl.innerHTML += `<div class="result-row src">Scloud+ public key is ${pctPk}% of FrodoKEM's — and ${(s.specPkBytes / m.pk).toFixed(0)}× ML-KEM's.</div>`;
    ctEl.innerHTML += `<div class="result-row src">Scloud+ ciphertext is ${pctCt}% of FrodoKEM's — and ${(s.specCtBytes / m.ct).toFixed(0)}× ML-KEM's.</div>`;

    vizEl.innerHTML = latticeCard('Structured (ML-KEM)', true) + latticeCard('Unstructured (Scloud+ / Frodo)', false);
  }

  levelSel.addEventListener('change', draw);
  draw();
}

interface Bar { name: string; val: number; cls: string; }

function barChart(bars: Bar[]): string {
  const max = Math.max(...bars.map(b => b.val));
  return bars.map(b => {
    const pct = Math.max(2, (b.val / max) * 100);
    const small = pct < 18;
    // For a very short bar the value would not fit legibly inside the colored
    // fill, so render it as a label sitting on the (neutral) track instead —
    // that keeps its text/background contrast measurable and AA-compliant.
    const inner = small ? '' : b.val.toLocaleString();
    const outer = small
      ? `<span class="bar-value-out" style="left:calc(${pct}% + 6px)">${b.val.toLocaleString()}</span>`
      : '';
    return `<div class="bar-row">
      <div class="bar-label">${b.name}</div>
      <div class="bar-track"><div class="bar-fill ${b.cls} ${small ? 'small' : ''}" style="width:${pct}%">${inner}</div>${outer}</div>
    </div>`;
  }).join('');
}

function latticeCard(title: string, structured: boolean): string {
  const N = 8;
  let cells = '';
  // structured: each row is a cyclic shift of the first → visually banded.
  // unstructured: every cell independent → visually random.
  const firstRow: number[] = [];
  for (let j = 0; j < N; j++) firstRow.push(((j * 53 + 17) % 67) / 67);
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const t = structured ? firstRow[(j - i + N) % N] : ((i * 131 + j * 71 + 29) % 67) / 67;
      const c = Math.round(40 + t * 150);
      const col = structured ? `rgb(${40 + Math.round(t * 60)},${c},${Math.round(c * 1.3)})` : `rgb(${c},${Math.round(c * 0.7)},${Math.round(120 + t * 80)})`;
      cells += `<div class="lattice-cell" style="background:${col}"></div>`;
    }
  }
  const note = structured
    ? 'One short row (a seed) generates every other row by rotation. Tiny to store — but that regularity is the algebraic structure attacks target.'
    : 'Every entry is independent and random. Nothing to exploit, nothing to compress — so the key is large.';
  return `<div class="lattice-card">
    <h4>${title}</h4>
    <div class="lattice-grid" style="grid-template-columns:repeat(${N},1fr)">${cells}</div>
    <div class="lattice-note">${note}</div>
  </div>`;
}
