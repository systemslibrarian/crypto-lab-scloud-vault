/**
 * Exhibit 5: Encapsulation + Decapsulation + Tamper Detection
 * Full encap/decap round-trip with tamper demonstration.
 */

import { fullRoundtrip, serializeCiphertext, serializePublicKey, KEMRoundtripResult } from '../crypto/kem';
import { ALL_PARAMS, getParams, SCloudParams } from '../crypto/params';
import { bytesToHex, packIntegers } from '../crypto/utils';

export function renderExhibit5(container: HTMLElement): void {
  container.innerHTML = `
    <p>Full encapsulation/decapsulation round-trip with real parameters.
       The Fujisaki-Okamoto transform ensures <strong>IND-CCA2</strong> security:
       tampered ciphertexts produce a <em>different</em> shared secret (implicit rejection),
       not an error — this is the correct security behavior.</p>
    <div class="btn-group">
      <select id="encaps-param-select" class="param-select">
        ${ALL_PARAMS.map(p => `<option value="${p.securityLevel}">${p.name}</option>`).join('')}
      </select>
      <button class="btn" id="encaps-run">▶ Run Encaps + Decaps</button>
      <button class="btn btn-danger" id="encaps-tamper">🔓 Tamper + Detect</button>
    </div>
    <div class="micro-hint">Encrypted payload is what would be stored remotely. Losing your password results in permanent data loss.</div>
    <div id="encaps-output"></div>
  `;

  const select = container.querySelector('#encaps-param-select') as HTMLSelectElement;
  const runBtn = container.querySelector('#encaps-run') as HTMLButtonElement;
  const tamperBtn = container.querySelector('#encaps-tamper') as HTMLButtonElement;
  const output = container.querySelector('#encaps-output') as HTMLElement;

  function run(tamper: boolean): void {
    const level = parseInt(select.value) as 128 | 192 | 256;
    const params = getParams(level);

    output.innerHTML = `<div class="computing">⏳ Running ${tamper ? 'tamper test' : 'encaps + decaps'} for ${params.name}…</div>`;

    setTimeout(() => {
      const t0 = performance.now();
      const result = fullRoundtrip(params, tamper);
      const t1 = performance.now();

      output.innerHTML = renderResult(result, params, t1 - t0, tamper);
    }, 50);
  }

  runBtn.addEventListener('click', () => run(false));
  tamperBtn.addEventListener('click', () => run(true));
}

function renderResult(r: KEMRoundtripResult, params: SCloudParams, ms: number, showTamper: boolean): string {
  const ssEncHex = bytesToHex(r.ssEncaps);
  const ssDecHex = bytesToHex(r.ssDecaps);
  const matchCls = r.match ? 'success' : 'danger';

  let html = `<div class="result-box fade-in">`;
  html += `<div class="result-row"><span class="result-label">Parameter set:</span> <span class="result-value">${params.name}</span></div>`;
  html += `<div class="result-row"><span class="result-label">seed_A:</span> <span class="result-value">${r.seedA.substring(0, 32)}…</span></div>`;
  html += `<div class="result-row"><span class="result-label">pk size:</span> <span class="result-value">${r.pkSize} bytes</span></div>`;
  html += `<div class="result-row"><span class="result-label">sk size:</span> <span class="result-value">${r.skSize} bytes</span></div>`;
  html += `<div class="result-row"><span class="result-label">ct size:</span> <span class="result-value">${r.ctSize} bytes</span></div>`;

  html += `<hr style="border-color:var(--border);margin:0.5rem 0">`;
  html += `<div class="result-row"><span class="result-label">c1 dimension:</span> <span class="result-value">${params.n}</span></div>`;
  html += `<div class="result-row"><span class="result-label">c2 dimension:</span> <span class="result-value">${params.msgBlocks * 32}</span> (${params.msgBlocks} BW₃₂ blocks × 32)</div>`;

  html += `<hr style="border-color:var(--border);margin:0.5rem 0">`;
  html += `<div class="result-row"><span class="result-label">SS (encaps):</span> <span class="result-value">${ssEncHex}</span></div>`;
  html += `<div class="result-row"><span class="result-label">SS (decaps):</span> <span class="result-value ${matchCls}">${ssDecHex}</span></div>`;
  html += `<div class="result-row"><span class="result-label">Match:</span> <span class="${matchCls}">${r.match ? '✓ Shared secrets match!' : '✗ Mismatch'}</span></div>`;
  html += `<div class="result-row"><span class="result-label">Time:</span> <span class="result-value">${ms.toFixed(0)} ms</span></div>`;
  html += `</div>`;

  if (showTamper && r.ssTampered) {
    const ssTampHex = bytesToHex(r.ssTampered);
    const tamperMatch = r.tamperMatch;

    html += `<div class="result-box fade-in" style="margin-top:0.5rem; border-color:var(--danger)">`;
    html += `<div class="result-row" style="color:var(--danger);font-weight:700">⚠ TAMPER DETECTION</div>`;
    html += `<div class="result-row"><span class="result-label">Original SS:</span> <span class="result-value">${ssEncHex.substring(0, 32)}…</span></div>`;
    html += `<div class="result-row"><span class="result-label">Tampered SS:</span> <span class="result-value danger">${ssTampHex.substring(0, 32)}…</span></div>`;
    html += `<div class="result-row"><span class="result-label">Same?</span> <span class="${tamperMatch ? 'danger' : 'success'}">${tamperMatch ? '✗ Should differ!' : '✓ Different — implicit rejection working correctly'}</span></div>`;
    html += `<div class="result-row" style="color:var(--text-muted);margin-top:0.5rem">
      This is the correct IND-CCA2 behavior: the decapsulator detects the tampered ciphertext
      and returns a pseudorandom shared secret derived from the rejection seed, not an error.
      The attacker cannot distinguish this from a legitimate shared secret.
    </div>`;
    html += `</div>`;
  }

  return html;
}
