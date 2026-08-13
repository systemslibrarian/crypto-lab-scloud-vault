/**
 * Known WCAG 1.4.11 / generated-content findings in this lab, captured through
 * the gate's own path so the baseline and the check cannot disagree.
 *
 * THIS FILE IS A TO-DO LIST, NOT A SET OF EXEMPTIONS. The gate ratchets on it:
 *   - a finding NOT listed here fails the run, so a regression cannot land;
 *   - a listed finding whose ratio gets WORSE fails, so the list cannot rot;
 *   - a listed finding that no longer appears ALSO fails, so a fixed entry must
 *     be deleted and the file can only shrink toward empty.
 * The last rule is what stops an allowlist becoming a permanent exemption.
 *
 * `unverified: true` marks an absolutely-positioned pseudo-element. It can
 * paint outside its host and the oracle measures it against the host's
 * backdrop, so that ratio is NOT trustworthy — hand-measure before acting on
 * it.
 */
export const NONTEXT_BASELINE: Record<
  string,
  { ratio: number; required: number; unverified: boolean }
> = {
  // Everything the live oracle finds over {dark, light} × {1280, 380} and every
  // state the drive builds is exactly these two, and both are in the SHARED
  // Crypto Lab top bar rather than in anything this repo owns.
  //
  // `.cl-btn` draws its edge as
  // `1px solid color-mix(in srgb, var(--accent, #35d6bb) 38%, transparent)`
  // over the bar's fixed `#0b1512`. This lab DOES define `--accent`, so the
  // composite moves with the theme and the two themes disagree: the edge
  // resolves to rgb(45, 71, 79) in dark (`--accent: #58a6ff`) for **2.07:1**,
  // and to rgb(21, 42, 55) in light (`--accent: #0969da`) for **1.49:1** — the
  // light theme is worse, because the bar itself stays dark while the accent
  // darkens with the page. The ratchet is therefore set at the WORSE of the
  // two, so a regression in either theme still fails.
  //
  // Not fixed here on purpose. Every repo in this fleet carries a byte-identical
  // copy of that markup and CSS, and `CLAUDE.md` is explicit that a change every
  // lab should get is a deliberate reviewed fleet-wide pass and never an
  // overwrite driven from one repo. Raising `--accent` to clear 3:1 on the bar
  // is not an option either: the bar reads `--accent`, so moving it to satisfy
  // the bar would move every accent fill, border and link ink on the page
  // underneath it. So it is measured here, ratcheted here, and reported upward.
  //
  // Everything inside `<main>`, the hero and the footer is audited with no
  // exemption, and comes back clean.
  'control-boundary|a.cl-btn': { ratio: 1.49, required: 3, unverified: false },
  'control-boundary|button#cl-theme-toggle.cl-btn.cl-icon': {
    ratio: 1.49,
    required: 3,
    unverified: false,
  },
};
