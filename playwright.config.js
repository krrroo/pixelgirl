// Playwright: browser tests — opens the real pages in Chromium (desktop and
// iPhone-sized) and clicks through them like a visitor would.
import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    launchOptions: {
      args: ['--autoplay-policy=no-user-gesture-required'],
      // optional: use an already-installed Chromium instead of Playwright's download
      executablePath: process.env.PW_CHROMIUM_PATH || undefined,
    },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, grepInvert: /@mobile/ },
    {
      name: 'mobile',
      // iPhone viewport + touch, run in Chromium (WebKit isn't needed for these checks)
      use: { ...devices['iPhone 13'], browserName: 'chromium', defaultBrowserType: 'chromium' },
      grep: /@mobile/,
    },
  ],
  webServer: {
    command: 'node tests/e2e/serve.mjs',
    url: `http://localhost:${PORT}/index.html`,
    reuseExistingServer: !process.env.CI,
  },
});
