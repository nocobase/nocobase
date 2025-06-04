/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, oneEmptyForm, oneEmptyTable, test } from '@nocobase/test/e2e';

test.describe('custom request action', () => {
  test('edit button', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyTable).waitForInit();
    await mockRecord('t_unp4scqamw9');
    await nocoPage.goto();

    // 新建一个 custom request action
    await page.getByRole('button', { name: 'Actions', exact: true }).hover();
    await page.getByLabel('designer-schema-initializer-TableV2.Column-TableV2.ActionColumnDesigner-').hover();
    await page.getByRole('menuitem', { name: 'Custom request' }).click();

    // 打开编辑按钮弹窗
    await page.getByLabel('action-CustomRequestAction-').hover();
    await page.getByLabel('designer-schema-settings-CustomRequestAction-actionSettings:customRequest-').hover();
    await page.getByRole('menuitem', { name: 'Edit button' }).click();

    await expect(page.getByText('Button title')).toBeVisible();
    await expect(page.getByText('Button background color')).not.toBeVisible();
  });

  test('edit button in form', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneEmptyForm).goto();

    // 1. 新建一个 custom request action
    await page.getByLabel('schema-initializer-ActionBar-').hover();
    await page.getByRole('menuitem', { name: 'Custom request' }).click();

    // 2. 打开编辑按钮弹窗
    await page.getByLabel('action-CustomRequestAction-').hover();
    await page.getByLabel('designer-schema-settings-CustomRequestAction-actionSettings:customRequest-').hover();
    await page.getByRole('menuitem', { name: 'Edit button' }).click();

    // 3. 应该显示标题输入框、图标输入框、背景颜色输入框
    await expect(page.getByText('Button title')).toBeVisible();
    await expect(page.getByText('Button icon')).toBeVisible();
    await expect(page.getByText('Button background color')).toBeVisible();
  });

  test('custom request buttons should appear immediately after being added to table header', async ({
    page,
    mockPage,
  }) => {
    await mockPage().goto();

    // 1. 添加一个 Table 区块
    await page.getByLabel('schema-initializer-Grid-page:').hover();
    await page.getByRole('menuitem', { name: 'Table right' }).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();

    // 2. 添加三个 custom request 按钮，并应该立即显示出来
    await page.getByLabel('schema-initializer-ActionBar-').hover();
    await page.getByRole('menuitem', { name: 'Custom request' }).click();
    await page.getByLabel('schema-initializer-ActionBar-').hover();
    await page.getByRole('menuitem', { name: 'Custom request' }).click();
    await page.getByLabel('schema-initializer-ActionBar-').hover();
    await page.getByRole('menuitem', { name: 'Custom request' }).click();
    await expect(page.getByLabel('action-CustomRequestAction-')).toHaveCount(3);
  });
});
