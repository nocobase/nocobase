/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { APIToken, tableViewLinkageRulesVariables } from './templates';

test.describe('variables', () => {
  test('linkage rules of table view action', async ({ page, mockPage }) => {
    await mockPage(tableViewLinkageRulesVariables).goto();

    // 1. 打开联动规则设置弹窗，并显示变量列表
    await page.getByLabel('action-Action.Link-View-view-').hover();
    await page.getByLabel('designer-schema-settings-Action.Link-actionSettings:view-users').hover();
    await page.getByRole('menuitem', { name: 'Linkage rules' }).click();
    await page.getByLabel('variable-button').click();

    // 2. 断言应该显示的变量
    ['Constant', 'Current user', 'Current role', 'API token', 'Date variables', 'Current record'].forEach(
      async (name) => {
        await expect(page.getByRole('menuitemcheckbox', { name })).toBeVisible();
      },
    );
  });

  test('API token', async ({ page, mockPage }) => {
    await mockPage(APIToken).goto();

    const token = await page.evaluate(() => {
      return window.localStorage.getItem('NOCOBASE_TOKEN');
    });

    await page.getByLabel('block-item-CollectionField-').hover();
    await page.getByLabel('designer-schema-settings-CollectionField-fieldSettings:FormItem-users-users.').hover();
    await page.getByRole('menuitem', { name: 'Set default value' }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'API token' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByRole('textbox')).toHaveValue(token);
  });
});
