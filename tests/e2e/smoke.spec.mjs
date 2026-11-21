import { test, expect } from '@playwright/test';
import { trackErrors, openFresh, newCareer, startCareerFight } from '../helpers.mjs';

test('main menu loads without errors', async ({ page }) => {
  const errors = trackErrors(page);
  await openFresh(page);
  await expect(page).toHaveTitle(/Iron Cage/);
  await expect(page.locator('#mList .mitem')).toHaveCount(4); // New career, Local versus, Guide, Settings
  expect(errors()).toEqual([]);
});

test('career: offer → tale of the tape → fight → result → hub', async ({ page }) => {
  const errors = trackErrors(page);
  await openFresh(page);
  await newCareer(page);
  await startCareerFight(page);
  await page.evaluate(() => window.IC.win('KO'));
  const cont = page.locator('#ov.on button', { hasText: /continue/i }).first();
  await expect(cont).toBeVisible({ timeout: 15_000 });
  await cont.click();
  await expect(page.locator('#s-hub.on')).toBeVisible();
  expect(await page.evaluate(() => window.IC.save.me.rec)).toEqual([1, 0]);
  expect(await page.evaluate(() => (window.IC.save.flog || []).length)).toBe(1); // fight log written
  expect(errors()).toEqual([]);
});

test('every hub tab renders', async ({ page }) => {
  const errors = trackErrors(page);
  await openFresh(page);
  await newCareer(page);
  for (const tab of ['rank', 'train', 'cal', 'news', 'guide', 'saves', 'fight']) {
    await page.click(`.tab[data-t=${tab}]`);
    await expect(page.locator(`.tab[data-t=${tab}].on`)).toBeVisible();
    expect((await page.locator('#tabBox').innerText()).trim().length).toBeGreaterThan(10);
  }
  expect(errors()).toEqual([]);
});

for (const layout of ['poster', 'console', 'classic']) {
  test(`hub layout "${layout}" renders the fight offer`, async ({ page }) => {
    const errors = trackErrors(page);
    await openFresh(page, { layout });
    await newCareer(page);
    await expect(page.locator('body')).toHaveClass(new RegExp(`hub-${layout}`));
    await expect(page.locator('#tabBox [data-o]').first()).toBeVisible();
    expect(errors()).toEqual([]);
  });
}

test('rankings: tapping a fighter opens the profile', async ({ page }) => {
  await openFresh(page);
  await newCareer(page);
  await page.click('.tab[data-t=rank]');
  await page.locator('.rk[data-fp]:not(.me)').first().click();
  await expect(page.locator('#md.on')).toBeVisible();
});

test('simulating 20 weeks keeps the world consistent', async ({ page }) => {
  const errors = trackErrors(page);
  await openFresh(page);
  await newCareer(page);
  const w0 = await page.evaluate(() => window.IC.save.week);
  await page.evaluate(() => window.IC.week(20));
  const s = await page.evaluate(() => {
    const sv = window.IC.save;
    const nicks = sv.fighters.map(f => f.nick);
    return { week: sv.week, roster: sv.fighters.length, order: sv.order.length, dupNicks: nicks.filter((n, i) => nicks.indexOf(n) !== i) };
  });
  expect(s.week).toBe(w0 + 20);
  expect(s.roster).toBeGreaterThanOrEqual(30);
  expect(s.order).toBe(s.roster + 1); // all fighters + you
  expect(s.dupNicks).toEqual([]);
  expect(errors()).toEqual([]);
});

test('guide and settings open from the main menu', async ({ page }) => {
  const errors = trackErrors(page);
  await openFresh(page);
  await page.click('#mGuide');
  await expect(page.locator('#s-guide.on')).toBeVisible();
  await page.goBack().catch(() => {});
  await openFresh(page);
  await page.click('#mSet');
  await expect(page.locator('#s-set.on')).toBeVisible();
  await expect(page.locator('#hlsSet [data-hl]')).toHaveCount(3);
  expect(errors()).toEqual([]);
});

test('local versus works without a career (legends) and saves nothing', async ({ page }) => {
  const errors = trackErrors(page);
  await openFresh(page);
  await page.click('#mVs');
  await expect(page.locator('#md.on .vsn').first()).toBeVisible();
  await page.click('#vCpu');
  await page.click('#vGo');
  await expect(page.locator('#s-fight.on')).toBeVisible();
  await page.evaluate(() => window.IC.win('KO'));
  await expect(page.locator('#vAgain')).toBeVisible({ timeout: 15_000 });
  await page.click('#bBack');
  await expect(page.locator('#s-menu.on')).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage).filter(k => k !== 'ic_hublay'))).toEqual([]);
  expect(errors()).toEqual([]);
});
