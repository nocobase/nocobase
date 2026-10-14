import { defineConfig, devices } from '@playwright/test';

/**
 * Browser tests against a throwaway Studio: global setup starts the built server (`pnpm build` first) on a free port
 * with a fresh SQLite database and the demo data, and global teardown stops it (`e2e/support/server.ts`). Set
 * `NB_STUDIO_E2E_URL` to run against a server that is already running instead; the tests change its data.
 *
 *   pnpm test:e2e           # the flows, in e2e/*.test.ts
 *   pnpm test:screenshots   # key pages in zh-CN and en-US, light and dark, into output/screenshots/
 *
 * See docs/e2e.md.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.test.ts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // Each test makes its own data, so files run side by side against the one server.
  workers: process.env.CI ? 2 : 3,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 900 },
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'e2e',
      testIgnore: 'screenshots/**',
    },
    {
      // The phone flows in WebKit as an iPhone 13; CI runs the same file in the `e2e` project at iPhone 13 size.
      name: 'phone-webkit',
      testMatch: ['phone.test.ts', 'owner-handoff.test.ts'],
      use: { ...devices['iPhone 13'] },
    },
    {
      // My follow-ups' desktop columns in Safari's engine.
      name: 'desktop-webkit',
      testMatch: 'follow-ups-columns.test.ts',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'screenshots',
      testMatch: 'screenshots/**/*.test.ts',
      // One test per language and colour scheme, each visiting every page in turn.
      timeout: 300_000,
    },
  ],
});
