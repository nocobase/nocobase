import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  globalTeardown: require.resolve('./scripts/teardown.setup.ts'),

  // Look for test files in the "tests" directory, relative to this configuration file.
  testDir: './packages',

  testMatch: /.*\/e2e\/.+\.e2e\.[tj]sx*$/,

  // Run all tests in parallel.
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env.CI,

  // Retry on CI only.
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI.
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [['html', { outputFolder: './playwright/tests-report' }]],

  use: {
    // Base URL to use in actions like `await page.goto('/')`.
    baseURL: 'http://localhost:20000',

    // Collect trace when retrying the failed test.
    trace: 'on-first-retry',
  },
  // Configure projects for major browsers.
  projects: [
    {
      name: 'authSetup',
      testDir: './scripts',
      testMatch: 'auth.setup.ts',
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/admin.json' },
      dependencies: ['authSetup'],
    },
  ],
});
