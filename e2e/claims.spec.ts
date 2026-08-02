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

test('the batch verdict describes where the measured rate actually sits', async ({ page }) => {
  await page.goto('.');
  await page.locator('#expand-all').click();

  const slider = page.locator('#bw32-noise-slider');
  const output = page.locator('#bw32-batch-output');
  const min = Number(await slider.getAttribute('min'));
  const max = Number(await slider.getAttribute('max'));

  // Sweep the noise range and check every rendered verdict against its own
  // printed success rate — a "near the boundary" claim under a lopsided rate
  // is the defect this pins.
  for (const value of [min, Math.round((min + max) / 2), max]) {
    await slider.fill(String(value));
    await page.locator('#bw32-batch-btn').click();
    const text = (await output.textContent()) ?? '';
    const m = text.match(/(\d+)\/(\d+)/);
    expect(m, `no success rate rendered at noise ${value}`).not.toBeNull();
    const ratio = Number(m![1]) / Number(m![2]);

    if (/Near the boundary/.test(text)) {
      expect(ratio, `claimed "near the boundary" at ${m![0]}`).toBeGreaterThanOrEqual(0.2);
      expect(ratio, `claimed "near the boundary" at ${m![0]}`).toBeLessThan(0.8);
    }
    if (/All decoded correctly/.test(text)) expect(ratio).toBe(1);
    if (/All failed/.test(text)) expect(ratio).toBe(0);
    if (/Mostly failed/.test(text)) expect(ratio).toBeLessThan(0.2);
  }
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
