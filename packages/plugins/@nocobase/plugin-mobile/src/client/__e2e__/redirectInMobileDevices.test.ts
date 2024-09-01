/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { devices, expect, test } from '@nocobase/test/e2e';

test.use({
  ...devices['Galaxy S9+'],
});

test.describe('mobile devices: redirect to other page', () => {
  test('redirect to signin page', async ({ page }) => {
    const baseURL = process.env.APP_BASE_URL || `http://localhost:${process.env.APP_PORT || 20000}`;

    await page.goto('/m/signin');
    await page.waitForURL(`${baseURL}/signin`);
    expect(page.url()).toBe(`${baseURL}/signin`);

    // do not redirect to mobile page
    await page.waitForTimeout(5000);
    expect(page.url()).toBe(`${baseURL}/signin`);
  });

  test('redirect to admin page', async ({ page }) => {
    const baseURL = process.env.APP_BASE_URL || `http://localhost:${process.env.APP_PORT || 20000}`;

    await page.goto('/m/admin/settings/@nocobase/plugin-api-keys');
    await page.waitForURL(`${baseURL}/admin/settings/@nocobase/plugin-api-keys`);
    expect(page.url()).toBe(`${baseURL}/admin/settings/@nocobase/plugin-api-keys`);

    // do not redirect to mobile page
    await page.waitForTimeout(5000);
    expect(page.url()).toBe(`${baseURL}/admin/settings/@nocobase/plugin-api-keys`);
  });
});
