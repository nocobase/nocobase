/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { APIToken, tableSelectedRecords, tableViewLinkageRulesVariables } from './templates';

test.describe('variables', () => {
  test('linkage rules of table view action', async ({ page, mockPage }) => {
    await mockPage(tableViewLinkageRulesVariables).goto();

    // 1. 打开联动规则设置弹窗，并显示变量列表
    await page.getByLabel('action-Action.Link-View-view-').hover();
    await page.getByLabel('designer-schema-settings-Action.Link-actionSettings:view-users').hover();
    await page.getByRole('menuitem', { name: 'Linkage rules' }).click();
    await page.getByTestId('left-filter-field').getByLabel('variable-button').click();

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

  test('Table selected records', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(tableSelectedRecords).waitForInit();
    const record = await mockRecord('testTableSelectedRecords');
    await nocoPage.goto();

    // 1. First select a row, then click Add new
    await page.getByLabel('table-index-1', { exact: true }).click();
    await page.getByLabel('action-Action-Add new-create-').click();

    // 2. Set default value for the field, field content should be the associated records of the previously selected record
    await page.getByLabel('block-item-CollectionField-').hover();
    await page.getByLabel('designer-schema-settings-CollectionField-fieldSettings:FormItem-').hover();
    await page.getByRole('menuitem', { name: 'Set default value' }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Table selected records right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'm2m' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByLabel('block-item-CollectionField-')).toContainText(
      `m2m:${record.m2m.map((r) => r.id).join('')}`,
    );

    // 3. Deselect the row, click Add new again, field content should be empty
    await page.getByLabel('drawer-Action.Container-testTableSelectedRecords-Add record-mask').click();
    await page.getByLabel('table-index-1', { exact: true }).click();
    await page.getByLabel('action-Action-Add new-create-').click();
    await expect(page.getByLabel('block-item-CollectionField-')).toHaveText('m2m:');
  });
});
