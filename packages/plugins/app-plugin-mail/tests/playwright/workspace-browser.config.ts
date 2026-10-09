import path from 'node:path';
import { defineConfig, type PlaywrightTestConfig } from '@playwright/test';

const repository = path.resolve(import.meta.dirname, '../../../../..');
const fixture = path.resolve(
  import.meta.dirname,
  '../fixtures/workspace-browser',
);
const port = process.env.MAIL_WORKSPACE_BROWSER_PORT ?? '59114';
const externalURL = process.env.MAIL_WORKSPACE_BROWSER_URL;

const config: PlaywrightTestConfig = defineConfig({
  metadata: { isolatedMailWorkspace: true },
  testDir: '.',
  testMatch: 'mail-workspace-responsive.test.ts',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  workers: 1,
  reporter: [
    ['list'],
    [
      'json',
      {
        outputFile: path.join(
          repository,
          '.tmp/mail-issue7-browser/results.json',
        ),
      },
    ],
  ],
  outputDir: path.join(repository, '.tmp/mail-issue7-browser/artifacts'),
  webServer: externalURL
    ? undefined
    : {
        command: `node "${path.join(fixture, 'build.mjs')}" && node "${path.join(fixture, 'server.mjs')}"`,
        url: `http://127.0.0.1:${port}/main/mail`,
        reuseExistingServer: false,
        timeout: 120_000,
      },
  use: {
    baseURL: externalURL ?? `http://127.0.0.1:${port}/main/`,
    headless: true,
    locale: 'en-US',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
    // Screenshots are captured explicitly through bounded CDP, not unbounded runner screenshots.
    screenshot: 'off',
    launchOptions: {
      executablePath: process.env.MAIL_WORKSPACE_BROWSER_EXECUTABLE,
    },
  },
});

export default config;
