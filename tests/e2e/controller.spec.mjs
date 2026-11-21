import { test, expect } from '@playwright/test';
import { trackErrors, openFresh, newCareer, startCareerFight, installFakePad, tap, focused, PAD } from '../helpers.mjs';

test.beforeEach(async ({ page }) => { await installFakePad(page); });

test('menu: d-pad + A opens "New career"', async ({ page }) => {
  await openFresh(page);
  await tap(page, PAD.DOWN); // first input selects an item
  await page.evaluate(() => window.__setPF(document.getElementById('mNew')));
  await tap(page, PAD.A);
  await expect(page.locator('#s-new.on')).toBeVisible();
});

test('on-screen keyboard types a name', async ({ page }) => {
  const errors = trackErrors(page);
  await openFresh(page);
  await page.click('#mNew');
  await page.evaluate(() => window.__setPF(document.getElementById('nName')));
  await tap(page, PAD.A);
  await expect(page.locator('#osk.on')).toBeVisible();
  for (const k of ['j', 'a', 'n']) {
    await page.evaluate(c => window.__setPF(document.querySelector(`#osk [data-k="${c}"]`)), k);
    await tap(page, PAD.A);
  }
  await tap(page, PAD.Y);     // space
  await page.evaluate(() => window.__setPF(document.querySelector('#osk [data-k="w"]')));
  await tap(page, PAD.A);
  await tap(page, PAD.B);     // backspace
  await tap(page, PAD.START); // done
  await expect(page.locator('#osk.on')).toHaveCount(0);
  await expect(page.locator('#nName')).toHaveValue('Jan ');
  expect(errors()).toEqual([]);
});

test('slider: A grabs, right moves, B releases', async ({ page }) => {
  await openFresh(page);
  await page.click('#mNew');
  const before = Number(await page.inputValue('#nHt'));
  await page.evaluate(() => window.__setPF(document.getElementById('nHt')));
  await tap(page, PAD.A);
  for (let i = 0; i < 3; i++) await tap(page, PAD.RIGHT);
  await tap(page, PAD.B);
  expect(Number(await page.inputValue('#nHt'))).toBe(before + 3);
  await expect(page.locator('#s-new.on')).toBeVisible(); // B released the slider, did not leave the screen
});

test('rankings: down walks through fighters, A opens a profile, B closes', async ({ page }) => {
  await openFresh(page);
  await newCareer(page);
  await page.click('.tab[data-t=rank]');
  await page.evaluate(() => window.__setPF(document.querySelector('.tab[data-t=rank]')));
  const seen = [];
  for (let i = 0; i < 4; i++) { await tap(page, PAD.DOWN); seen.push(await focused(page)); }
  expect(seen.filter(Boolean).length).toBe(4);
  await tap(page, PAD.A);
  await expect(page.locator('#md.on')).toBeVisible();
  await tap(page, PAD.B);
  await expect(page.locator('#md.on')).toHaveCount(0);
});

test('after a fight the hub is navigable again', async ({ page }) => {
  await openFresh(page);
  await newCareer(page);
  await startCareerFight(page);
  await page.evaluate(() => window.IC.win('KO'));
  const cont = page.locator('#ov.on button', { hasText: /continue/i }).first();
  await expect(cont).toBeVisible({ timeout: 15_000 });
  await page.evaluate(() => window.__setPF([...document.querySelectorAll('#ov.on button')].find(b => /continue/i.test(b.textContent))));
  await tap(page, PAD.A);
  await expect(page.locator('#s-hub.on')).toBeVisible();
  await expect(page.locator('#ov.on')).toHaveCount(0);
  await tap(page, PAD.DOWN);
  const f = await page.evaluate(() => { const e = document.querySelector('.padf'); return e ? e.closest('#s-hub') !== null : false; });
  expect(f).toBe(true);
});
