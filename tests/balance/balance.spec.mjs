// Nightly balance check: AI-vs-AI duels with equal stat lifts.
// Every duel is played twice with sides swapped, so a side advantage cannot hide in the numbers.
// Run: npm run test:balance   (FIGHTS env var = duels per side and pairing, default 12)
import { test, expect } from '@playwright/test';
import { openFresh, newCareer } from '../helpers.mjs';

const FIGHTS = Number(process.env.FIGHTS || 12);
const REFS = ['Boxer', 'Kickboxer', 'Pressure'];       // reference opponents every class must hold up against
const CLASS_RANGE = [0.2, 0.8];                       // overall win rate per class (small samples are noisy)
const PAIR_RANGE = [0.05, 0.95];                      // no single matchup may be (almost) unwinnable
const MIRROR_RANGE = [0.3, 0.7];                      // left side in a mirror match (side bias check)

async function duels(page, a, b, n) {
  return page.evaluate(({ a, b, n }) => {
    window.IC.auto = true;
    let w = 0, dec = 0, total = 0;
    for (let i = 0; i < n; i++) {
      if (window.IC.duel(a, b) === 0) w++;
      if (window.IC.last && window.IC.last.method === 'Decision') dec++;
      if (window.IC.duel(b, a) === 1) w++;
      if (window.IC.last && window.IC.last.method === 'Decision') dec++;
      total += 2;
    }
    return { w, total, dec };
  }, { a, b, n });
}

test.beforeEach(async ({ page }) => {
  await openFresh(page);
  await newCareer(page, 'Balance Bot');
});

test('no side advantage in a mirror match', async ({ page }) => {
  const r = await page.evaluate(n => {
    window.IC.auto = true;
    let left = 0, total = 0;
    for (let i = 0; i < n * 2; i++) { const x = window.IC.duel('Boxer', 'Boxer'); if (x === 0) left++; if (x !== null) total++; }
    return { left, total };
  }, FIGHTS);
  const share = r.left / r.total;
  test.info().annotations.push({ type: 'mirror', description: `left side won ${(share * 100).toFixed(0)}% (${r.left}/${r.total})` });
  expect(share).toBeGreaterThanOrEqual(MIRROR_RANGE[0]);
  expect(share).toBeLessThanOrEqual(MIRROR_RANGE[1]);
});

const CLASSES = ['Boxer', 'Kickboxer', 'Brawler', 'MuayThai', 'Counter', 'Pressure', 'Knockout', 'Karateka', 'Grappler', 'Shell'];

for (const cls of CLASSES) {
  test(`class ${cls} stays within the balance window`, async ({ page }) => {
    const known = await page.evaluate(() => Object.keys(window.IC.styles()));
    test.skip(!known.includes(cls), `${cls} is not a class in this build`);
    let w = 0, total = 0, dec = 0;
    const rows = [];
    for (const ref of REFS.filter(r => r !== cls)) {
      const r = await duels(page, cls, ref, FIGHTS);
      w += r.w; total += r.total; dec += r.dec;
      const rate = r.w / r.total;
      rows.push(`${ref}: ${(rate * 100).toFixed(0)}%`);
      expect.soft(rate, `${cls} vs ${ref}`).toBeGreaterThanOrEqual(PAIR_RANGE[0]);
      expect.soft(rate, `${cls} vs ${ref}`).toBeLessThanOrEqual(PAIR_RANGE[1]);
    }
    const rate = w / total;
    test.info().annotations.push({ type: 'balance', description: `${cls}: ${(rate * 100).toFixed(0)}% overall · ${rows.join(' · ')} · decisions ${(dec / total * 100).toFixed(0)}%` });
    expect(rate, `${cls} overall win rate`).toBeGreaterThanOrEqual(CLASS_RANGE[0]);
    expect(rate, `${cls} overall win rate`).toBeLessThanOrEqual(CLASS_RANGE[1]);
  });
}
