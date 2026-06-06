/**
 * Exhibit: Encapsulation + Decapsulation + the FO transform
 * Staged round-trip (real steps shown one by one) with a REAL Fujisaki-Okamoto
 * re-encryption check, an accept/reject branch visual, and a tamper demo
 * showing implicit rejection.
 */

import {
  keyGen, encaps, decapsDetailed, serializePublicKey, serializeCiphertext,
  deserializeCiphertext, KEMRoundtripResult,
} from '../crypto/kem';
import { ALL_PARAMS, getParams, SCloudParams } from '../crypto/params';
import { bytesToHex, packIntegers } from '../crypto/utils';
import { mountStages } from '../stages';

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

  async function run(tamper: boolean): Promise<void> {
    const level = parseInt(select.value) as 128 | 192 | 256;
    const params = getParams(level);
    runBtn.disabled = tamperBtn.disabled = true;

    output.innerHTML = `<div id="ek-stages"></div><div id="ek-result"></div>`;
    const stagesEl = output.querySelector('#ek-stages') as HTMLElement;
    const resultEl = output.querySelector('#ek-result') as HTMLElement;

    const steps = [
      { id: 'kg', label: 'Generate keypair (B = A·S + E)' },
      { id: 'enc', label: 'Encapsulate → ciphertext C + shared secret K' },
      { id: 'dec', label: 'Decapsulate → recover m′, re-encrypt, check, derive K' },
    ];
    if (tamper) steps.push({ id: 'tamper', label: 'Flip ciphertext bytes → re-decapsulate' });
    const ctrl = mountStages(stagesEl, steps);

    const t0 = performance.now();
    await ctrl.active('kg');
    const { pk, sk } = keyGen(params);
    await ctrl.active('enc');
    const enc = encaps(pk, params);
    await ctrl.active('dec');
    const dec = decapsDetailed(sk, enc.ct, params);

    let tamperedCt, tamperDec;
    if (tamper) {
      await ctrl.active('tamper');
      const cb = serializeCiphertext(enc.ct, params);
      cb[0] ^= 0xff; cb[1] ^= 0xff; cb[Math.min(10, cb.length - 1)] ^= 0xff;
      tamperedCt = deserializeCiphertext(cb, params);
      tamperDec = decapsDetailed(sk, tamperedCt, params);
    }
    ctrl.finish();
    const t1 = performance.now();

    const pkSize = serializePublicKey(pk, params).length;
    const skSize = packIntegers(Array.from(sk.S).map(v => v + 1), 2).length + pkSize + 64;
    const result: KEMRoundtripResult = {
      pk, sk, ct: enc.ct,
      ssEncaps: enc.ss, ssDecaps: dec.ss,
      match: bytesToHex(enc.ss) === bytesToHex(dec.ss),
      decaps: dec,
      seedA: bytesToHex(pk.seedA),
      pkSize, skSize, ctSize: serializeCiphertext(enc.ct, params).length,
    };
    if (tamper && tamperDec) {
      result.tamperedCt = tamperedCt;
      result.ssTampered = tamperDec.ss;
      result.tamperMatch = bytesToHex(enc.ss) === bytesToHex(tamperDec.ss);
      result.tamperDecaps = tamperDec;
    }

    resultEl.innerHTML = renderResult(result, params, t1 - t0, tamper);
    runBtn.disabled = tamperBtn.disabled = false;
  }

  runBtn.addEventListener('click', () => void run(false));
  tamperBtn.addEventListener('click', () => void run(true));
}

/** The FO decision: which branch decapsulation took. */
function foBranch(taken: 'accept' | 'reject'): string {
  return `<div class="fo-branch">
    <div class="fo-branch-card accept ${taken === 'accept' ? '' : 'dim'}">
      <h5>✓ Re-encryption matches → ACCEPT</h5>
      <div class="mono">ss = K(k′ ‖ C)</div>
      <div class="note">Ciphertext is authentic — return the real shared secret.</div>
    </div>
    <div class="fo-branch-card reject ${taken === 'reject' ? '' : 'dim'}">
      <h5>✗ Mismatch → IMPLICIT REJECT</h5>
      <div class="mono">ss = K(z ‖ C)</div>
      <div class="note">Invalid/tampered — return a pseudo-random key from secret seed z. No error leaked.</div>
    </div>
  </div>`;
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
  html += `<div class="result-row src">(demo sizes — official spec sizes are pk ${params.specPkBytes} / ct ${params.specCtBytes} bytes; see the comparison exhibit for why they differ)</div>`;
  html += `<hr style="border-color:var(--border);margin:0.5rem 0">`;
  html += row('SS (encaps)', ssEncHex);
  html += `<div class="result-row"><span class="result-label">SS (decaps):</span> <span class="result-value ${matchCls}">${ssDecHex}</span></div>`;
  html += `<div class="result-row"><span class="result-label">Match:</span> <span class="${matchCls}">${r.match ? '✓ Shared secrets match' : '✗ Mismatch'}</span></div>`;
  html += row('Time', `${ms.toFixed(0)} ms`);
  html += `</div>`;

  html += `<div class="callout ${r.decaps.reEncMatch ? 'good' : 'warn'}">
    <span class="callout-title">FO re-encryption check (honest ciphertext)</span>
    The receiver decrypted m′, re-encrypted it, and compared to the received ciphertext:
    <strong>${r.decaps.reEncMatch ? 'C′ == C' : 'C′ != C'}</strong>. The decapsulator then takes one of two branches:
  </div>`;
  html += foBranch(r.decaps.reEncMatch ? 'accept' : 'reject');

  if (showTamper && r.ssTampered && r.tamperDecaps) {
    const ssTampHex = bytesToHex(r.ssTampered);
    html += `<div class="result-box fade-in" style="margin-top:0.75rem; border-color:var(--danger)">`;
    html += `<div class="result-row" style="color:var(--danger);font-weight:700">⚠ TAMPER DETECTION</div>`;
    html += `<div class="fo-check">
      <div class="fo-box"><span class="lab">Original shared secret</span>${ssEncHex.substring(0, 48)}…</div>
      <div class="fo-eq nomatch">≠</div>
      <div class="fo-box"><span class="lab">From tampered ciphertext</span>${ssTampHex.substring(0, 48)}…</div>
    </div>`;
    html += `<div class="result-row"><span class="result-label">Re-encryption matched?</span>
      <span class="${r.tamperDecaps.reEncMatch ? 'danger' : 'success'}">${r.tamperDecaps.reEncMatch ? 'yes (unexpected)' : 'NO → implicit rejection'}</span></div>`;
    html += `</div>`;
    html += foBranch(r.tamperDecaps.reEncMatch ? 'accept' : 'reject');
    html += `<div class="callout good"><span class="callout-title">Correct IND-CCA2 behavior</span>
      The tampered ciphertext failed the re-encryption check, so decapsulation returned
      <code>K(z ‖ C)</code> — a pseudo-random key from the secret rejection seed <code>z</code>.
      The attacker gets a useless key and <em>no error signal</em> to learn from.</div>`;
  } else if (!showTamper) {
    html += `<div class="callout"><span class="callout-title">Try it</span>
      Hit <strong>🔓 Tamper + Detect</strong> to flip a few ciphertext bytes and watch the FO
      transform take the <em>reject</em> branch.</div>`;
  }

  return html;
}

function row(label: string, value: string): string {
  return `<div class="result-row"><span class="result-label">${label}:</span> <span class="result-value">${value}</span></div>`;
}
