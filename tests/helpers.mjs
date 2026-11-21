import { expect } from '@playwright/test';

/** Collects uncaught page errors and console errors; call errors() at the end of a test. */
export function trackErrors(page) {
  const list = [];
  page.on('pageerror', e => list.push(`pageerror: ${e.message}`));
  page.on('console', m => {
    if (m.type() !== 'error') return;
    const where = (m.location() && m.location().url) || '';
    // Ignore the browser's automatic favicon request and web fonts (no network in some CI setups).
    if (/favicon|fonts\.(googleapis|gstatic)\.com/.test(where + m.text())) return;
    list.push(`console: ${m.text()}${where ? ` (${where})` : ''}`);
  });
  return () => list;
}

/** Opens the game with an empty save (and optionally a chosen hub layout). */
export async function openFresh(page, { layout } = {}) {
  await page.goto('/');
  await page.evaluate(l => { localStorage.clear(); if (l) localStorage.setItem('ic_hublay', l); }, layout || null);
  await page.reload();
  await expect(page.locator('#s-menu.on')).toBeVisible();
}

/** Creates a new career from the main menu and waits for the hub. */
export async function newCareer(page, name = 'Test Fighter') {
  await page.click('#mNew');
  await page.fill('#nName', name);
  await page.click('#nGo');
  await expect(page.locator('#s-hub.on')).toBeVisible();
}

/** Accepts the highlighted fight offer and walks out until the fight screen is on. */
export async function startCareerFight(page) {
  await page.locator('#tabBox [data-o]').first().click();
  await expect(page.locator('#s-tot.on')).toBeVisible();
  await page.click('#totG');
  const camp = page.locator('#md.on [data-c]').first();
  if (await camp.isVisible().catch(() => false)) await camp.click();
  await expect(page.locator('#s-fight.on')).toBeVisible();
}

/** Installs a fake gamepad before the page loads. Use pad(page).tap(0) etc. */
export async function installFakePad(page) {
  await page.addInitScript(() => {
    window.__pad = {
      index: 0, id: 'Xbox Wireless Controller (test)', connected: true,
      axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
    };
    navigator.getGamepads = () => [window.__pad];
    window.__btn = (k, v) => { window.__pad.buttons[k] = { pressed: v, value: v ? 1 : 0 }; };
  });
}

export const PAD = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, VIEW: 8, START: 9, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };

export async function tap(page, button, holdMs = 60) {
  await page.evaluate(k => window.__btn(k, true), button);
  await page.waitForTimeout(holdMs);
  await page.evaluate(k => window.__btn(k, false), button);
  await page.waitForTimeout(140);
}

/** id (or data-* marker) of the element the controller cursor is on. */
export const focused = page => page.evaluate(() => {
  const e = document.querySelector('.padf');
  return e ? (e.id || e.dataset.fp || e.dataset.k || e.dataset.hl || e.textContent.trim().slice(0, 20)) : null;
});
