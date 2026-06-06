/**
 * Exhibit: Guided Walkthrough
 * A click-through tour of the full KEM on tiny, fully-visible toy parameters
 * (n = 16). Every step shows the real computed data plus a "what" and a "why".
 */

import { SCloudParams } from '../crypto/params';
import {
  keyGen, encapsDetailed, decapsDetailed, serializeCiphertext,
  SCloudKeyPair, EncapsDetail, DecapsDetail, SCloudCiphertext, deserializeCiphertext,
} from '../crypto/kem';
import { bytesToHex } from '../crypto/utils';

// Tiny, readable parameter set. Small enough to print every vector on screen.
// msgBlocks=2 (10 coded bits) fully covers the 8-bit message so re-encryption
// reproduces the ciphertext exactly (the FO check needs that).
const TOY: SCloudParams = {
  name: 'Toy-Scloud+', securityLevel: 128,
  n: 16, m: 64, q: 4096, logQ: 12, eta: 2, hw: 8,
  msgBlocks: 2, msgBytes: 1, ssBytes: 4, seedBytes: 8,
  specPkBytes: 0, specSkBytes: 0, specCtBytes: 0, specSsBytes: 0,
  specMN: [16, 16], classicalSec: 0, quantumSec: 0, dfrLog2: 0,
  cyclesKeygen: 0, cyclesEncaps: 0, cyclesDecaps: 0,
};

interface Run {
  kp: SCloudKeyPair;
  enc: EncapsDetail;
  dec: DecapsDetail;
  tamperedCt: SCloudCiphertext;
  tamperDec: DecapsDetail;
}

const STEPS = ['Overview', 'Key Generation', 'Encapsulation', 'Decapsulation', 'Tamper & FO', 'Recap'];

export function renderGuidedWalkthrough(container: HTMLElement): void {
  let run = freshRun();
  let step = 0;

  container.innerHTML = `
    <p>Follow one shared secret all the way through Scloud+, on deliberately tiny parameters
       (<code>n = 16</code>) so every vector fits on screen. Click <strong>Next</strong> to advance.</p>
    <div class="btn-group">
      <button class="btn btn-secondary" id="gw-reset">⟳ New random run</button>
    </div>
    <div id="gw-progress" class="guide-progress"></div>
    <div id="gw-body"></div>
    <div class="guide-nav">
      <button class="btn btn-secondary" id="gw-prev">← Prev</button>
      <span class="spacer"></span>
      <button class="btn" id="gw-next">Next →</button>
    </div>
  `;

  const progressEl = container.querySelector('#gw-progress') as HTMLElement;
  const bodyEl = container.querySelector('#gw-body') as HTMLElement;
  const prevBtn = container.querySelector('#gw-prev') as HTMLButtonElement;
  const nextBtn = container.querySelector('#gw-next') as HTMLButtonElement;
  const resetBtn = container.querySelector('#gw-reset') as HTMLButtonElement;

  function draw(): void {
    progressEl.innerHTML = STEPS.map((label, i) => {
      const cls = i === step ? 'active' : i < step ? 'done' : '';
      const dot = `<span class="guide-dot ${cls}" title="${label}">${i < step ? '✓' : i + 1}</span>`;
      const line = i < STEPS.length - 1 ? `<span class="guide-line ${i < step ? 'done' : ''}"></span>` : '';
      return dot + line;
    }).join('');
    bodyEl.innerHTML = renderStep(step, run);
    prevBtn.disabled = step === 0;
    nextBtn.textContent = step === STEPS.length - 1 ? 'Done ✓' : 'Next →';
    nextBtn.disabled = step === STEPS.length - 1;
  }

  prevBtn.addEventListener('click', () => { if (step > 0) { step--; draw(); } });
  nextBtn.addEventListener('click', () => { if (step < STEPS.length - 1) { step++; draw(); } });
  resetBtn.addEventListener('click', () => { run = freshRun(); step = 0; draw(); });

  draw();
}

function freshRun(): Run {
  const kp = keyGen(TOY);
  const enc = encapsDetailed(kp.pk, TOY);
  const dec = decapsDetailed(kp.sk, enc.ct, TOY);
  // tamper: flip a byte of the serialized ciphertext
  const ctBytes = serializeCiphertext(enc.ct, TOY);
  ctBytes[0] ^= 0xff;
  const tamperedCt = deserializeCiphertext(ctBytes, TOY);
  const tamperDec = decapsDetailed(kp.sk, tamperedCt, TOY);
  return { kp, enc, dec, tamperedCt, tamperDec };
}

function renderStep(step: number, run: Run): string {
  switch (step) {
    case 0: return stepOverview();
    case 1: return stepKeyGen(run);
    case 2: return stepEncaps(run);
    case 3: return stepDecaps(run);
    case 4: return stepTamper(run);
    default: return stepRecap(run);
  }
}

// ── Step renderers ───────────────────────────────────

function stepOverview(): string {
  return `
    <div class="guide-step">
      <span class="guide-phase-label">The goal</span>
      <h4>Two parties, one shared secret</h4>
      <p>A KEM lets a sender create a fresh shared secret and "wrap" it for a specific public key.
         The owner of the matching secret key can "unwrap" it. Nobody else can.</p>
      <div class="formula">
        <span class="hl">KeyGen</span> → (public key, secret key)<br>
        <span class="hl">Encaps</span>(public key) → (ciphertext, shared secret K)<br>
        <span class="hl">Decaps</span>(secret key, ciphertext) → shared secret K
      </div>
      <div class="callout why">
        <span class="callout-title">Why a KEM and not just "encrypt the key"?</span>
        A KEM bakes in the <strong>Fujisaki-Okamoto transform</strong>, which upgrades a basic
        (IND-CPA) scheme into one safe against active attackers who tamper with ciphertexts
        (IND-CCA2). You'll see exactly how in step 5.
      </div>
      <p style="color:var(--text-muted)">We'll use toy parameters: dimension <code>n = 16</code>,
         modulus <code>q = 4096</code>, ternary secret weight <code>8</code>. Real Scloud+ uses
         <code>n ≈ 600–1120</code> — same ideas, bigger numbers.</p>
    </div>`;
}

function stepKeyGen(run: Run): string {
  const { pk, sk } = run.kp;
  return `
    <div class="guide-step">
      <span class="guide-phase-label">Step 1 of 3 — runs once, by the key owner</span>
      <h4>Key Generation</h4>
      <div class="formula">
        s ← ternary secret (weight n/2)&nbsp;&nbsp; e ← small error<br>
        b = <span class="hl">A·s + e</span>&nbsp; (mod q)&nbsp;&nbsp;→&nbsp;&nbsp;
        public key = (seed for A, <span class="hl">b</span>),&nbsp; secret key = s
      </div>
      <p><strong>A</strong> is a big public random matrix (expanded from a short seed). The owner
         picks a secret <strong>s</strong> and tiny noise <strong>e</strong>, then publishes
         <strong>b = A·s + e</strong>.</p>
      ${vec('Secret s (ternary, the private key)', sk.s)}
      ${vec('b = A·s + e (part of the public key)', pk.b, true)}
      <p style="font-family:var(--font-mono);font-size:0.78rem;color:var(--text-muted)">
        seed for A: ${bytesToHex(pk.seedA)} &nbsp;|&nbsp; H(pk): ${bytesToHex(sk.hPk).slice(0, 16)}…</p>
      <div class="callout why">
        <span class="callout-title">Why is this safe?</span>
        Recovering <strong>s</strong> from <strong>(A, b)</strong> is the <strong>Learning With
        Errors (LWE)</strong> problem — believed hard even for quantum computers. The small error
        <strong>e</strong> is what makes it hard: without it, you could just solve the linear system.
      </div>
    </div>`;
}

function stepEncaps(run: Run): string {
  const { enc } = run;
  return `
    <div class="guide-step">
      <span class="guide-phase-label">Step 2 of 3 — runs on the sender's side</span>
      <h4>Encapsulation</h4>
      <div class="formula">
        m ← random message<br>
        (coins, k) = <span class="hl">G</span>(m ‖ H(pk))&nbsp;&nbsp;<span style="color:var(--text-muted)">— G = SHA3-512</span><br>
        c1 = Aᵀ·s′ + e′,&nbsp; c2 = (b·s′) + e″ + <span class="hl">Encode(m)</span><br>
        shared secret = <span class="hl">K</span>(k ‖ ciphertext)
      </div>
      <p>The sender invents a random message <strong>m</strong>, derives all randomness from it
         (so decapsulation can re-check later), builds an LWE ciphertext that hides <strong>m</strong>,
         and derives the shared secret from <strong>m</strong>.</p>
      ${bytes('Random message m', enc.m)}
      ${vec('c1 = Aᵀ·s′ + e′', enc.ct.c1, true)}
      ${vec('c2 (carries the BW₃₂-encoded message)', enc.ct.c2, true)}
      ${bytes('Shared secret K (this is the prize)', enc.ss, true)}
      <div class="callout why">
        <span class="callout-title">Why encode m with BW₃₂?</span>
        Decryption is noisy. The Barnes-Wall BW₃₂ code spreads each chunk of <strong>m</strong>
        across 32 dimensions so the receiver can <em>error-correct</em> away the noise — letting
        Scloud+ use smaller parameters than FrodoKEM.
      </div>
    </div>`;
}

function stepDecaps(run: Run): string {
  const { dec, enc } = run;
  const match = bytesToHex(dec.ss) === bytesToHex(enc.ss);
  return `
    <div class="guide-step">
      <span class="guide-phase-label">Step 3 of 3 — runs on the receiver's side</span>
      <h4>Decapsulation</h4>
      <div class="formula">
        v = c2 − (s·c1)&nbsp;&nbsp;→&nbsp;&nbsp;m′ = <span class="hl">Decode(v)</span><br>
        re-encrypt with m′ and check it matches the ciphertext (next step)<br>
        shared secret = K(k′ ‖ ciphertext)
      </div>
      <p>Using the secret <strong>s</strong>, the receiver cancels the big shared LWE term, leaving
         the noisy encoded message. BW₃₂ decoding error-corrects it back to <strong>m′</strong>.</p>
      ${bytes('Recovered message m′', dec.mPrime)}
      <div class="fo-check">
        <div class="fo-box"><span class="lab">Shared secret — sender</span>${bytesToHex(enc.ss)}</div>
        <div class="fo-eq ${match ? 'match' : 'nomatch'}">${match ? '=' : '≠'}</div>
        <div class="fo-box"><span class="lab">Shared secret — receiver</span>${bytesToHex(dec.ss)}</div>
      </div>
      <div class="callout good">
        <span class="callout-title">${match ? '✓ Success' : '✗ Unexpected'}</span>
        Both sides now hold the ${match ? 'same' : 'DIFFERENT'} secret <strong>K</strong> — agreed
        without ever sending it. They can use it to encrypt their conversation.
      </div>
    </div>`;
}

function stepTamper(run: Run): string {
  const { enc, tamperDec } = run;
  const tamperedDiffers = bytesToHex(enc.ss) !== bytesToHex(tamperDec.ss);
  return `
    <div class="guide-step">
      <span class="guide-phase-label">The security guarantee</span>
      <h4>What if an attacker tampers with the ciphertext?</h4>
      <p>This is what the <strong>Fujisaki-Okamoto transform</strong> defends against. On
         decapsulation the receiver <em>re-encrypts</em> the recovered message and checks it
         reproduces the ciphertext byte-for-byte:</p>
      <div class="formula">
        m′ = Decode(...);&nbsp; C′ = Enc(pk, m′, coins′)<br>
        if C′ <span class="hl">==</span> C → return K(k′ ‖ C)&nbsp;&nbsp;<span style="color:var(--text-muted)">(accept)</span><br>
        if C′ <span class="hl">!=</span> C → return K(<span class="hl">z</span> ‖ C)&nbsp;&nbsp;<span style="color:var(--text-muted)">(implicit reject — a junk key from a secret seed z)</span>
      </div>
      <p>We flipped one byte of the ciphertext, then decapsulated it:</p>
      <div class="fo-check">
        <div class="fo-box"><span class="lab">Honest shared secret</span>${bytesToHex(enc.ss)}</div>
        <div class="fo-eq nomatch">≠</div>
        <div class="fo-box"><span class="lab">From tampered ciphertext</span>${bytesToHex(tamperDec.ss)}</div>
      </div>
      <div class="callout ${tamperedDiffers ? 'good' : 'warn'}">
        <span class="callout-title">Re-encryption matched: ${tamperDec.reEncMatch ? 'yes' : 'NO → rejected'}</span>
        The tampered ciphertext yields a <strong>completely different, useless</strong> key — and
        crucially, <em>no error message</em>. The attacker can't tell rejection from success, which
        closes the door on chosen-ciphertext attacks. This is the whole point of turning a basic
        PKE into a CCA-secure KEM.
      </div>
    </div>`;
}

function stepRecap(run: Run): string {
  const ok = bytesToHex(run.enc.ss) === bytesToHex(run.dec.ss);
  return `
    <div class="guide-step">
      <span class="guide-phase-label">Recap</span>
      <h4>You just ran a full post-quantum key exchange</h4>
      <ol style="color:var(--text-muted);margin-left:1.2rem">
        <li><strong>KeyGen</strong> published b = A·s + e and kept s secret (LWE hardness).</li>
        <li><strong>Encaps</strong> hid a random message m in a ciphertext and derived key K.</li>
        <li><strong>Decaps</strong> used s to recover m and re-derive the same K.</li>
        <li><strong>FO transform</strong> made tampering produce useless keys, not exploitable errors.</li>
      </ol>
      <div class="callout ${ok ? 'good' : 'warn'}">
        <span class="callout-title">${ok ? '✓ Shared secret agreed' : '✗ Mismatch'}</span>
        Everything above used the same real algorithm the other exhibits use — just with tiny numbers.
        Open the deeper exhibits to explore each piece (LWE, ternary secrets, BW₃₂, key sizes,
        performance, and how much Scloud+ has been reviewed).
      </div>
      <p style="color:var(--text-muted)">Use <strong>⟳ New random run</strong> at the top to do it
         all again with fresh randomness.</p>
    </div>`;
}

// ── small display helpers ────────────────────────────

function vec(label: string, arr: Int16Array | Int32Array, plain = false): string {
  let html = `<div style="margin:0.6rem 0"><span class="result-label">${label}:</span><div class="vector-display">`;
  const max = Math.min(arr.length, 64);
  for (let i = 0; i < max; i++) {
    const v = arr[i];
    if (plain) {
      html += `<div class="vec-entry" style="background:var(--bg-code)">${v}</div>`;
    } else {
      const cls = v > 0 ? 'pos' : v < 0 ? 'neg' : 'zero';
      const lab = v > 0 ? '+1' : v < 0 ? '−1' : '0';
      html += `<div class="vec-entry ${cls}">${lab}</div>`;
    }
  }
  if (arr.length > max) html += `<div class="vec-entry zero">…</div>`;
  html += `</div></div>`;
  return html;
}

function bytes(label: string, b: Uint8Array, highlight = false): string {
  return `<div style="margin:0.6rem 0"><span class="result-label">${label}:</span>
    <span class="result-value ${highlight ? 'success' : ''}" style="font-family:var(--font-mono)">
    ${bytesToHex(b)}</span></div>`;
}
