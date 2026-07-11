/**
 * Exhibit: Performance
 * (1) Live in-browser timing of this demo's keygen/encaps/decaps.
 * (2) The real published cycle counts (paper Tables 5 & 7) comparing Scloud+
 *     against FrodoKEM on the same platform.
 */

import { ALL_PARAMS, getParams, FRODO_REF } from '../crypto/params';
import { keyGen, encaps, decaps } from '../crypto/kem';

export function renderBenchmark(container: HTMLElement): void {
  container.innerHTML = `
    <p>Two views of speed: a <strong>live benchmark</strong> of this simplified browser
       implementation, and the <strong>real published numbers</strong> from the paper (measured in
       CPU cycles on the same machine as FrodoKEM).</p>

    <h4>Live benchmark (this demo, in your browser)</h4>
    <div class="btn-group">
      <select id="bm-level" class="param-select" aria-label="Parameter set for benchmark">
        ${ALL_PARAMS.map(p => `<option value="${p.securityLevel}">${p.name}</option>`).join('')}
      </select>
      <label class="inline-label">Iterations:
        <select id="bm-iters" class="param-select">
          <option value="5" selected>5</option><option value="10">10</option><option value="25">25</option>
        </select>
      </label>
      <button class="btn" id="bm-run">▶ Run benchmark</button>
    </div>
    <div class="callout"><span class="callout-title">Reminder</span>
      These millisecond numbers reflect a <em>simplified, non-optimized, single-threaded JavaScript</em>
      implementation — they are for relative feel only, not a real performance claim.</div>
    <div id="bm-live"></div>

    <h4 style="margin-top:1.5rem">Published performance — Scloud+ vs FrodoKEM</h4>
    <p>From ePrint 2024/1306 (Tables 5 &amp; 7), in 10³ CPU cycles, same platform. Lower is faster.</p>
    <div id="bm-spec"></div>
    <div class="callout why"><span class="callout-title">And ML-KEM?</span>
      ML-KEM is <em>much</em> faster still (structured lattices), typically well under 100k cycles for
      encaps/decaps — but the paper didn't measure it on this platform, so it's left off this
      apples-to-apples chart to avoid a misleading comparison.</div>
  `;

  const levelSel = container.querySelector('#bm-level') as HTMLSelectElement;
  const itersSel = container.querySelector('#bm-iters') as HTMLSelectElement;
  const runBtn = container.querySelector('#bm-run') as HTMLButtonElement;
  const liveEl = container.querySelector('#bm-live') as HTMLElement;
  const specEl = container.querySelector('#bm-spec') as HTMLElement;

  function runLive(): void {
    const level = parseInt(levelSel.value) as 128 | 192 | 256;
    const iters = parseInt(itersSel.value);
    const params = getParams(level);
    runBtn.disabled = true;
    liveEl.innerHTML = `<div class="computing">⏳ Timing ${iters} iterations of ${params.name}…</div>`;

    setTimeout(() => {
      let tKg = 0, tEnc = 0, tDec = 0;
      for (let i = 0; i < iters; i++) {
        let t = performance.now();
        const { pk, sk } = keyGen(params);
        tKg += performance.now() - t;
        t = performance.now();
        const { ct } = encaps(pk, params);
        tEnc += performance.now() - t;
        t = performance.now();
        decaps(sk, ct, params);
        tDec += performance.now() - t;
      }
      const kg = tKg / iters, en = tEnc / iters, de = tDec / iters;
      const max = Math.max(kg, en, de);
      liveEl.innerHTML = `<div class="barchart">
        ${msBar('KeyGen', kg, max)}
        ${msBar('Encaps', en, max)}
        ${msBar('Decaps', de, max)}
        <div class="result-row src">Average over ${iters} runs of ${params.name} (demo n=${params.n}).</div>
      </div>`;
      runBtn.disabled = false;
    }, 30);
  }

  function drawSpec(): void {
    let html = '';
    for (const p of ALL_PARAMS) {
      const f = FRODO_REF[p.securityLevel];
      const sCombined = p.cyclesEncaps + p.cyclesDecaps;
      const fCombined = f.cyclesEncapsDecaps ?? 0;
      const max = Math.max(p.cyclesKeygen, f.cyclesKeygen ?? 0, sCombined, fCombined);
      const pct = Math.round((sCombined / fCombined) * 100);
      html += `<div class="barchart">
        <div class="barchart-title">${p.securityLevel}-bit security — Scloud+ vs ${f.name}</div>
        ${cyBar('Scloud+ keygen', p.cyclesKeygen, max, 'scloud')}
        ${cyBar(f.name + ' keygen', f.cyclesKeygen ?? 0, max, 'frodo')}
        ${cyBar('Scloud+ enc+dec', sCombined, max, 'scloud')}
        ${cyBar(f.name + ' enc+dec', fCombined, max, 'frodo')}
        <div class="result-row src">Scloud+ encaps+decaps is ${pct}% of ${f.name}'s — about ${(100 - pct)}% faster.</div>
      </div>`;
    }
    specEl.innerHTML = html;
  }

  runBtn.addEventListener('click', runLive);
  drawSpec();
  // NOTE: do NOT auto-run the live benchmark — it runs many full KEM round-trips
  // and would freeze the page on load. It runs only when the user clicks.
  liveEl.innerHTML = `<div class="callout"><span class="callout-title">Click “▶ Run benchmark”</span>
    Timing runs on demand so the page opens instantly. (For 256-bit, higher iteration
    counts can take a few seconds — that's the matrix work, single-threaded in JS.)</div>`;
}

function msBar(label: string, ms: number, max: number): string {
  const pct = Math.max(3, (ms / max) * 100);
  return `<div class="bar-row"><div class="bar-label">${label}</div>
    <div class="bar-track"><div class="bar-fill scloud ${pct < 22 ? 'small' : ''}" style="width:${pct}%">${ms.toFixed(1)} ms</div></div></div>`;
}

function cyBar(label: string, cy: number, max: number, cls: string): string {
  const pct = Math.max(3, (cy / max) * 100);
  return `<div class="bar-row"><div class="bar-label">${label}</div>
    <div class="bar-track"><div class="bar-fill ${cls} ${pct < 22 ? 'small' : ''}" style="width:${pct}%">${cy.toLocaleString()}k</div></div></div>`;
}
