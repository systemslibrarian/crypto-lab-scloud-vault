/**
 * Exhibit: Encapsulation + Decapsulation + the FO transform
 * Full encaps/decaps round-trip with a REAL Fujisaki-Okamoto re-encryption
 * check, visualized, plus a tamper demonstration showing implicit rejection.
 */

import { fullRoundtrip, KEMRoundtripResult } from '../crypto/kem';
import { ALL_PARAMS, getParams, SCloudParams } from '../crypto/params';
import { bytesToHex } from '../crypto/utils';

export function renderExhibit5(container: HTMLElement): void {
  container.innerHTML = `
    <p>The full round-trip with real parameters. Scloud+ wraps an IND-CPA encryption scheme in the
       <strong>Fujisaki-Okamoto transform</strong> to get IND-CCA2 security. The key mechanism:
       on decapsulation the receiver <strong>re-encrypts</strong> the recovered message and checks it
       reproduces the ciphertext. If not, it returns a pseudo-random key (<em>implicit rejection</em>) —
       never an error.</p>
    <div class="btn-group">
      <select id="encaps-param-select" class="param-select">
        ${ALL_PARAMS.map(p => `<option value="${p.securityLevel}">${p.name}</option>`).join('')}
      </select>
      <button class="btn" id="encaps-run">▶ Run Encaps + Decaps</button>
      <button class="btn btn-danger" id="encaps-tamper">🔓 Tamper + Detect</button>
    </div>
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
  html += row('Parameter set', params.name);
  html += row('seed_A', r.seedA.substring(0, 32) + '…');
  html += row('Demo pk size', `${r.pkSize} bytes`);
  html += row('Demo ct size', `${r.ctSize} bytes`);
  html += `<div class="result-row src">(demo sizes — the official spec sizes are pk ${params.specPkBytes} / ct ${params.specCtBytes} bytes; see the comparison exhibit for why they differ)</div>`;
  html += `<hr style="border-color:var(--border);margin:0.5rem 0">`;
  html += row('SS (encaps)', ssEncHex);
  html += `<div class="result-row"><span class="result-label">SS (decaps):</span> <span class="result-value ${matchCls}">${ssDecHex}</span></div>`;
  html += `<div class="result-row"><span class="result-label">Match:</span> <span class="${matchCls}">${r.match ? '✓ Shared secrets match' : '✗ Mismatch'}</span></div>`;
  html += row('Time', `${ms.toFixed(0)} ms`);
  html += `</div>`;

  // FO re-encryption check (honest path)
  html += `<div class="callout ${r.decaps.reEncMatch ? 'good' : 'warn'}">
    <span class="callout-title">FO re-encryption check (honest ciphertext)</span>
    The receiver decrypted m′, re-encrypted it, and compared to the received ciphertext:
    <strong>${r.decaps.reEncMatch ? 'C′ == C → accept, ss = K(k′ ‖ C)' : 'C′ != C → would reject'}</strong>.
  </div>`;

  if (showTamper && r.ssTampered && r.tamperDecaps) {
    const ssTampHex = bytesToHex(r.ssTampered);
    html += `<div class="result-box fade-in" style="margin-top:0.5rem; border-color:var(--danger)">`;
    html += `<div class="result-row" style="color:var(--danger);font-weight:700">⚠ TAMPER DETECTION</div>`;
    html += `<div class="fo-check">
      <div class="fo-box"><span class="lab">Original shared secret</span>${ssEncHex.substring(0, 48)}…</div>
      <div class="fo-eq nomatch">≠</div>
      <div class="fo-box"><span class="lab">From tampered ciphertext</span>${ssTampHex.substring(0, 48)}…</div>
    </div>`;
    html += `<div class="result-row"><span class="result-label">Re-encryption matched?</span>
      <span class="${r.tamperDecaps.reEncMatch ? 'danger' : 'success'}">${r.tamperDecaps.reEncMatch ? 'yes (unexpected)' : 'NO → implicit rejection'}</span></div>`;
    html += `<div class="result-row"><span class="result-label">Result differs?</span>
      <span class="${r.tamperMatch ? 'danger' : 'success'}">${r.tamperMatch ? '✗ should differ!' : '✓ different — rejection working'}</span></div>`;
    html += `</div>`;
    html += `<div class="callout good"><span class="callout-title">Correct IND-CCA2 behavior</span>
      The tampered ciphertext failed the re-encryption check, so decapsulation returned
      <code>K(z ‖ C)</code> — a pseudo-random key derived from the secret rejection seed
      <code>z</code>. The attacker gets a useless key and <em>no error signal</em> to learn from.</div>`;
  } else if (!showTamper) {
    html += `<div class="callout"><span class="callout-title">Try it</span>
      Hit <strong>🔓 Tamper + Detect</strong> to flip a few ciphertext bytes and watch the FO
      transform reject it via implicit rejection.</div>`;
  }

  return html;
}

function row(label: string, value: string): string {
  return `<div class="result-row"><span class="result-label">${label}:</span> <span class="result-value">${value}</span></div>`;
}
