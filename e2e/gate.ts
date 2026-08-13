import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';
import { auditContrast, formatContrastFailures } from './contrast';
import { auditNonText } from './nontext';
import { NONTEXT_BASELINE } from './nontext-baseline';

export const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** A phone-width viewport, for the WCAG 1.4.10 reflow half of the gate. */
export const NARROW = { width: 380, height: 800 };

/**
 * Shared machinery for the WCAG gate on the Scloud+ Explorer.
 *
 * Five rules govern everything here, and each one is a correction of the gate
 * this replaces (`e2e/a11y.spec.ts`, and the `border.spec.ts` beside it):
 *
 *  1. NOTHING IS INJECTED INTO THE PAGE BEFORE A SCAN. The old spec's
 *     `neutralizeAnimations()` pushed `animation:none!important;
 *     transition:none!important` into the document through `addStyleTag`. That
 *     BYPASSED this stylesheet's own `@media (prefers-reduced-motion: reduce)`
 *     block instead of exercising it. The block matters here: `@keyframes
 *     fadeIn` runs `opacity: 0 → 1` and is applied by `.fade-in` to every
 *     result box this lab generates and by `.guide-step` to every step of the
 *     guided walkthrough, so it is exactly the shape where cancelling an
 *     animation can strand an element at its START value. It does not, because
 *     the block clamps `animation-duration` rather than setting
 *     `animation: none` and `fadeIn` ends at the declared `opacity: 1` — but
 *     that is a measurement (`expectNotBlank`, in every state) and not a
 *     reading of the CSS.
 *
 *  2. IT FORCE-REVEALED EVERY PANEL. `revealEverything()` set `d.open = true`
 *     on every `<details>` and then clicked `#expand-all`. This lab collapses
 *     two of its twelve exhibits by default — Performance and References — and
 *     LAZILY RENDERS them: `main.ts` only calls their `render()` the first time
 *     they are opened. So the arrival state, which is the first thing every
 *     reader sees and the only state in which those two sections are empty, was
 *     never scanned once. This gate scans it first, and reaches every panel
 *     through the control a reader would press.
 *
 *  3. IT SCANNED ONCE, AT ONE VIEWPORT, AFTER A BEST-EFFORT CLICK STORM. The
 *     old drive matched buttons by their visible text and wrapped every click
 *     in `try {} catch {}` with `if (await btn.count())` — so a control that
 *     disappeared skipped SILENTLY instead of failing, and a renamed button
 *     took its whole exhibit out of the drive with no signal at all. It then
 *     waited a fixed `300ms` and scanned once. Six exhibits, three parameter
 *     selects, the noise slider's extremes, the tamper branch, the guided
 *     walkthrough's seven steps and the entire 380px column had never been
 *     measured. This drive names every control, asserts every completion
 *     signal, and scans after every step in {dark, light} × {1280, 380}.
 *
 *  4. `violations` IS NOT THE WHOLE ORACLE. See `scan`. Two things on this page
 *     are invisible to a violations-only assertion in particular: the hero
 *     aside is `color-mix(in oklab, var(--accent) 6%, transparent)` over a
 *     translucent stack, which axe files under `incomplete` rather than
 *     resolving; and an `aria-label` on a role-less element is PROHIBITED and
 *     lands in `incomplete` too, never in `violations` — which is live here,
 *     because `exhibit1.ts` puts an `aria-label` on every one of its 96
 *     role-less `.matrix-cell` divs.
 *
 *  5. IT HAD NO REFLOW, KEYBOARD-SCROLLER OR NON-TEXT ORACLE. `border.spec.ts`
 *     was the only 1.4.11 check in the repo and it measured `.param-select`
 *     alone — which is the ONLY selector in `style.css` that
 *     `var(--control-border)` is applied to, out of 34 border declarations. A
 *     check aimed at the one place a rule is already kept cannot fail, so it
 *     was deleted and `nontext.ts` measures every control on the page instead.
 */

/**
 * Wait for every running animation and transition to drain.
 *
 * Transitions drain in waves, not in one batch, so a poll for "nothing running
 * right now" can exit through a gap between waves. Require quiescence to hold
 * for several consecutive frames instead.
 */
export async function settle(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const w = window as unknown as { __quietFrames?: number };
      const running = document.getAnimations().filter((a) => a.playState === 'running');
      w.__quietFrames = running.length === 0 ? (w.__quietFrames ?? 0) + 1 : 0;
      return w.__quietFrames >= 6;
    },
    undefined,
    { timeout: 20_000, polling: 'raf' }
  );
}

/**
 * Assert that reduced motion left the page visible, not merely un-animated.
 *
 * The failure mode this guards against is an element whose only route to its
 * visible state is an animation, in a stylesheet whose reduced-motion block
 * cancels that animation without restoring its end state — the element then
 * renders at `opacity: 0` for every reader with the preference set.
 *
 * This page is the shape that risks it. `@keyframes fadeIn` starts at
 * `opacity: 0`, and `.fade-in` is on every result box the six exhibits
 * generate while `.guide-step` is on every step of the guided walkthrough. The
 * reduced-motion block clamps `animation-duration` to `0.01ms` rather than
 * setting `animation: none`, so the animation still runs and still lands on its
 * `to { opacity: 1 }` — but that is a property of the current CSS, and this
 * assertion is what turns it into a measurement taken in every driven state.
 *
 * It also catches the two controls this lab hides with `opacity: 0` rather than
 * `visibility` — `#back-to-top` before the reader scrolls, and `.glossary-tip`
 * between hovers — which is a real defect when the element is focusable, and is
 * how it was found.
 *
 * `aria-hidden` subtrees are excluded, matching axe's own boundary.
 */
async function expectNotBlank(page: Page, label: string): Promise<void> {
  const invisible = await page.evaluate(() => {
    const out: string[] = [];
    for (const el of Array.from(document.querySelectorAll('body *'))) {
      const own = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent ?? '')
        .join('')
        .trim();
      if (!own) continue;
      // Deliberately hidden subtrees are not "blank", they are closed.
      if (!(el as HTMLElement).checkVisibility?.({ checkVisibilityCSS: true })) continue;
      if (el.closest('[aria-hidden="true"]')) continue;
      let effective = 1;
      let node: Element | null = el;
      while (node) {
        effective *= parseFloat(getComputedStyle(node).opacity);
        node = node.parentElement;
      }
      if (effective === 0) {
        out.push(`${el.tagName.toLowerCase()}#${el.id}.${(el.getAttribute('class') ?? '').trim()}`);
      }
    }
    return Array.from(new Set(out));
  });
  expect(invisible, `no visible text may render at opacity 0 in state: ${label}`).toEqual([]);
}

/**
 * Uncaught page errors and console errors, collected from the moment the page
 * is created. A renderer that throws halfway through leaves an earlier state on
 * screen, and a gate that scans that state reports green for a page that is
 * broken. Attach before `boot`, assert after the drive.
 */
export function watchPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console.error: ${m.text()}`);
  });
  return errors;
}

/**
 * Exactly one banner landmark: the shared bar.
 *
 * This page has TWO `<header>` elements — the shared `.cl-topbar` and the
 * lab's own `.cl-hero`. The hero sits inside `<main class="container">`, which
 * scopes it out of the banner role on its own, and `index.html`'s
 * `dedupeBanner()` skips it for that reason (`el.closest('main, …')` returns
 * early). Asserting the OUTCOME rather than either mechanism means a change to
 * the nesting is caught too.
 */
export async function assertSingleBanner(page: Page): Promise<void> {
  const banners = await page.evaluate(() => {
    const scoped = new Set(['MAIN', 'ARTICLE', 'ASIDE', 'NAV', 'SECTION']);
    const isBanner = (el: Element): boolean => {
      if (el.getAttribute('role') === 'banner') return true;
      if (el.tagName !== 'HEADER') return false;
      if (el.getAttribute('role')) return false; // explicit non-banner role wins
      for (let p = el.parentElement; p; p = p.parentElement) if (scoped.has(p.tagName)) return false;
      return true;
    };
    return [...document.querySelectorAll('header,[role="banner"]')].filter(isBanner).length;
  });
  expect(banners, 'exactly one banner landmark').toBe(1);
}

/**
 * The twelve exhibits, in the order `main.ts` mounts them, with the two that
 * ship COLLAPSED marked.
 *
 * A collapsed exhibit is not merely hidden: `main.ts` lazily renders it, so its
 * body is genuinely EMPTY until the first time it is opened. That is why the
 * arrival state has to be scanned before anything is expanded, and why the
 * expansion has to go through `#expand-all` (or the header) rather than through
 * `style.display`.
 */
export const EXHIBITS = [
  { n: 1, title: 'The Big Picture (Plain English)', collapsed: false },
  { n: 2, title: 'Guided Walkthrough', collapsed: false },
  { n: 3, title: 'The LWE Core', collapsed: false },
  { n: 4, title: 'Ternary Secret Visualizer', collapsed: false },
  { n: 5, title: 'BW₃₂ Lattice Coding Explainer', collapsed: false },
  { n: 6, title: 'Key Generation', collapsed: false },
  { n: 7, title: 'Encapsulation, Decapsulation & the FO Transform', collapsed: false },
  { n: 8, title: 'Scloud+ vs FrodoKEM vs ML-KEM', collapsed: false },
  { n: 9, title: 'Structured vs Unstructured: The Real Trade-off', collapsed: false },
  { n: 10, title: 'Performance', collapsed: true },
  { n: 11, title: 'Transparency & Review', collapsed: false },
  { n: 12, title: 'References & Further Reading', collapsed: true },
] as const;

/**
 * Load the page in a known theme with reduced motion actually in effect, and
 * assert the content every scan relies on is really on the page — including the
 * lab's DEFAULTS, which are never assumed.
 *
 * `test.use({ reducedMotion })` silently does nothing on Playwright 1.61.1, so
 * the emulation is applied imperatively BEFORE the navigation and then
 * *asserted* from inside the page.
 *
 * The theme is seeded through `localStorage` rather than by clicking the
 * toggle, which also pins down a real failure mode: `index.html`'s anti-flash
 * script reads `localStorage.getItem('theme')` and both the shared bar's
 * toggle and `src/theme.ts` write `localStorage.setItem('theme', …)`. If those
 * keys drifted apart the theme would silently stop persisting, and this boot
 * fails on `data-theme` rather than quietly scanning dark twice.
 *
 * The defaults are asserted at length because the old gate expanded everything
 * before it looked. Ten exhibits ship OPEN and two ship COLLAPSED AND
 * UNRENDERED; three of the open ones have already produced output at first
 * paint (`exhibit1.ts`, `exhibit2.ts` and `exhibit3.ts` each call their own
 * renderer on mount) while KeyGen, Encaps and the benchmark are empty until
 * pressed. Which half a single-configuration gate scans depends entirely on
 * those defaults, so they are written down and checked.
 */
export async function boot(page: Page, theme: 'dark' | 'light'): Promise<void> {
  // A click on a control that never becomes actionable otherwise burns the
  // whole test timeout and reports nothing useful. 20s turns that silent hang
  // into a named failure naming the locator.
  page.setDefaultTimeout(20_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
  await page.goto('.');
  expect(
    await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches),
    'reduced-motion emulation must actually be in effect'
  ).toBe(true);
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  await assertSingleBanner(page);

  // Both skip links must point at an element that EXISTS. axe's skip-link rule
  // is best-practice rather than WCAG-tagged, so `withTags` never runs it, and
  // a dangling target is invisible to a green axe pass — which is how
  // `.cl-skip-link`'s `href="#app"` survived on a page whose main region is
  // `#main-content`.
  const danglingSkip = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'))
      .filter((a) => (a.getAttribute('href') ?? '').length > 1)
      .filter((a) => !document.getElementById((a.getAttribute('href') ?? '').slice(1)))
      .map((a) => `${a.className} -> ${a.getAttribute('href')}`)
  );
  expect(danglingSkip, 'in-page links must resolve to an element that exists').toEqual([]);

  // The lab mounts its whole page from `src/main.ts`, so a navigation that
  // resolves proves nothing.
  await expect(page.locator('.exhibit')).toHaveCount(EXHIBITS.length);
  await expect(page.locator('.toc-link')).toHaveCount(EXHIBITS.length);

  // ── Every shipped exhibit default: which are open, which are unrendered ──
  for (const e of EXHIBITS) {
    const body = page.locator(`#exhibit-body-${e.n}`);
    const header = page.locator(`#exhibit-${e.n} .exhibit-header`);
    if (e.collapsed) {
      await expect(body).toBeHidden();
      await expect(header).toHaveAttribute('aria-expanded', 'false');
      // Lazily rendered: collapsed means EMPTY, not merely hidden.
      expect(
        await body.evaluate((el) => el.childElementCount),
        `#exhibit-body-${e.n} must ship unrendered`
      ).toBe(0);
    } else {
      await expect(body).toBeVisible();
      await expect(header).toHaveAttribute('aria-expanded', 'true');
    }
  }

  // ── The three exhibits that HAVE produced output at first paint ─────────
  await expect(page.locator('#lwe-output .vec-entry').first()).toBeVisible();
  await expect(page.locator('#ternary-output .vec-entry').first()).toBeVisible();
  await expect(page.locator('#bw32-encode-output .result-box')).toBeVisible();

  // ── …and the three that have not ────────────────────────────────────────
  await expect(page.locator('#keygen-output')).toBeEmpty();
  await expect(page.locator('#encaps-output')).toBeEmpty();
  await expect(page.locator('#bw32-batch-output')).toBeEmpty();
  await expect(page.locator('#bw32-decode-output')).toBeEmpty();

  // ── Every shipped control default ───────────────────────────────────────
  await expect(page.locator('#bw32-msg-input')).toHaveValue('13');
  await expect(page.locator('#bw32-noise-slider')).toHaveValue('200');
  await expect(page.locator('#bw32-noise-val')).toHaveText('200');
  await expect(page.locator('#keygen-param-select')).toHaveValue('128');
  await expect(page.locator('#encaps-param-select')).toHaveValue('128');
  await expect(page.locator('#cmp-level')).toHaveValue('128');
  await expect(page.locator('#bm-level')).toHaveCount(0); // still unrendered
  await expect(page.locator('#gw-progress')).not.toBeEmpty();

  // `#back-to-top` ships hidden until the reader has scrolled 500px, and
  // `.glossary-tip` is hidden between hovers. Both used to hide with
  // `opacity: 0` and `pointer-events: none` alone, which stops the mouse and
  // nothing else — the button kept `tabIndex: 0` and `document.activeElement`
  // really did land on it, so a keyboard reader got a focus ring around a
  // control painting no pixels (WCAG 2.4.7). Probed rather than inferred from
  // the CSS, because the whole point is that the declared value and the
  // reachable behaviour had come apart.
  expect(
    await page.evaluate(() => {
      const b = document.getElementById('back-to-top') as HTMLButtonElement | null;
      if (!b) return 'absent';
      b.focus();
      return document.activeElement === b ? 'focusable' : 'not focusable';
    }),
    'a control hidden until scroll must be out of the tab order, not merely transparent'
  ).toBe('not focusable');

  // No native <details> anywhere — every disclosure here is the custom
  // `.exhibit-header` role="button". Asserted so the drive's coverage claim
  // stays true if one is ever added.
  await expect(page.locator('details')).toHaveCount(0);

  await settle(page);
  await expectNotBlank(page, `${theme} first paint`);
}

/**
 * Assert the page does not require horizontal scrolling.
 *
 * WCAG 1.4.10 (Reflow, AA). axe has no rule for this at all, and this page is
 * the shape that breaks it: a twelve-row KEM comparison table, four bar charts,
 * a 600x32 matrix visualisation, 32-cell BW₃₂ heat grids and a lattice-compare
 * pair of grids. Each wide block is meant to scroll inside its own
 * `.table-scroll` / `.matrix-scroll`; the assertion here is that none of them
 * scrolls the DOCUMENT.
 */
export async function expectNoHorizontalOverflow(page: Page, label: string): Promise<void> {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    if (doc.scrollWidth <= doc.clientWidth) return null;

    // Only elements that actually push the DOCUMENT sideways are culprits. A
    // wide box inside an `overflow-x: auto` wrapper has a huge bounding rect
    // but is clipped by its scroller and contributes nothing to the document's
    // scroll width — naming it sends you off fixing the wrong element. This
    // page has a decoy behind every `.table-scroll` and `.matrix-scroll`.
    const clipped = (el: Element): boolean => {
      let n = el.parentElement;
      while (n && n !== doc) {
        const ox = getComputedStyle(n).overflowX;
        if (ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip') return true;
        n = n.parentElement;
      }
      return false;
    };

    const over = Array.from(document.querySelectorAll('body *'))
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter((x) => x.r.width > 0 && x.r.right > doc.clientWidth + 1)
      .sort((a, b) => b.r.right - a.r.right);
    const widest = over.filter((x) => !clipped(x.el))[0] ?? over[0];
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      widest: widest
        ? `${clipped(widest.el) ? '[clipped] ' : ''}${widest.el.tagName.toLowerCase()}${widest.el.id ? '#' + widest.el.id : ''}` +
          `${widest.el.getAttribute('class') ? '.' + widest.el.getAttribute('class')!.trim().split(/\s+/).join('.') : ''}` +
          ` @${Math.round(widest.r.width)}px right=${Math.round(widest.r.right)}`
        : '(none identified)',
    };
  });
  expect(overflow, `page must not scroll horizontally in state: ${label}`).toBeNull();
}

/**
 * Every scrolling container must be operable from the keyboard (WCAG 2.1.1). If
 * it holds no focusable content it needs `tabindex="0"`, so it becomes a focus
 * target arrow keys can then scroll.
 *
 * This lab's own wide blocks already handle it — `bigPicture.ts` and
 * `exhibit6.ts` build their `.table-scroll` wrappers with `role="region"`,
 * `tabindex="0"` and an `aria-label`, and `exhibit1.ts` does the same for its
 * `.matrix-scroll`. The assertion stays because that is a convention repeated
 * by hand in three files rather than an enforcement, and because the content
 * inside those scrollers is the evidence for most of what the page claims.
 */
export async function expectScrollersReachable(page: Page, label: string): Promise<void> {
  const unreachable = await page.evaluate(() => {
    const FOCUSABLE = 'a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])';
    return Array.from(document.querySelectorAll<HTMLElement>('body *'))
      .filter((el) => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)
      .filter((el) => {
        const cs = getComputedStyle(el);
        return (
          ['auto', 'scroll'].includes(cs.overflowX) || ['auto', 'scroll'].includes(cs.overflowY)
        );
      })
      .filter((el) => el.tabIndex < 0 && !el.querySelector(FOCUSABLE))
      .map(
        (el) =>
          `${el.tagName.toLowerCase()}#${el.id}.${(el.getAttribute('class') ?? '').trim()}` +
          ` (${el.scrollWidth}x${el.scrollHeight} in ${el.clientWidth}x${el.clientHeight})`
      );
  });
  expect(
    Array.from(new Set(unreachable)),
    `scrolling regions with no keyboard route in state: ${label}`
  ).toEqual([]);
}

/**
 * An explicit role on a list REPLACES its implicit `list` role, orphaning every
 * `<li>` and firing axe's `listitem` rule once per child.
 *
 * Worth asking the DOM rather than grepping: this lab builds its DOM out of
 * `innerHTML` template literals with roles written as attributes inside the
 * string, so a markup grep sees them only if it guesses the exact spelling. The
 * one benign case is `role="list"` itself (redundant but harmless), which
 * `exhibit1.ts` uses on three `<div>` vectors — those are DIVs, not `<ul>`, so
 * the role is what gives them list semantics at all and they do not appear
 * here.
 */
export async function expectNoOrphanedLists(page: Page): Promise<void> {
  const broken = await page.$$eval('ul[role], ol[role]', (els) =>
    els
      .filter((e) => e.getAttribute('role') !== 'list')
      .map((e) => `${e.tagName.toLowerCase()}[role=${e.getAttribute('role')}] with ${e.children.length} children`)
  );
  expect(broken, 'an explicit role on a list deletes its list semantics').toEqual([]);
}

/**
 * When `A11Y_COLLECT` is set, `scan` records failures instead of throwing.
 *
 * A strict gate reports the first failing assertion in the first failing state
 * and stops, so a page with defects in several states needs one full run per
 * defect to enumerate them. The collection pass turns that into a single run.
 * It is a debugging aid only: `A11Y_COLLECT` is never set in CI, and a run with
 * it set prints every finding as it happens and then FAILS at the end, so a
 * green collection run cannot be mistaken for a green gate.
 */
const COLLECTING = !!process.env.A11Y_COLLECT;
const collected: string[] = [];

function record(entry: string): void {
  collected.push(entry);
  // Printed as it happens, not only at the end: a hard assertion later in the
  // drive would otherwise abort the test before anything collected so far was
  // ever shown.
  console.log(`\n[A11Y_COLLECT #${collected.length}] ${entry}`);
}

export function softExpect(actual: unknown, message: string, expected: unknown): void {
  if (!COLLECTING) {
    expect(actual, message).toEqual(expected);
    return;
  }
  try {
    expect(actual, message).toEqual(expected);
  } catch {
    record(`${message}\n  ${JSON.stringify(actual, null, 2)}`);
  }
}

/**
 * Fail the test if the collection pass recorded anything. Without this a
 * collection run would end green, and a green collection run is
 * indistinguishable from a green gate — which is the exact confusion the whole
 * exercise exists to remove.
 */
export function reportCollected(): void {
  if (!COLLECTING) return;
  expect(collected, `A11Y_COLLECT recorded ${collected.length} failure(s)`).toEqual([]);
}

async function expectScrollersReachableSoft(page: Page, label: string): Promise<void> {
  if (!COLLECTING) return expectScrollersReachable(page, label);
  try {
    await expectScrollersReachable(page, label);
  } catch (e) {
    record(String(e).slice(0, 6000));
  }
}

/**
 * The 1.4.11 ratchet, soft-wrapped the same way as every other oracle here.
 *
 * It is called from `scan()`. In the reference gate this sweep copied from it
 * was reachable only from inside `expectScrollersReachableSoft`, AFTER that
 * function's `if (!COLLECTING) return …` guard — so in a strict run, which is
 * every run anyone reads as a pass, the guard returned first and `nontext.ts`
 * never executed at all. Calling it here means it runs in every driven state,
 * in both themes, at both widths.
 */
async function expectNoNewNonTextFailuresSoft(page: Page, label: string): Promise<void> {
  if (!COLLECTING) return expectNoNewNonTextFailures(page, label);
  try {
    await expectNoNewNonTextFailures(page, label);
  } catch (e) {
    record(String(e).slice(0, 6000));
  }
}

async function expectNoHorizontalOverflowSoft(page: Page, label: string): Promise<void> {
  if (!COLLECTING) return expectNoHorizontalOverflow(page, label);
  try {
    await expectNoHorizontalOverflow(page, label);
  } catch (e) {
    record(String(e).slice(0, 6000));
  }
}

/**
 * WCAG 1.4.11 and generated content, ratcheted against a per-repo baseline.
 *
 * Neither class has ANY other oracle: axe has no rule for non-text contrast,
 * and the arithmetic text walk cannot reach a control's boundary or a
 * `::before` glyph, because a pseudo-element is not an element and owns no text
 * node.
 *
 * The backlog is real, so this does not block on it — but a check that merely
 * logs is not a gate. So it ratchets instead: anything NOT in the baseline
 * fails, anything in the baseline that got WORSE fails, and anything in the
 * baseline that has been FIXED fails until its entry is deleted. That last rule
 * is what stops the allowlist becoming a permanent exemption.
 */
const nonTextSeen = new Set<string>();

export async function expectNoNewNonTextFailures(page: Page, label: string): Promise<void> {
  const found = await auditNonText(page);
  // Capture mode: emit every finding and assert nothing, so a baseline can be
  // generated by the SAME path that checks it.
  if (process.env.NT_BASELINE_CAPTURE) {
    for (const f of found) {
      console.log(`NTCAP|${f.kind}|${f.selector}|${f.ratio}|${f.required}|${/POSITIONED/.test(f.detail)}`);
    }
    return;
  }
  const problems: string[] = [];
  for (const f of found) {
    const key = `${f.kind}|${f.selector}`;
    nonTextSeen.add(key);
    const base = NONTEXT_BASELINE[key];
    if (!base) {
      problems.push(`NEW ${f.ratio}:1 (needs ${f.required}:1) [${f.kind}] ${f.selector} — ${f.detail}`);
    } else if (f.ratio < base.ratio - 0.01) {
      problems.push(`WORSE ${f.selector}: ${f.ratio}:1, baseline recorded ${base.ratio}:1`);
    }
  }
  expect(problems, `new or worsened non-text contrast in state: ${label}`).toEqual([]);
}

/**
 * Fail if a baselined finding never appeared during the whole drive.
 *
 * It has either been fixed — in which case delete the entry, which is the point
 * — or the drive stopped reaching the state that shows it, which is a coverage
 * regression worth knowing about. Call once, after `driveAllStates`.
 */
export function expectBaselineNotStale(): void {
  const unseen = Object.keys(NONTEXT_BASELINE).filter((k) => !nonTextSeen.has(k));
  expect(
    unseen,
    'baselined non-text findings that no longer appear — delete them from nontext-baseline.ts (or restore the drive state that showed them)'
  ).toEqual([]);
}

/**
 * Scan the page as it currently stands.
 *
 * Seven assertions, because axe's `violations` array alone is not a complete
 * oracle:
 *
 *  - reduced-motion end state — see `expectNotBlank`.
 *  - `violations` — the usual WCAG A/AA rule failures, plus four landmark
 *    best-practice rules `withTags` does not run on its own.
 *  - `incomplete` — axe's "could not decide" bucket, which never reaches the
 *    violations array. The one rule id allowed to remain incomplete is
 *    `color-contrast`, and only because the next assertion computes those
 *    ratios arithmetically. Everything else in that bucket is a real result axe
 *    simply could not finish — including `aria-prohibited-attr`, which is where
 *    an `aria-label` on a role-less element hides, a defect that never reaches
 *    the violations array at all.
 *  - arithmetic contrast — composite-aware WCAG 1.4.3 over every text node.
 *  - non-text contrast and generated content — SC 1.4.11, which axe has no rule
 *    for; see `nontext.ts`.
 *  - keyboard reachability of scrolling regions — WCAG 2.1.1.
 *  - reflow — WCAG 1.4.10, which axe has no rule for at all.
 */
export async function scan(page: Page, label: string): Promise<void> {
  await settle(page);
  await expectNotBlank(page, label);
  // TWO axe runs, deliberately, and this is not a style choice.
  //
  // `AxeBuilder.withTags()` and `AxeBuilder.withRules()` both write the same
  // `options.runOnly` field, so the second call SILENTLY REPLACES the first —
  // the axe-core/playwright source says so in as many words on `withRules`
  // ("Cannot be used with AxeBuilder#withTags"). Chained as
  // `.withTags(TAGS).withRules([...4 landmark rules])`, axe therefore runs
  // those FOUR best-practice rules and NOT ONE WCAG RULE, while a green result
  // reads exactly like a full A/AA pass. For scale, `withTags(TAGS)` selects 69
  // of axe-core 4.12's 105 rule definitions.
  //
  // Running the two sets separately and merging is the only way to have both.
  // The landmark four are still wanted because they are best-practice rather
  // than WCAG-tagged, so `withTags` alone does not reach them, and this page
  // has the shape they catch: a shared sticky <header role="banner"> above a
  // <main> that contains a second <header> with an <aside role="complementary">
  // inside it.
  const wcag = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const landmarks = await new AxeBuilder({ page })
    .withRules([
      'landmark-no-duplicate-banner',
      'landmark-unique',
      'landmark-one-main',
      'landmark-complementary-is-top-level',
    ])
    .analyze();
  const results = {
    violations: [...wcag.violations, ...landmarks.violations],
    incomplete: [...wcag.incomplete, ...landmarks.incomplete],
  };

  const violations = results.violations.map((v) => ({
    state: label,
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.map((n) => n.target.join(' ')).slice(0, 8),
  }));
  softExpect(violations, `axe violations in state: ${label}`, []);

  const unexplainedIncomplete = results.incomplete
    .filter((v) => v.id !== 'color-contrast')
    .map((v) => ({
      state: label,
      id: v.id,
      nodes: v.nodes.map((n) => n.target.join(' ')).slice(0, 8),
    }));
  softExpect(unexplainedIncomplete, `axe incomplete results in state: ${label}`, []);

  const contrast = Array.from(new Set(formatContrastFailures(await auditContrast(page))));
  softExpect(contrast, `measured contrast failures in state: ${label}`, []);

  await expectNoNewNonTextFailuresSoft(page, label);
  await expectScrollersReachableSoft(page, label);
  await expectNoHorizontalOverflowSoft(page, label);
}

// ── The drive ───────────────────────────────────────────────────────────────

/** Open one exhibit through its own header, the way a reader does. */
async function openExhibit(page: Page, n: number): Promise<void> {
  const header = page.locator(`#exhibit-${n} .exhibit-header`);
  await header.click();
  await expect(header).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator(`#exhibit-body-${n}`)).toBeVisible();
}

/**
 * Drive the lab through the states that render content, scanning each.
 *
 * Six things shape this drive:
 *
 *  - THE ARRIVAL STATE IS SCANNED FIRST, before anything is expanded. Two of
 *    the twelve exhibits ship collapsed AND unrendered, and three of the ten
 *    open ones have already generated output on mount. That mixture is the
 *    first thing every reader sees and the old gate never measured it: it
 *    clicked `#expand-all` before its only scan.
 *
 *  - EVERY EXHIBIT IS OPENED THROUGH A CONTROL. The two collapsed ones are
 *    opened by clicking their own `.exhibit-header` (which is a `role="button"`
 *    with `aria-expanded`), and the rest by `#expand-all`, so the lazy render
 *    happens the way it happens for a reader. `style.display` is never touched.
 *
 *  - BOTH ENDS OF EVERY RANGE. The BW₃₂ noise slider is driven to 0 and to its
 *    maximum 1400, because those are the only routes to the "all decoded" and
 *    "all failed" verdicts — two different result inks, one of which
 *    (`--danger` as prose on a result box) no other state on the page paints.
 *    Every parameter `<select>` is driven to its last option too, since the
 *    128-bit default is the only one a defaults-only gate ever sees.
 *
 *  - THE ERROR AND EMPTY STATES. `#bw32-msg-input` is pushed out of its 0–31
 *    range, and the guided walkthrough is driven to its first step (Prev
 *    disabled) and its last (Next disabled) — the two states where a control is
 *    inactive and its dimmed rendering is what a reader meets.
 *
 *  - THE TAMPER BRANCH. `#encaps-tamper` is the only route to the FO transform's
 *    *reject* branch, and therefore the only state that paints
 *    `.fo-branch-card.reject` and its `filter: saturate(.55)` dimmed twin —
 *    which is the comparison the whole exhibit exists to make.
 *
 *  - NO FIXED TIMEOUTS. Every exhibit has a DOM completion signal: a result box
 *    appearing, a stage list filling, a verdict changing. The drive waits on
 *    those. The old gate waited 300ms and hoped.
 */
export async function driveAllStates(page: Page, theme: string): Promise<void> {
  const scanAt = (s: string): Promise<void> => scan(page, `${theme} / ${s}`);

  await expectNoOrphanedLists(page);
  await scanAt('first paint, ten exhibits open and two collapsed unrendered');

  // The skip link is the first focusable element on the page, and it is the
  // only state in which it paints at all.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.());
  await page.keyboard.press('Tab');
  await expect(page.locator('a.cl-skip-link')).toBeFocused();
  await scanAt('shared skip link focused');
  await page.keyboard.press('Tab');
  await scanAt('second tab stop focused');

  // ── The two collapsed exhibits, opened through their own headers ────────
  await openExhibit(page, 10);
  await expect(page.locator('#bm-run')).toBeVisible();
  await expect(page.locator('#bm-spec .bar-row').first()).toBeVisible();
  await scanAt('Performance opened from its header and lazily rendered');

  await openExhibit(page, 12);
  await expect(page.locator('#exhibit-body-12 a[href^="http"]').first()).toBeVisible();
  await scanAt('References opened from its header and lazily rendered');

  // ── Exhibit 3: the LWE core ─────────────────────────────────────────────
  await page.click('#lwe-resample');
  await expect(page.locator('#lwe-output .matrix-cell').first()).toBeVisible();
  await scanAt('LWE core resampled');

  // ── Exhibit 4: the ternary sampler, both routes ─────────────────────────
  await page.click('#ternary-instant');
  await expect(page.locator('#ternary-stats .result-row')).toHaveCount(5);
  await scanAt('ternary secret sampled instantly');

  // The animated route disables BOTH buttons for its whole run, which is the
  // only state on this page where a `.btn` and a `.btn-secondary` are inactive
  // side by side at `opacity: .5`.
  await page.click('#ternary-animate');
  await expect(page.locator('#ternary-animate')).toBeDisabled();
  await scanAt('ternary shuffle animating, both controls inactive');
  await expect(page.locator('#ternary-animate')).toBeEnabled({ timeout: 60_000 });
  await expect(page.locator('#ternary-instant')).toBeEnabled();
  await scanAt('ternary shuffle finished');

  // ── Exhibit 5: BW₃₂, both ends of the noise range ───────────────────────
  await page.fill('#bw32-msg-input', '31');
  await page.click('#bw32-encode-btn');
  await expect(page.locator('#bw32-encode-output .bw32-cell').first()).toBeVisible();
  await scanAt('BW₃₂ encoded the maximum 5-bit message');

  // Out of range: `parseInt(v) & 0x1F` masks rather than rejects, so this is
  // the state where the input's value and the encoded message disagree.
  await page.fill('#bw32-msg-input', '99');
  await page.click('#bw32-encode-btn');
  await expect(page.locator('#bw32-encode-output .result-box')).toBeVisible();
  await scanAt('BW₃₂ message input driven out of its 0–31 range');
  await page.fill('#bw32-msg-input', '13');

  await page.locator('#bw32-noise-slider').fill('0');
  await expect(page.locator('#bw32-noise-val')).toHaveText('0');
  await page.click('#bw32-decode-btn');
  await expect(page.locator('#bw32-decode-output .success').first()).toBeVisible();
  await page.click('#bw32-batch-btn');
  await expect(page.locator('#bw32-batch-output')).toContainText('All decoded correctly');
  await scanAt('BW₃₂ at zero noise, every trial decoded');

  await page.locator('#bw32-noise-slider').fill('1400');
  await expect(page.locator('#bw32-noise-val')).toHaveText('1400');
  // A single decode at the maximum sigma is a COIN FLIP, not a certainty: the
  // noise is freshly sampled on every click and one draw can still land inside
  // the BW₃₂ correction radius. Asserting `.danger` after one click therefore
  // fails at random, which it did in two of the first four configurations — a
  // flaky gate is worse than none, and "raise sigma until it never decodes" is
  // not available because 1400 is the slider's maximum. So the drive presses
  // the button until the failure state exists, with a bound, and then asserts
  // that it does: the state is reached deliberately rather than hoped for.
  const danger = page.locator('#bw32-decode-output .danger').first();
  for (let i = 0; i < 25 && !(await danger.isVisible()); i++) {
    await page.click('#bw32-decode-btn');
  }
  await expect(danger, 'a decode past the correction radius must be reachable').toBeVisible();
  // The 100-trial batch is the deterministic half of the same statement.
  await page.click('#bw32-batch-btn');
  await expect(page.locator('#bw32-batch-output .danger').first()).toBeVisible();
  await scanAt('BW₃₂ past its correction radius, the failure ink');

  // ── Exhibit 6: KeyGen, at both ends of the parameter range ──────────────
  await expect(page.locator('#keygen-output')).toBeEmpty();
  await page.click('#keygen-run');
  await expect(page.locator('#kg-stages .stage-item.done').first()).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('#kg-result')).not.toBeEmpty();
  await scanAt('KeyGen run at the 128-bit parameter set');

  await page.selectOption('#keygen-param-select', '256');
  await page.click('#keygen-run');
  await expect(page.locator('#kg-result')).toContainText('Scloud+-256', { timeout: 300_000 });
  await expect(page.locator('#keygen-run')).toBeEnabled();
  await scanAt('KeyGen run at the 256-bit parameter set');

  // ── Exhibit 7: Encaps/Decaps, and the FO reject branch ──────────────────
  // `.fo-branch` always renders BOTH cards and dims the one not taken, so the
  // branch that was actually taken is the one WITHOUT `.dim` — asserting
  // `.reject` alone would pass on the honest run too.
  await page.click('#encaps-run');
  await expect(page.locator('#ek-result .fo-branch-card.accept:not(.dim)')).toBeVisible({
    timeout: 300_000,
  });
  await expect(page.locator('#ek-result .fo-branch-card.reject.dim')).toBeVisible();
  await expect(page.locator('#encaps-run')).toBeEnabled();
  await scanAt('Encaps + Decaps succeeded, the FO accept branch taken');

  await page.click('#encaps-tamper');
  await expect(page.locator('#ek-result .fo-branch-card.reject:not(.dim)')).toBeVisible({
    timeout: 300_000,
  });
  await expect(page.locator('#ek-result')).toContainText('IMPLICIT REJECT');
  await expect(page.locator('#encaps-tamper')).toBeEnabled();
  await scanAt('ciphertext tampered, the FO reject branch and its dimmed twin');

  // ── Exhibit 8: the comparison, redrawn at another level ─────────────────
  await page.selectOption('#cmp-level', '256');
  await expect(page.locator('#cmp-pk')).not.toBeEmpty();
  await scanAt('KEM comparison redrawn at the 256-bit level');

  // ── Exhibit 10: the live benchmark ──────────────────────────────────────
  await page.click('#bm-run');
  await expect(page.locator('#bm-live .bar-row').first()).toBeVisible({ timeout: 300_000 });
  await expect(page.locator('#bm-run')).toBeEnabled();
  await scanAt('live benchmark measured in this browser');

  // ── Exhibit 2: every step of the guided walkthrough ─────────────────────
  await expect(page.locator('#gw-prev')).toBeDisabled();
  await scanAt('guided walkthrough at step 1, Prev inactive');
  for (let i = 0; i < 20; i++) {
    if (await page.locator('#gw-next').isDisabled()) break;
    await page.click('#gw-next');
    await expect(page.locator('#gw-body')).not.toBeEmpty();
    await scanAt(`guided walkthrough advanced to step ${i + 2}`);
  }
  await expect(page.locator('#gw-next')).toBeDisabled();
  await page.click('#gw-reset');
  await expect(page.locator('#gw-prev')).toBeDisabled();
  await scanAt('guided walkthrough reset to a fresh random run');

  // ── The glossary tooltip, reached the way a keyboard reader reaches it ──
  const term = page.locator('.term').first();
  await term.focus();
  await expect(page.locator('#glossary-tip')).toHaveClass(/visible/);
  await scanAt('glossary tooltip open on a focused term');
  await page.keyboard.press('Escape');
  await term.blur();
  await expect(page.locator('#glossary-tip')).not.toHaveClass(/visible/);
  await scanAt('glossary tooltip dismissed');

  // ── The scrolled page: `#back-to-top` and the TOC scroll-spy ────────────
  await page.evaluate(() => window.scrollTo({ top: 3000, behavior: 'instant' as ScrollBehavior }));
  await expect(page.locator('#back-to-top')).toHaveClass(/visible/);
  await expect(page.locator('.toc-link.active')).toHaveCount(1);
  await scanAt('scrolled down, back-to-top shown and the TOC spy active');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }));
  await expect(page.locator('#back-to-top')).not.toHaveClass(/visible/);

  // ── Collapse everything, then expand everything ─────────────────────────
  await page.click('#collapse-all');
  for (const e of EXHIBITS) await expect(page.locator(`#exhibit-body-${e.n}`)).toBeHidden();
  await scanAt('every exhibit collapsed');

  await page.click('#expand-all');
  for (const e of EXHIBITS) await expect(page.locator(`#exhibit-body-${e.n}`)).toBeVisible();
  await scanAt('every exhibit expanded, the whole page populated');
}
