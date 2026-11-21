// Pulls every inline <script> out of the game and checks it with `node --check`.
// Catches syntax errors before any browser test runs.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const html = readFileSync(new URL('../apps/game/index.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
if (!scripts.length) {
  console.error('No inline <script> found in apps/game/index.html');
  process.exit(1);
}

const dir = mkdtempSync(join(tmpdir(), 'ironcage-syntax-'));
let failed = 0;
scripts.forEach((code, i) => {
  const file = join(dir, `script-${i}.js`);
  writeFileSync(file, code);
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    console.log(`ok   script ${i} (${(code.length / 1024).toFixed(0)} KB)`);
  } catch (err) {
    failed++;
    console.error(`FAIL script ${i}\n${err.stderr?.toString() || err.message}`);
  }
});
process.exit(failed ? 1 : 0);
