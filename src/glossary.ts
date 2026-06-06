/**
 * Glossary tooltips.
 *
 * Beginner-friendly definitions for crypto jargon. After the exhibits render,
 * `initGlossary()` auto-links the first occurrence of each term *per section*
 * to an accessible tooltip (hover, keyboard focus, and tap all work). A single
 * fixed-position bubble is reused and positioned via JS, so it is never clipped
 * by the cards' `overflow:hidden`.
 *
 * This is purely additive: it wraps matched words in a <span class="term"> and
 * never alters the surrounding content or any interactive controls.
 */

export const GLOSSARY: Record<string, string> = {
  'post-quantum': 'Cryptography designed to stay secure against future quantum computers.',
  'quantum computer': 'A machine that, at large scale, would break today’s RSA and elliptic-curve crypto via Shor’s algorithm.',
  'KEM': 'Key Encapsulation Mechanism — a secure “handshake” that lets two parties agree on a shared secret key over an open channel.',
  'LWE': 'Learning With Errors — the hard problem these schemes rest on: recover a secret from noisy linear equations. Believed hard even for quantum computers.',
  'lattice': 'A regular grid of points in high-dimensional space. Hard geometry problems on lattices are the basis of post-quantum security.',
  'ternary': 'Values restricted to just −1, 0 and +1 — small numbers that keep noise easy to control.',
  'Hamming weight': 'The number of non-zero entries in a vector.',
  'centered binomial': 'A simple noise distribution (the sum of fair coin-flip differences). The same family ML-KEM uses for errors.',
  'IND-CPA': 'A baseline security goal: safe against passive eavesdroppers, but not active tampering. The FO transform upgrades it to IND-CCA2.',
  'IND-CCA2': 'The strong security goal for a KEM: safe even against attackers who tamper with ciphertexts and watch what happens.',
  'Fujisaki-Okamoto transform': 'A standard recipe that upgrades a basic (IND-CPA) scheme into a tamper-resistant (IND-CCA2) one by re-encrypting and checking during decryption.',
  'FO transform': 'A standard recipe that upgrades a basic (IND-CPA) scheme into a tamper-resistant (IND-CCA2) one by re-encrypting and checking during decryption.',
  'implicit rejection': 'On a tampered ciphertext, return a useless pseudo-random key instead of an error — so an attacker learns nothing from the response.',
  'ciphertext': 'The scrambled output that is safe to send over an open channel.',
  'shared secret': 'The secret key both parties end up holding after the KEM handshake.',
  'Barnes-Wall': 'A family of dense lattices used for error correction. Scloud+ uses the 32-dimensional one, BW₃₂.',
  'Ideal-SVP': 'The Shortest Vector Problem on “ideal” (structured) lattices. Quantum algorithms solve it faster than on general lattices — the reason to be cautious about structured schemes.',
  'Module-LWE': 'LWE with extra algebraic (ring/module) structure. Smaller and faster (ML-KEM) but rests on a slightly stronger assumption.',
  'structured': 'Lattices with extra algebraic (ring/module) structure — compact and fast, but a stronger security assumption.',
  'unstructured': 'Plain LWE with no algebraic shortcuts — larger and slower, but the most conservative assumption (Scloud+, FrodoKEM).',
  'ML-KEM': 'NIST’s standardized post-quantum KEM (FIPS 203), based on structured Module-LWE. Formerly called “Kyber”.',
  'FrodoKEM': 'A conservative KEM built on plain unstructured LWE — very large keys, no algebraic structure.',
  'decryption failure': 'The tiny probability that noise overwhelms error correction and the wrong key is recovered. Parameters are chosen to make it astronomically small.',
};

// Terms we never auto-link inside (to avoid breaking code, controls, data, etc.)
const SKIP_ANCESTORS = new Set([
  'A', 'CODE', 'PRE', 'BUTTON', 'SELECT', 'INPUT', 'TEXTAREA', 'LABEL',
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SUP', 'SUB',
]);
const SKIP_CLASSES = [
  'term', 'formula', 'result-box', 'fo-box', 'bar-label', 'vec-entry',
  'matrix-cell', 'bw32-cell', 'lattice-cell', 'toc', 'comparison-table',
  'callout-title', 'result-value', 'guide-phase-label',
];

let bubble: HTMLElement | null = null;
let pinned = false; // tapped-open state (touch)

function ensureBubble(): HTMLElement {
  if (bubble) return bubble;
  bubble = document.createElement('div');
  bubble.className = 'glossary-tip';
  bubble.setAttribute('role', 'tooltip');
  bubble.id = 'glossary-tip';
  document.body.appendChild(bubble);
  return bubble;
}

function showFor(el: HTMLElement): void {
  const def = el.getAttribute('data-def');
  if (!def) return;
  const term = el.textContent || '';
  const b = ensureBubble();
  b.innerHTML = `<strong>${escapeHtml(term)}</strong>${escapeHtml(def)}`;
  b.classList.add('visible');

  const r = el.getBoundingClientRect();
  const bw = Math.min(300, window.innerWidth - 24);
  b.style.maxWidth = bw + 'px';
  // measure
  b.style.left = '-9999px';
  b.style.top = '0px';
  const bh = b.offsetHeight;
  let left = r.left + r.width / 2 - bw / 2;
  left = Math.max(12, Math.min(left, window.innerWidth - bw - 12));
  let top = r.top - bh - 8;
  b.classList.toggle('below', top < 8);
  if (top < 8) top = r.bottom + 8;
  b.style.left = left + 'px';
  b.style.top = top + 'px';
}

function hide(): void {
  pinned = false;
  if (bubble) bubble.classList.remove('visible');
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}

/** Wrap matched terms within the given root containers. */
export function initGlossary(): void {
  const sections: HTMLElement[] = [
    ...Array.from(document.querySelectorAll<HTMLElement>('.exhibit-body')),
    ...Array.from(document.querySelectorAll<HTMLElement>('.start-here, .intro')),
  ];

  // longest terms first so multi-word terms win
  const terms = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);

  for (const section of sections) {
    const used = new Set<string>();
    for (const raw of terms) {
      if (used.has(raw)) continue;
      const re = new RegExp(`\\b${escapeRe(raw)}\\b`, 'i');
      if (wrapFirst(section, re, raw)) used.add(raw);
    }
  }

  // Event delegation (hover + keyboard + tap)
  document.addEventListener('mouseover', e => {
    const t = (e.target as HTMLElement).closest?.('.term') as HTMLElement | null;
    if (t && !pinned) showFor(t);
  });
  document.addEventListener('mouseout', e => {
    const t = (e.target as HTMLElement).closest?.('.term');
    if (t && !pinned) hide();
  });
  document.addEventListener('focusin', e => {
    const t = (e.target as HTMLElement).closest?.('.term') as HTMLElement | null;
    if (t) showFor(t);
  });
  document.addEventListener('focusout', e => {
    if ((e.target as HTMLElement).closest?.('.term')) hide();
  });
  document.addEventListener('click', e => {
    const t = (e.target as HTMLElement).closest?.('.term') as HTMLElement | null;
    if (t) { e.preventDefault(); pinned = !pinned; if (pinned) showFor(t); else hide(); }
    else hide();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
  window.addEventListener('scroll', () => { if (!pinned) hide(); }, { passive: true });
}

function escapeRe(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function skip(node: Node): boolean {
  let el = node.parentElement;
  while (el && el.id !== 'main-content') {
    if (SKIP_ANCESTORS.has(el.tagName)) return true;
    for (const c of SKIP_CLASSES) if (el.classList.contains(c)) return true;
    el = el.parentElement;
  }
  return false;
}

/** Wrap the first text-node match of `re` under `root`. Returns true if wrapped. */
function wrapFirst(root: HTMLElement, re: RegExp, label: string): boolean {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = node.nodeValue || '';
    const m = re.exec(text);
    if (!m) continue;
    if (skip(node)) continue;

    const span = document.createElement('span');
    span.className = 'term';
    span.setAttribute('tabindex', '0');
    span.setAttribute('role', 'button');
    span.setAttribute('data-def', GLOSSARY[label]);
    span.setAttribute('aria-label', `${m[0]}: ${GLOSSARY[label]}`);
    span.textContent = m[0];

    const after = (node as Text).splitText(m.index);
    after.nodeValue = after.nodeValue!.slice(m[0].length);
    node.parentNode!.insertBefore(span, after);
    return true;
  }
  return false;
}
