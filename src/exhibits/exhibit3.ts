/**
 * Exhibit 3: BW₃₂ Lattice Coding Explainer
 * The exhibit unique to S-Cloud+ (no equivalent in frodo-vault).
 * Shows encoding, decoding with noise, and error correction behavior.
 */

import { bw32Encode, bw32DemoRoundtrip, BW32Demo } from '../crypto/bw32';

export function renderExhibit3(container: HTMLElement): void {
  const q = 32768; // Use Scloud+-128 modulus for demo

  container.innerHTML = `
    <p><strong>Barnes-Wall BW₃₂</strong> is a 32-dimensional lattice used for error correction
       in S-Cloud+. It encodes <strong>5 bits</strong> per 32 dimensions, enabling the KEM to
       tolerate more noise and thus use smaller parameters than FrodoKEM.</p>
    <p>This is the key differentiator: where FrodoKEM uses no error correction (limiting noise
       tolerance), S-Cloud+ uses BW₃₂ to significantly expand the allowable error margin.</p>

    <h4>Encoding: 5-bit Message → 32-dimensional Coset Representative</h4>
    <div class="btn-group">
      <label class="inline-label">
        Message (0–31):
        <input type="number" id="bw32-msg-input" min="0" max="31" value="13"
               style="width:60px; padding:4px; background:var(--bg-code); border:1px solid var(--border); color:var(--text); border-radius:4px;">
      </label>
      <button class="btn" id="bw32-encode-btn">Encode</button>
    </div>
    <div id="bw32-encode-output"></div>

    <h4 style="margin-top:1.5rem">Decoding with Noise: Error Correction in Action</h4>
    <p>Add noise to the encoded vector and see BW₃₂ decode it back correctly — until the noise
       exceeds the correction radius, at which point decryption fails.</p>
    <div class="btn-group">
      <label class="inline-label">
        Noise σ:
        <input type="range" id="bw32-noise-slider" min="0" max="8000" value="500" step="100"
               class="noise-slider" aria-label="Noise standard deviation">
        <span id="bw32-noise-val">500</span>
      </label>
      <button class="btn" id="bw32-decode-btn">Encode + Add Noise + Decode</button>
    </div>
    <div id="bw32-decode-output"></div>

    <h4 style="margin-top:1.5rem">Batch Test: Success Rate vs Noise Level</h4>
    <button class="btn btn-secondary" id="bw32-batch-btn">Run 100 Trials</button>
    <div id="bw32-batch-output"></div>
  `;

  const msgInput = container.querySelector('#bw32-msg-input') as HTMLInputElement;
  const encodeBtn = container.querySelector('#bw32-encode-btn') as HTMLButtonElement;
  const encodeOutput = container.querySelector('#bw32-encode-output') as HTMLElement;

  const noiseSlider = container.querySelector('#bw32-noise-slider') as HTMLInputElement;
  const noiseVal = container.querySelector('#bw32-noise-val') as HTMLElement;
  const decodeBtn = container.querySelector('#bw32-decode-btn') as HTMLButtonElement;
  const decodeOutput = container.querySelector('#bw32-decode-output') as HTMLElement;

  const batchBtn = container.querySelector('#bw32-batch-btn') as HTMLButtonElement;
  const batchOutput = container.querySelector('#bw32-batch-output') as HTMLElement;

  noiseSlider.addEventListener('input', () => {
    noiseVal.textContent = noiseSlider.value;
  });

  encodeBtn.addEventListener('click', () => {
    const msg = parseInt(msgInput.value) & 0x1F;
    const encoded = bw32Encode(msg, q);
    encodeOutput.innerHTML = renderEncoding(msg, encoded, q);
  });

  decodeBtn.addEventListener('click', () => {
    const msg = parseInt(msgInput.value) & 0x1F;
    const noise = parseInt(noiseSlider.value);
    const demo = bw32DemoRoundtrip(msg, noise, q);
    decodeOutput.innerHTML = renderDecodeDemo(demo, q);
  });

  batchBtn.addEventListener('click', () => {
    const noise = parseInt(noiseSlider.value);
    let successes = 0;
    const trials = 100;
    for (let i = 0; i < trials; i++) {
      const msg = i % 32;
      const demo = bw32DemoRoundtrip(msg, noise, q);
      if (demo.success) successes++;
    }
    const rate = ((successes / trials) * 100).toFixed(1);
    const cls = successes === trials ? 'success' : successes > 80 ? 'result-value' : 'danger';
    batchOutput.innerHTML = `
      <div class="result-box fade-in">
        <div class="result-row">
          <span class="result-label">Noise σ =</span> <span class="result-value">${noise}</span>
        </div>
        <div class="result-row">
          <span class="result-label">Success rate:</span>
          <span class="${cls}">${successes}/${trials} (${rate}%)</span>
        </div>
        <div class="result-row" style="color:var(--text-muted)">
          ${successes === trials
        ? '✓ All decoded correctly — noise is within BW₃₂ correction radius.'
        : successes === 0
          ? '✗ All failed — noise exceeds BW₃₂ correction radius. Decryption failure!'
          : '⚠ Partial failure — noise is near the boundary of the correction radius.'}
        </div>
      </div>
    `;
  });

  // Trigger initial encode
  encodeBtn.click();
}

function renderEncoding(msg: number, encoded: Int32Array, q: number): string {
  const bits = msg.toString(2).padStart(5, '0');
  const scale = Math.floor(q / 4);

  let html = `<div class="result-box fade-in">`;
  html += `<div class="result-row"><span class="result-label">Message:</span> <span class="result-value">${msg}</span> (binary: ${bits})</div>`;
  html += `<div class="result-row"><span class="result-label">Scale factor:</span> q/4 = ${scale}</div>`;
  html += `<div class="result-row"><span class="result-label">Encoding maps each bit pattern to ±${scale} via Walsh-Hadamard rows.</span></div>`;
  html += `</div>`;

  // Visualize the 32-D encoded vector as a color grid
  html += `<div style="margin-top:0.5rem"><span class="result-label">Encoded vector (32 dimensions):</span></div>`;
  html += `<div class="bw32-grid" role="img" aria-label="32-dimensional encoded vector visualization">`;
  for (let i = 0; i < 32; i++) {
    const val = encoded[i];
    const isPositive = val === scale;
    const bg = isPositive ? 'var(--positive)' : 'var(--negative)';
    html += `<div class="bw32-cell" style="background:${bg};color:#fff" title="v[${i}]=${val}" aria-hidden="true">${isPositive ? '+' : '\u2212'}</div>`;
  }
  html += `</div>`;

  return html;
}

function renderDecodeDemo(demo: BW32Demo, q: number): string {
  const scale = Math.floor(q / 4);
  const successCls = demo.success ? 'success' : 'danger';
  const icon = demo.success ? '✓' : '✗';

  let html = `<div class="result-box fade-in">`;
  html += `<div class="result-row"><span class="result-label">Original message:</span> <span class="result-value">${demo.original}</span> (${demo.original.toString(2).padStart(5, '0')})</div>`;
  html += `<div class="result-row"><span class="result-label">Decoded message:</span> <span class="result-value ${successCls}">${demo.decoded}</span> (${demo.decoded.toString(2).padStart(5, '0')})</div>`;
  html += `<div class="result-row"><span class="result-label">Result:</span> <span class="${successCls}">${icon} ${demo.success ? 'Correct — error corrected!' : 'FAILURE — noise exceeded correction radius'}</span></div>`;
  html += `</div>`;

  // Visualization: original vs noisy
  html += `<div style="margin-top:0.5rem"><span class="result-label">Encoded (clean):</span></div>`;
  html += renderBW32Grid(demo.encoded, scale, q);

  html += `<div style="margin-top:0.5rem"><span class="result-label">Noise added:</span></div>`;
  html += renderNoiseGrid(demo.noise, scale);

  html += `<div style="margin-top:0.5rem"><span class="result-label">Received (noisy):</span></div>`;
  html += renderBW32Grid(demo.noisy, scale, q);

  return html;
}

function renderBW32Grid(vec: Int32Array, scale: number, q: number): string {
  const halfQ = Math.floor(q / 2);
  let html = '<div class="bw32-grid" role="img" aria-label="Encoded vector heatmap">';
  for (let i = 0; i < 32; i++) {
    let centered = vec[i] % q;
    if (centered > halfQ) centered -= q;
    const ratio = Math.max(0, Math.min(1, Math.abs(centered) / scale));
    const isPos = centered >= 0;
    const r = isPos ? 63 : Math.round(248 * ratio + 30 * (1 - ratio));
    const g = isPos ? Math.round(185 * ratio + 30 * (1 - ratio)) : Math.round(81 * ratio + 30 * (1 - ratio));
    const b = isPos ? Math.round(80 * ratio + 30 * (1 - ratio)) : Math.round(73 * ratio + 30 * (1 - ratio));
    html += `<div class="bw32-cell" style="background:rgb(${r},${g},${b});color:#fff" title="${centered}" aria-hidden="true"></div>`;
  }
  html += '</div>';
  return html;
}

function renderNoiseGrid(noise: Int32Array, scale: number): string {
  let html = '<div class="bw32-grid" role="img" aria-label="Noise heatmap">';
  const maxNoise = Math.max(1, ...Array.from(noise).map(Math.abs));
  for (let i = 0; i < 32; i++) {
    const ratio = Math.abs(noise[i]) / maxNoise;
    const intensity = Math.round(200 * ratio);
    html += `<div class="bw32-cell" style="background:rgb(${intensity},${intensity >> 1},0);color:#fff" title="${noise[i]}" aria-hidden="true"></div>`;
  }
  html += '</div>';
  return html;
}
