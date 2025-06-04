/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { T3867 } from './templatesOfBug';

test.describe('data scope of component Select', () => {
  test('should immediate effect when the data scope changes', async ({ page, mockPage }) => {
    await mockPage(T3867).goto();

    // 1. 初始状态应该包含两个选项
    await page.getByTestId('select-object-multiple').click();
    await expect(page.getByRole('option', { name: 'admin' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'member' })).toBeVisible();

    // 2. 设置下数据范围
    await page.getByTestId('select-object-multiple').hover();
    await page.getByLabel('designer-schema-settings-CollectionField-fieldSettings:FormItem-users-users.').hover();
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByRole('menuitemcheckbox', { name: 'Role UID' }).click();
    await page.getByTestId('select-filter-operator').click();
    await page.getByRole('option', { name: 'is empty' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 3. 设置了上面的数据范围之后，应该没有选项了
    await page.getByTestId('select-object-multiple').click();
    await expect(page.getByRole('option', { name: 'admin' })).toBeHidden();
    await expect(page.getByRole('option', { name: 'member' })).toBeHidden();
    await expect(page.getByText('No data').last()).toBeVisible();
  });
});
