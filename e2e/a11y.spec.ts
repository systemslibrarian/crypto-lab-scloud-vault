import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Strict WCAG regression gate. Scans the full page in both themes with every
 * collapsible exhibit expanded and every live demo driven, so dynamically
 * injected result regions are covered. Asserts zero WCAG 2 A/AA violations.
 */

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function neutralizeAnimations(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `*, *::before, *::after {
      transition: none !important;
      animation: none !important;
    }`,
  });
}

async function revealEverything(page: Page): Promise<void> {
  // Native <details>, if any.
  await page.evaluate(() => {
    for (const d of document.querySelectorAll('details')) d.open = true;
  });
  // Expand every class/style-toggled exhibit via the page control.
  const expandAll = page.locator('#expand-all');
  if (await expandAll.count()) {
    await expandAll.click();
  }
  // Drive every live demo (run/encrypt/keygen/attack buttons) so the async
  // result regions they inject exist before we scan. Best-effort: ignore any
  // that are not clickable.
  const drivers = page.locator(
    'button:has-text("Run"), button:has-text("Generate"), button:has-text("KeyGen"), ' +
      'button:has-text("Encaps"), button:has-text("Decaps"), button:has-text("Encrypt"), ' +
      'button:has-text("Decrypt"), button:has-text("Step"), button:has-text("Next"), ' +
      'button:has-text("Sample"), button:has-text("Compute"), button:has-text("Start"), ' +
      'button:has-text("Tamper"), button:has-text("Detect"), button:has-text("Attack"), ' +
      'button:has-text("Benchmark"), button:has-text("Animate"), button:has-text("Resample")',
  );
  const n = await drivers.count();
  for (let i = 0; i < n; i++) {
    const btn = drivers.nth(i);
    try {
      if (await btn.isVisible() && await btn.isEnabled()) {
        await btn.click({ timeout: 1000 });
      }
    } catch {
      /* best-effort */
    }
  }
  // Let any injected output settle.
  await page.waitForTimeout(300);
}

async function scan(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const summary = results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.map((node) => node.target.join(' ')).slice(0, 5),
  }));
  expect(summary).toEqual([]);
}

test('no WCAG A/AA violations in dark theme', async ({ page }) => {
  await page.goto('.');
  await expect(page.locator('#exhibits')).toBeVisible();
  await neutralizeAnimations(page);
  await revealEverything(page);
  await scan(page);
});

test('no WCAG A/AA violations in light theme', async ({ page }) => {
  await page.goto('.');
  await expect(page.locator('#exhibits')).toBeVisible();
  await page.locator('#cl-theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await neutralizeAnimations(page);
  await revealEverything(page);
  await scan(page);
});
