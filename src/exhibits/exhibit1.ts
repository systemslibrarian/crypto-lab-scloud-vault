/**
 * Exhibit 1: The LWE Core
 * Interactive toy demo (n=8) showing b = As + e (mod q).
 */

import { toyLWEDemo, ToyLWEDemo } from '../crypto/kem';

export function renderExhibit1(container: HTMLElement): void {
  container.innerHTML = `
    <p>The Learning With Errors (LWE) problem is the foundation of S-Cloud+.
       Given public <code>A</code> and <code>b = A·s + e</code>, it is computationally
       hard to recover the secret <code>s</code> — even knowing <code>A</code> and <code>b</code>.</p>
    <p>S-Cloud+ uses a <strong>ternary secret</strong> <code>s ∈ {-1, 0, 1}</code> instead of
       Gaussian secrets (like FrodoKEM). This keeps coefficients small, enabling faster
       computation while BW₃₂ error correction compensates for the reduced entropy.</p>
    <div class="btn-group">
      <button class="btn" id="lwe-resample">⟳ Resample</button>
    </div>
    <div id="lwe-output"></div>
  `;

  const btn = container.querySelector('#lwe-resample') as HTMLButtonElement;
  const output = container.querySelector('#lwe-output') as HTMLElement;

  function render(): void {
    const demo = toyLWEDemo(8, 251);
    output.innerHTML = buildLWEDisplay(demo);
  }

  btn.addEventListener('click', render);
  render();
}

function buildLWEDisplay(demo: ToyLWEDemo): string {
  const { A, s, e, b, n, q } = demo;

  let html = `<div class="fade-in">`;

  // Matrix A
  html += `<div style="margin-bottom:1rem">
    <span class="result-label">Matrix A (${n}×${n}, mod ${q}):</span>
    <div class="matrix-grid" style="grid-template-columns: repeat(${n}, 1fr)">`;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      html += `<div class="matrix-cell">${A[i][j]}</div>`;
    }
  }
  html += `</div></div>`;

  // Secret s (ternary)
  html += `<div style="margin-bottom:1rem">
    <span class="result-label">Secret s (ternary, weight ${n >> 1}):</span>
    <div class="vector-display">`;
  for (let i = 0; i < n; i++) {
    const cls = s[i] > 0 ? 'pos' : s[i] < 0 ? 'neg' : 'zero';
    html += `<div class="vec-entry ${cls}">${s[i] > 0 ? '+1' : s[i] < 0 ? '-1' : '0'}</div>`;
  }
  html += `</div></div>`;

  // Error e
  html += `<div style="margin-bottom:1rem">
    <span class="result-label">Error e (Gaussian, small):</span>
    <div class="vector-display">`;
  for (let i = 0; i < n; i++) {
    const cls = e[i] > 0 ? 'pos' : e[i] < 0 ? 'neg' : 'zero';
    html += `<div class="vec-entry ${cls}">${e[i]}</div>`;
  }
  html += `</div></div>`;

  // Result b
  html += `<div>
    <span class="result-label">b = A·s + e (mod ${q}):</span>
    <div class="vector-display">`;
  for (let i = 0; i < n; i++) {
    html += `<div class="vec-entry" style="background:var(--bg-code)">${b[i]}</div>`;
  }
  html += `</div></div>`;

  html += `</div>`;
  return html;
}
