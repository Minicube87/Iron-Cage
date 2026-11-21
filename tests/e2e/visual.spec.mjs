// Screenshots of the key screens in three sizes, attached to the report for a quick visual check,
// plus a render-time budget so performance regressions fail the build.
import { test, expect } from '@playwright/test';
import { openFresh, newCareer, startCareerFight } from '../helpers.mjs';

const SIZES = [
  { name: 'phone-landscape', width: 844, height: 390 },
  { name: 'phone-portrait', width: 390, height: 844 },
  { name: 'laptop', width: 1440, height: 900 },
];

for (const size of SIZES) {
  test(`screenshots – ${size.name}`, async ({ page }, info) => {
    await page.setViewportSize({ width: size.width, height: size.height });
    await openFresh(page);
    const shot = async label => info.attach(`${size.name}-${label}`, { body: await page.screenshot(), contentType: 'image/png' });
    await shot('1-menu');
    await newCareer(page);
    await shot('2-hub');
    await page.locator('#tabBox [data-o]').first().click();
    await expect(page.locator('#s-tot.on')).toBeVisible();
    await shot('3-tale-of-the-tape');
    await page.click('#totG');
    const camp = page.locator('#md.on [data-c]').first();
    if (await camp.isVisible().catch(() => false)) await camp.click();
    await page.waitForTimeout(2500);
    await shot('4-fight');
  });
}

test('render budget: one fight frame stays under the limit', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await openFresh(page);
  await newCareer(page);
  await startCareerFight(page);
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => window.IC.bench(20));
  test.info().annotations.push({ type: 'render', description: `${r.ms} ms/frame at ${r.canvas.join('×')}` });
  // CI runners render on the CPU, so the budget is generous; a real GPU is ~5–10× faster.
  expect(r.ms).toBeLessThan(150);
});
