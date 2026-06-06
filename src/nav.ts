/**
 * Navigation aids (additive, theme-colored via CSS variables):
 *   - a thin reading-progress bar at the very top
 *   - scroll-spy that highlights the current section in the existing TOC
 *   - a "back to top" button that appears once you scroll down
 *
 * All elements are created here so index.html stays minimal.
 */

export function initNav(): void {
  // ── Reading-progress bar ──
  const progress = document.createElement('div');
  progress.id = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);

  // ── Back to top ──
  const toTop = document.createElement('button');
  toTop.id = 'back-to-top';
  toTop.setAttribute('aria-label', 'Back to top');
  toTop.innerHTML = '↑';
  toTop.addEventListener('click', () =>
    window.scrollTo({ top: 0, behavior: 'smooth' }));
  document.body.appendChild(toTop);

  const onScroll = (): void => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
    progress.style.width = pct + '%';
    toTop.classList.toggle('visible', h.scrollTop > 500);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── Scroll-spy on the TOC ──
  const links = new Map<string, HTMLElement>();
  document.querySelectorAll<HTMLElement>('.toc-link').forEach(a => {
    const href = a.getAttribute('href');
    if (href?.startsWith('#')) links.set(href.slice(1), a);
  });
  if (!links.size) return;

  const setActive = (id: string): void => {
    links.forEach((a, key) => a.classList.toggle('active', key === id));
  };

  const sections = Array.from(document.querySelectorAll<HTMLElement>('.exhibit'));
  if (!('IntersectionObserver' in window)) return;

  const visible = new Map<string, number>();
  const obs = new IntersectionObserver((entries) => {
    for (const e of entries) {
      visible.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0);
    }
    // pick the section with the greatest visible ratio
    let bestId = ''; let best = 0;
    visible.forEach((ratio, id) => { if (ratio > best) { best = ratio; bestId = id; } });
    if (bestId) setActive(bestId);
  }, { rootMargin: '-15% 0px -55% 0px', threshold: [0, 0.25, 0.5, 1] });

  sections.forEach(s => obs.observe(s));
}
