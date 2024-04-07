import { devices, defineConfig as playwrightDefineConfig, type PlaywrightTestConfig } from '@playwright/test';

export const defineConfig = (config?: PlaywrightTestConfig) => {
  return playwrightDefineConfig({
    timeout: 5 * 60 * 1000,

    expect: {
      timeout: 10 * 1000,
    },

    // Look for test files in the "tests" directory, relative to this configuration file.
    testDir: 'packages',

    // Match all test files in the e2e and __e2e__ directories.
    testMatch: /(.*\/e2e\/|.*\/__e2e__\/).+\.test\.[tj]sx*$/,

    // Run all tests in parallel.
    fullyParallel: false,

    // Fail the build on CI if you accidentally left test.only in the source code.
    forbidOnly: !!process.env.CI,

    retries: 2,

    // Opt out of parallel tests on CI.
    // workers: process.env.CI ? 1 : undefined,
    workers: 1,

    maxFailures: 0,

    // Reporter to use
    reporter: process.env.PLAYWRIGHT_SKIP_REPORTER
      ? undefined
      : [['html', { outputFolder: './storage/playwright/tests-report' }]],

    outputDir: './storage/playwright/test-results',

    use: {
      // Base URL to use in actions like `await page.goto('/')`.
      baseURL: process.env.APP_BASE_URL || `http://localhost:${process.env.APP_PORT || 20000}`,

      // Collect trace when retrying the failed test.
      trace: 'on-first-retry',
    },
    // Configure projects for major browsers.
    projects: [
      {
        name: 'authSetup',
        testDir: './storage/playwright/tests',
        testMatch: 'auth.setup.ts',
      },
      {
        name: 'chromium',
        use: {
          ...devices['Desktop Chrome'],
          storageState: process.env.PLAYWRIGHT_AUTH_FILE,
          contextOptions: {
            // chromium-specific permissions
            permissions: ['clipboard-read', 'clipboard-write'],
          },
        },
        dependencies: ['authSetup'],
      },
    ],
  });
};
