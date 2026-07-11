/**
 * Exhibit 4: Key Generation
 * Full Scloud+-128 (default) keygen with real parameters.
 */

import { keyGenStaged, serializePublicKey } from '../crypto/kem';
import { SCloudParams, ALL_PARAMS, getParams } from '../crypto/params';
import { bytesToHex, packIntegers } from '../crypto/utils';
import { mountStages } from '../stages';

export function renderExhibit4(container: HTMLElement): void {
  container.innerHTML = `
    <p>Run full S-Cloud+ key generation with real parameter sets.
       The matrix A is generated from a 32-byte seed via SHAKE-128,
       the ternary secret has Hamming weight n/2, and public key
       <code>pk = (seed_A, b = A·s + e mod q)</code>.</p>
    <div class="btn-group">
      <select id="keygen-param-select" class="param-select" aria-label="Parameter set for key generation">
        ${ALL_PARAMS.map(p => `<option value="${p.securityLevel}">${p.name}</option>`).join('')}
      </select>
      <button class="btn" id="keygen-run">▶ Run KeyGen</button>
    </div>
    <div id="keygen-output"></div>
  `;

  const select = container.querySelector('#keygen-param-select') as HTMLSelectElement;
  const runBtn = container.querySelector('#keygen-run') as HTMLButtonElement;
  const output = container.querySelector('#keygen-output') as HTMLElement;

  runBtn.addEventListener('click', async () => {
    const level = parseInt(select.value) as 128 | 192 | 256;
    const params = getParams(level);

    runBtn.disabled = true;
    output.innerHTML = `<div id="kg-stages"></div><div id="kg-result"></div>`;
    const stagesEl = output.querySelector('#kg-stages') as HTMLElement;
    const resultEl = output.querySelector('#kg-result') as HTMLElement;

    const ctrl = mountStages(stagesEl, [
      { id: 'A', label: `Expand seed → public matrix A (${params.n}×${params.n})` },
      { id: 'S', label: 'Sample ternary secret S (n×32)' },
      { id: 'E', label: 'Sample error E (centered binomial)' },
      { id: 'B', label: 'Compute B = A·S + E (mod q)' },
      { id: 'H', label: 'Hash public key → H(pk)' },
    ]);

    const t0 = performance.now();
    const { pk, sk } = await keyGenStaged(params, id => ctrl.active(id));
    ctrl.finish();
    const t1 = performance.now();

    const pkBytes = serializePublicKey(pk, params);
    const sPacked = packIntegers(Array.from(sk.S).map(v => v + 1), 2);
    const skTotalSize = sPacked.length + pkBytes.length + 32 + 32;

    resultEl.innerHTML = renderKeyGenResult(params, pk, sk, pkBytes, skTotalSize, t1 - t0);
    runBtn.disabled = false;
  });
}

function renderKeyGenResult(
  params: SCloudParams,
  pk: { seedA: Uint8Array; B: Int32Array },
  sk: { S: Int16Array; hPk: Uint8Array },
  pkBytes: Uint8Array,
  skSize: number,
  ms: number
): string {
  // Count ternary stats over the whole secret matrix S (n × 32)
  let pos = 0, neg = 0, zero = 0;
  for (let i = 0; i < sk.S.length; i++) {
    if (sk.S[i] > 0) pos++;
    else if (sk.S[i] < 0) neg++;
    else zero++;
  }
  const expectedNonzero = params.hw * 32; // weight hw per column, 32 columns

  const seedHex = bytesToHex(pk.seedA);
  const hPkHex = bytesToHex(sk.hPk);

  return `
    <div class="result-box fade-in">
      <div class="result-row"><span class="result-label">Parameter set:</span> <span class="result-value">${params.name}</span></div>
      <div class="result-row"><span class="result-label">Dimension n:</span> <span class="result-value">${params.n}</span></div>
      <div class="result-row"><span class="result-label">Modulus q:</span> <span class="result-value">${params.q}</span> (2^${params.logQ})</div>
      <div class="result-row"><span class="result-label">Matrix A:</span> <span class="result-value">${params.n}×${params.n}</span> over ℤ<sub>${params.q}</sub></div>
      <div class="result-row"><span class="result-label">Secret S / public B:</span> <span class="result-value">${params.n}×32</span> (matrix LWE, FrodoKEM-style)</div>
      <div class="result-row"><span class="result-label">seed_A:</span> <span class="result-value">${seedHex.substring(0, 48)}…</span></div>
      <div class="result-row"><span class="result-label">H(pk):</span> <span class="result-value">${hPkHex.substring(0, 48)}…</span></div>
      <hr style="border-color:var(--border);margin:0.5rem 0">
      <div class="result-row"><span class="result-label">Secret S:</span> ternary matrix, +1: ${pos}, −1: ${neg}, 0: ${zero}</div>
      <div class="result-row"><span class="result-label">Non-zeros:</span> <span class="result-value">${pos + neg}</span> (expected ${expectedNonzero} = ${params.hw}/col × 32)</div>
      <hr style="border-color:var(--border);margin:0.5rem 0">
      <div class="result-row"><span class="result-label">pk size:</span> <span class="result-value">${pkBytes.length} bytes</span></div>
      <div class="result-row"><span class="result-label">sk size:</span> <span class="result-value">${skSize} bytes</span></div>
      <div class="result-row"><span class="result-label">Time:</span> <span class="result-value">${ms.toFixed(0)} ms</span></div>
    </div>
    <div class="callout">
      <span class="callout-title">Demo size vs official size</span>
      This demo's public key is <strong>${pkBytes.length} bytes</strong>; the real ${params.name}
      public key is <strong>${params.specPkBytes.toLocaleString()} bytes</strong> (paper Table 6).
      The difference is expected: the real scheme stores <code>B</code> as a full
      ${params.specMN[0]}×n̄ matrix, while this demo uses a single-vector simplification so the
      computation stays fast and the vectors stay readable. The algorithm and security ideas are the
      same — only the structure is scaled down.
    </div>
  `;
}
