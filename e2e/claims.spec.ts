import { expect, test } from '@playwright/test';

test('review evidence is presented as sourced facts, not invented percentage meters', async ({ page }) => {
  await page.goto('.');
  await page.locator('#expand-all').click();

  const transparency = page.locator('#exhibit-11');
  await expect(transparency.locator('.scrutiny-fact')).toHaveCount(6);
  await expect(transparency.locator('.scrutiny-meter, .meter-track, .meter-fill')).toHaveCount(0);
  await expect(transparency).toContainText('NIST PQC: 2016–2024');
  await expect(transparency).toContainText('published in 2024');
});

test('key generation identifies the live KEM as full matrix LWE', async ({ page }) => {
  await page.goto('.');
  await page.locator('#expand-all').click();
  await page.locator('#keygen-run').click();

  const output = page.locator('#keygen-output');
  await expect(output).toContainText('600×32', { timeout: 30_000 });
  await expect(output).toContainText('matrix LWE—not a single-vector construction');
  await expect(output).not.toContainText('single-vector simplification');
});
