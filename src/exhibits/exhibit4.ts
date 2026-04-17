/**
 * Exhibit 4: Key Generation
 * Full Scloud+-128 (default) keygen with real parameters.
 */

import { keyGen, serializePublicKey } from '../crypto/kem';
import { SCloudParams, ALL_PARAMS, getParams } from '../crypto/params';
import { bytesToHex, packIntegers } from '../crypto/utils';

export function renderExhibit4(container: HTMLElement): void {
  container.innerHTML = `
    <p>Run full S-Cloud+ key generation with real parameter sets.
       The matrix A is generated from a 32-byte seed via SHAKE-128,
       the ternary secret has Hamming weight n/2, and public key
       <code>pk = (seed_A, b = A·s + e mod q)</code>.</p>
    <div class="btn-group">
      <select id="keygen-param-select" class="param-select">
        ${ALL_PARAMS.map(p => `<option value="${p.securityLevel}">${p.name}</option>`).join('')}
      </select>
      <button class="btn" id="keygen-run">▶ Run KeyGen</button>
    </div>
    <div id="keygen-output"></div>
  `;

  const select = container.querySelector('#keygen-param-select') as HTMLSelectElement;
  const runBtn = container.querySelector('#keygen-run') as HTMLButtonElement;
  const output = container.querySelector('#keygen-output') as HTMLElement;

  runBtn.addEventListener('click', () => {
    const level = parseInt(select.value) as 128 | 192 | 256;
    const params = getParams(level);

    output.innerHTML = `<div class="computing">⏳ Generating keys for ${params.name} (n=${params.n})…</div>`;

    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const t0 = performance.now();
      const { pk, sk } = keyGen(params);
      const t1 = performance.now();

      const pkBytes = serializePublicKey(pk, params);
      const sPacked = packIntegers(Array.from(sk.s).map(v => v + 1), 2);
      const skTotalSize = sPacked.length + pkBytes.length + 32 + 32;

      output.innerHTML = renderKeyGenResult(params, pk, sk, pkBytes, skTotalSize, t1 - t0);
    }, 50);
  });
}

function renderKeyGenResult(
  params: SCloudParams,
  pk: { seedA: Uint8Array; b: Int32Array },
  sk: { s: Int16Array; hPk: Uint8Array },
  pkBytes: Uint8Array,
  skSize: number,
  ms: number
): string {
  // Count ternary stats
  let pos = 0, neg = 0, zero = 0;
  for (let i = 0; i < sk.s.length; i++) {
    if (sk.s[i] > 0) pos++;
    else if (sk.s[i] < 0) neg++;
    else zero++;
  }

  const seedHex = bytesToHex(pk.seedA);
  const hPkHex = bytesToHex(sk.hPk);

  return `
    <div class="result-box fade-in">
      <div class="result-row"><span class="result-label">Parameter set:</span> <span class="result-value">${params.name}</span></div>
      <div class="result-row"><span class="result-label">Dimension n:</span> <span class="result-value">${params.n}</span></div>
      <div class="result-row"><span class="result-label">Modulus q:</span> <span class="result-value">${params.q}</span> (2^${params.logQ})</div>
      <div class="result-row"><span class="result-label">Matrix A:</span> <span class="result-value">${params.n}×${params.n}</span> over ℤ<sub>${params.q}</sub></div>
      <div class="result-row"><span class="result-label">seed_A:</span> <span class="result-value">${seedHex.substring(0, 48)}…</span></div>
      <div class="result-row"><span class="result-label">H(pk):</span> <span class="result-value">${hPkHex.substring(0, 48)}…</span></div>
      <hr style="border-color:var(--border);margin:0.5rem 0">
      <div class="result-row"><span class="result-label">Secret s:</span> ternary vector, +1: ${pos}, −1: ${neg}, 0: ${zero}</div>
      <div class="result-row"><span class="result-label">Hamming weight:</span> <span class="result-value">${pos + neg}</span> (expected ${params.hw})</div>
      <hr style="border-color:var(--border);margin:0.5rem 0">
      <div class="result-row"><span class="result-label">pk size:</span> <span class="result-value">${pkBytes.length} bytes</span></div>
      <div class="result-row"><span class="result-label">sk size:</span> <span class="result-value">${skSize} bytes</span></div>
      <div class="result-row"><span class="result-label">Time:</span> <span class="result-value">${ms.toFixed(0)} ms</span></div>
    </div>
    <div class="result-box" style="margin-top:0.5rem">
      <div class="result-row" style="color:var(--text-muted)">
        <!-- ePrint 2024/1306 Table 4 expected sizes -->
        <span class="result-label">Expected pk size (spec):</span> ${params.pkBytes} bytes — TODO: verify against ePrint 2024/1306 Table 4
      </div>
    </div>
  `;
}
