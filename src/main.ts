import './style.css';
import { initTheme } from './theme';
import { initGlossary } from './glossary';
import { initNav } from './nav';
import { renderBigPicture } from './exhibits/bigPicture';
import { renderGuidedWalkthrough } from './exhibits/guidedWalkthrough';
import { renderExhibit1 } from './exhibits/exhibit1';
import { renderExhibit2 } from './exhibits/exhibit2';
import { renderExhibit3 } from './exhibits/exhibit3';
import { renderExhibit4 } from './exhibits/exhibit4';
import { renderExhibit5 } from './exhibits/exhibit5';
import { renderExhibit6 } from './exhibits/exhibit6';
import { renderWhyUnstructured } from './exhibits/whyUnstructured';
import { renderBenchmark } from './exhibits/benchmark';
import { renderTransparency } from './exhibits/transparency';
import { renderReferences } from './exhibits/references';

// Initialize theme (anti-flash script already set the attribute)
initTheme();

type Level = 'beginner' | 'core' | '';

interface ExhibitDef {
  title: string;
  level: Level;
  render: (el: HTMLElement) => void;
  collapsed?: boolean; // start collapsed
}

const EXHIBITS: ExhibitDef[] = [
  { title: 'The Big Picture (Plain English)', level: 'beginner', render: renderBigPicture },
  { title: 'Guided Walkthrough', level: 'beginner', render: renderGuidedWalkthrough },
  { title: 'The LWE Core', level: 'core', render: renderExhibit1 },
  { title: 'Ternary Secret Visualizer', level: 'core', render: renderExhibit2 },
  { title: 'BW₃₂ Lattice Coding Explainer', level: 'core', render: renderExhibit3 },
  { title: 'Key Generation', level: 'core', render: renderExhibit4 },
  { title: 'Encapsulation, Decapsulation & the FO Transform', level: 'core', render: renderExhibit5 },
  { title: 'Scloud+ vs FrodoKEM vs ML-KEM', level: '', render: renderExhibit6 },
  { title: 'Structured vs Unstructured: The Real Trade-off', level: 'beginner', render: renderWhyUnstructured },
  { title: 'Performance', level: '', render: renderBenchmark, collapsed: true },
  { title: 'Transparency & Review', level: 'beginner', render: renderTransparency },
  { title: 'References & Further Reading', level: '', render: renderReferences, collapsed: true },
];

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// ── Table of contents ──────────────────────────────
const tocGrid = document.getElementById('toc-grid')!;
tocGrid.innerHTML = EXHIBITS.map((e, i) => {
  const badge = e.level === 'beginner'
    ? '<span class="toc-badge beginner">start</span>'
    : e.level === 'core' ? '<span class="toc-badge">core</span>' : '';
  return `<a class="toc-link" href="#exhibit-${i + 1}">
    <span class="toc-num">${i + 1}</span><span>${e.title}</span>${badge}</a>`;
}).join('');

// ── Exhibits ───────────────────────────────────────
const container = document.getElementById('exhibits')!;

const bodies: HTMLElement[] = [];
const headers: HTMLElement[] = [];
const ensureRender: (() => void)[] = [];

EXHIBITS.forEach((def, idx) => {
  const num = idx + 1;
  const exhibit = document.createElement('section');
  exhibit.className = 'exhibit';
  exhibit.id = `exhibit-${num}`;

  const header = document.createElement('div');
  header.className = 'exhibit-header';
  header.setAttribute('role', 'button');
  header.setAttribute('tabindex', '0');
  header.setAttribute('aria-expanded', def.collapsed ? 'false' : 'true');
  header.setAttribute('aria-controls', `exhibit-body-${num}`);
  const pill = def.level
    ? `<span class="level-pill ${def.level}">${def.level === 'beginner' ? 'Start here' : 'Core'}</span>`
    : '';
  header.innerHTML = `
    <h3><span class="exhibit-number" aria-hidden="true">${num}</span> ${def.title}${pill}</h3>
    <span class="toggle-icon" aria-hidden="true">${def.collapsed ? '▶' : '▼'}</span>
  `;

  const body = document.createElement('div');
  body.className = 'exhibit-body';
  body.id = `exhibit-body-${num}`;
  if (def.collapsed) body.style.display = 'none';

  exhibit.appendChild(header);
  exhibit.appendChild(body);
  container.appendChild(exhibit);
  bodies.push(body);
  headers.push(header);

  // Lazy render: collapsed sections (e.g. Performance) only build their content
  // the first time they're opened, so nothing heavy runs on initial page load.
  let rendered = false;
  const ensure = (): void => { if (!rendered) { def.render(body); rendered = true; } };
  ensureRender.push(ensure);

  function toggle(): void {
    const collapsed = body.style.display === 'none';
    if (collapsed) ensure();
    body.style.display = collapsed ? '' : 'none';
    header.setAttribute('aria-expanded', collapsed ? 'true' : 'false');
    header.querySelector('.toggle-icon')!.textContent = collapsed ? '▼' : '▶';
  }
  header.addEventListener('click', toggle);
  header.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });

  if (!def.collapsed) ensure();
});

// ── Expand / collapse all ──────────────────────────
function setAll(open: boolean): void {
  bodies.forEach((body, i) => {
    if (open) ensureRender[i]();
    body.style.display = open ? '' : 'none';
    headers[i].setAttribute('aria-expanded', open ? 'true' : 'false');
    headers[i].querySelector('.toggle-icon')!.textContent = open ? '▼' : '▶';
  });
}
document.getElementById('expand-all')?.addEventListener('click', () => setAll(true));
document.getElementById('collapse-all')?.addEventListener('click', () => setAll(false));

// ── Educational aids: glossary tooltips + navigation (scroll-spy, progress) ──
initGlossary();
initNav();

// keep slug helper referenced (anchors are numeric; slug kept for future use)
void slug;
