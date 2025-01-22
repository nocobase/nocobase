/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';

test.describe('auth', () => {
  // 重置登录状态
  test.use({
    storageState: {
      cookies: [],
      origins: [],
    },
  });

  test('register', async ({ page }) => {
    // Generate a random username
    const username = `zidonghuaceshi${Math.random().toString(36).substring(2, 15)}`;

    await page.goto('/');
    await page.getByRole('link', { name: 'Create an account' }).click();
    await page.getByLabel('block-item-Input-Username').getByRole('textbox').fill(username);
    await page.getByLabel('block-item-Password-Password').getByRole('textbox').fill('zidonghuaceshi123');
    await page.getByLabel('block-item-Password-Confirm').getByRole('textbox').fill('zidonghuaceshi123');
    await page.getByRole('button', { name: 'Sign up' }).click();

    await expect(page.getByText('Sign up successfully, and automatically jump to the sign in page')).toBeVisible();

    // Sign in with the new account
    await page.getByPlaceholder('Username/Email').click();
    await page.getByPlaceholder('Username/Email').fill(username);
    await page.getByPlaceholder('Password').click();
    await page.getByPlaceholder('Password').fill('zidonghuaceshi123');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await page.getByTestId('user-center-button').hover();
    await expect(page.getByText(username)).toBeVisible();
  });
});
