/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { shouldImmediatelyShowDrawerWhenClickingEnableLinkForTheFirstTime } from './templates';

test.describe('enableLink', () => {
  test('should immediately show drawer when clicking "Enable link" for the first time', async ({ page, mockPage }) => {
    await mockPage(shouldImmediatelyShowDrawerWhenClickingEnableLinkForTheFirstTime).goto();

    // 1. 开启 Enable link
    await page.getByRole('button', { name: 'Nickname' }).hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-users' })
      .hover();
    await page.getByRole('menuitem', { name: 'Enable link' }).click();

    // 2. 点击 Super Admin 之后，应该立即显示弹窗
    await page.getByRole('button', { name: 'Super Admin' }).locator('a').click();
    await expect(page.getByTestId('drawer-Action.Container-users-View record')).toBeVisible();

    // 3. 点击蒙层，应该立即关闭弹窗
    await page.getByLabel('drawer-Action.Container-users-View record-mask').click();
    await expect(page.getByTestId('drawer-Action.Container-users-View record')).not.toBeVisible();
  });
});
