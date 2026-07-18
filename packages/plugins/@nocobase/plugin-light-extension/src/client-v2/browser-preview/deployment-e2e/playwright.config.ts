/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'node:path';

import { defineConfig, devices } from '@playwright/test';

const currentDir = __dirname;
const serveScript = path.join(currentDir, 'serve.mjs');

export default defineConfig({
  testDir: currentDir,
  testMatch: 'browser-preview-deployment.spec.ts',
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'line' : 'list',
  use: {
    ...devices['Desktop Chrome'],
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: `BROWSER_PREVIEW_E2E_BASE=/ BROWSER_PREVIEW_E2E_PORT=43110 node ${JSON.stringify(serveScript)}`,
      url: 'http://127.0.0.1:43110/',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command: `BROWSER_PREVIEW_E2E_BASE=/nocobase/ BROWSER_PREVIEW_E2E_PORT=43111 node ${JSON.stringify(serveScript)}`,
      url: 'http://127.0.0.1:43111/nocobase/',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
