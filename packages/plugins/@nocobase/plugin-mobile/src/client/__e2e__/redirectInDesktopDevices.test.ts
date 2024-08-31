/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { uid } from '@nocobase/utils';

test.describe('desktop devices: redirect to other page', () => {
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

  test('different roles', async ({ page }) => {
    await page.goto('/m');

    // 1. the root role has the permission to configure UI --------------------------
    await expect(page.getByTestId('ui-editor-button')).toBeVisible();

    const pageTitle = uid();

    // should be able to create an empty page successfully
    await page.getByTestId('schema-initializer-MobileTabBar').hover();
    await page.getByRole('menuitem', { name: 'Page' }).click();
    await page.getByLabel('block-item-Input-Title').getByRole('textbox').fill(pageTitle);
    await page.getByRole('button', { name: 'Select icon' }).click();
    await page.getByRole('tooltip').getByLabel('account-book').locator('svg').click();
    await page.getByLabel('action-Action-Submit').click();

    // the bottom tab bar should be visible
    await expect(page.getByLabel('block-item-MobileTabBar.Page').filter({ hasText: pageTitle })).toBeVisible();

    // the "Add blocks" button should be visible
    await expect(page.getByLabel('schema-initializer-Grid-')).toBeVisible();

    // delete the page
    await page.getByLabel('block-item-MobileTabBar.Page').filter({ hasText: pageTitle }).hover();
    await page.getByRole('button', { name: 'designer-schema-settings-' }).hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 2. the member role has no permission to configure UI --------------------------
    await page.evaluate(() => {
      localStorage.setItem('NOCOBASE_ROLE', 'member');
    });
    await page.reload();
    await expect(page.getByTestId('ui-editor-button')).not.toBeVisible();

    // but the "Add blocks" button should not be visible
    await expect(page.getByTestId('schema-initializer-MobileTabBar')).not.toBeVisible();

    // reset role
    await page.evaluate(() => {
      localStorage.setItem('NOCOBASE_ROLE', 'root');
    });
  });
});
