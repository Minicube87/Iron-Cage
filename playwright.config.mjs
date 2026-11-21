import { defineConfig } from '@playwright/test';

const PORT = 4173;
// Local runs can point at an installed Chrome (CHROME_PATH); CI uses Playwright's own Chromium.
const launchOptions = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {};

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : 2,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    launchOptions,
    viewport: { width: 844, height: 390 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `python3 -m http.server ${PORT} --directory apps/game`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'e2e', testDir: 'tests/e2e', timeout: 60_000 },
    { name: 'balance', testDir: 'tests/balance', timeout: 15 * 60_000 },
  ],
});
