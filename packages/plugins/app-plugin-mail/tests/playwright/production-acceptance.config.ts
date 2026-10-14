import path from 'node:path';
import { defineConfig, type PlaywrightTestConfig } from '@playwright/test';
const repository = path.resolve(import.meta.dirname, '../../../../..');
const fixture = path.resolve(
  import.meta.dirname,
  '../fixtures/production-acceptance',
);
const port = process.env.MAIL_PRODUCTION_ACCEPTANCE_PORT ?? '59118';
const config: PlaywrightTestConfig = defineConfig({
  metadata: { isolatedMailProductionAcceptance: true },
  testDir: '.',
  testMatch: 'mail-production-acceptance.test.ts',
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [
    ['list'],
    [
      'json',
      {
        outputFile: path.join(
          repository,
          '.tmp/mail-issue8-production/results.json',
        ),
      },
    ],
  ],
  outputDir: path.join(repository, '.tmp/mail-issue8-production/artifacts'),
  webServer: {
    command: `node "${path.join(fixture, 'build.mjs')}" && node --import tsx "${path.join(fixture, 'server.mjs')}"`,
    url: `http://127.0.0.1:${port}/main/mail/accounts`,
    timeout: 120_000,
    reuseExistingServer: false,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 15_000 },
  },
  use: {
    baseURL: `http://127.0.0.1:${port}/main/`,
    locale: 'en-US',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    screenshot: 'off',
    trace: 'retain-on-failure',
    launchOptions: {
      executablePath: process.env.MAIL_PRODUCTION_ACCEPTANCE_EXECUTABLE,
    },
  },
});
export default config;
