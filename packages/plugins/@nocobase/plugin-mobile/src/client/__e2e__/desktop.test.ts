/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';

test.describe('desktop-mode', () => {
  test.beforeAll(async ({ page }) => {
    await page.goto('/m');
  });

  test('desktop should have back link to admin', async ({ page }) => {
    await page.getByRole('link', { name: 'Back' }).click();
    // 跳转到 /admin
    expect(page.url()).toContain('/admin');

    await page.goto('/m');
  });

  test('ui editor should work', async ({ page }) => {
    // 默认 designer 开启
    await expect(page.getByTestId('schema-initializer-MobileTabBar')).toBeVisible();

    // 再次点击应该隐藏
    await page.getByTestId('ui-editor-button').click();
    await expect(page.getByTestId('schema-initializer-MobileTabBar')).not.toBeVisible();

    await page.getByTestId('ui-editor-button').click();
    await expect(page.getByTestId('schema-initializer-MobileTabBar')).toBeVisible();
  });

  test('change mobile size', async ({ page }) => {
    await page.getByTestId('desktop-mode-size-pad').click();
    await expect(page.getByTestId('desktop-mode-resizable')).toHaveCSS('width', '768px');
    await expect(page.getByTestId('desktop-mode-resizable')).toHaveCSS('height', '667px');

    await page.getByTestId('desktop-mode-size-mobile').click();
    await expect(page.getByTestId('desktop-mode-resizable')).toHaveCSS('width', '375px');
    await expect(page.getByTestId('desktop-mode-resizable')).toHaveCSS('height', '667px');
  });

  test('show qrcode', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'qrcode' })).toBeVisible();
    await page.getByRole('button', { name: 'qrcode' }).click();
    await expect(page.getByRole('tooltip')).toBeVisible();
  });
});
