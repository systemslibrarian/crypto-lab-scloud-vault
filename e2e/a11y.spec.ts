import { expect, test } from '@playwright/test';
import {
  boot,
  driveAllStates,
  expectBaselineNotStale,
  NARROW,
  reportCollected,
  watchPageErrors,
} from './gate';

/**
 * WCAG A/AA regression gate for the Scloud+ Explorer.
 *
 * The lab is driven along everything it teaches: the arrival state, where ten
 * exhibits are open, two are collapsed AND UNRENDERED, and three have already
 * generated output on mount; the shared skip link focused; both collapsed
 * exhibits opened through their own `role="button"` headers so the lazy render
 * runs the way it runs for a reader; the LWE core resampled; the ternary
 * sampler on both its instant and its animated route, including the state where
 * the animation holds both buttons disabled; BW₃₂ encoded at its maximum 5-bit
 * message and then driven OUT of its 0–31 range, and decoded at both ends of
 * the noise slider — zero, where every trial decodes, and 1400, where none do
 * and the failure ink is painted; KeyGen and Encaps/Decaps at both parameter
 * sets, then the tamper button, which is the only route to the FO transform's
 * reject branch and its dimmed twin; the comparison exhibit redrawn; the live
 * benchmark measured in the browser; every step of the guided walkthrough
 * including both ends where a nav button is inactive, and its Reset; the
 * glossary tooltip opened by KEYBOARD FOCUS and dismissed; the scrolled page,
 * where `#back-to-top` and the TOC scroll-spy appear; and Collapse-all followed
 * by Expand-all. Every one of those states is scanned, in both themes, at
 * desktop and phone width.
 *
 * See `gate.ts` for why nothing is injected into the page, why no panel is
 * force-revealed, why the lab's defaults are asserted rather than assumed, and
 * why `violations` is not the whole oracle.
 */

for (const theme of ['dark', 'light'] as const) {
  test(`no WCAG A/AA violations in ${theme} theme`, async ({ page }) => {
    test.setTimeout(1_800_000);
    const errors = watchPageErrors(page);
    await boot(page, theme);
    await driveAllStates(page, theme);
    expect(errors, errors.join('\n')).toEqual([]);
    expectBaselineNotStale();
    reportCollected();
  });

  test(`no WCAG A/AA violations in ${theme} theme at 380px`, async ({ page }) => {
    test.setTimeout(1_800_000);
    const errors = watchPageErrors(page);
    await page.setViewportSize(NARROW);
    await boot(page, theme);
    await driveAllStates(page, `${theme} @380px`);
    expect(errors, errors.join('\n')).toEqual([]);
    expectBaselineNotStale();
    reportCollected();
  });
}
