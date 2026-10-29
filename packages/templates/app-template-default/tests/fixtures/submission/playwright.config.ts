import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '.',
  testMatch: 'browser.test.ts',
  timeout: 120_000,
  workers: 1,
  retries: 0,
  outputDir: process.env.SUBMISSION_EVIDENCE_DIR ?? './evidence',
  reporter: 'list',
  use: { viewport: { width: 1280, height: 900 }, trace: 'off' },
});
