/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { T4874 } from './templates';

test.describe('variable: current object', () => {
  test('in sub table', async ({ page, mockPage }) => {
    await mockPage(T4874).goto();

    // 在子表格中，使用“当前对象”变量
    await page.getByLabel('action-Action.Link-Edit-').click();
    await page.getByRole('button', { name: 'Role name', exact: true }).hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-roles' })
      .hover();
    await page.getByRole('menuitem', { name: 'Set default value' }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Current object right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Role UID' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.locator('.nb-sub-table-addNew').click();
    await page.getByRole('row', { name: 'table-index-4 block-item-' }).getByRole('textbox').nth(1).fill('123456');
    await expect(page.getByRole('row', { name: 'table-index-4 block-item-' }).getByRole('textbox').first()).toHaveValue(
      '123456',
    );
  });
});
