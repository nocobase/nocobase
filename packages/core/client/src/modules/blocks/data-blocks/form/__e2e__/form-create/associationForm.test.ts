/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { deleteRecords, expect, test } from '@nocobase/test/e2e';
import { T3529, T3953, T3979 } from './templatesOfBug';

test.describe('association form block', () => {
  // https://nocobase.height.app/T-3529
  test('should be created instead of updated', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(T3529).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await page.getByLabel('action-Action.Link-View-view-general-table-0').click();
    void page.getByLabel('action-Action-Submit-submit-').click();

    const request = await page.waitForRequest((request) => {
      return request.url().includes('m2mField0:create');
    });

    // 应该有包含 :create 的请求
    expect(request).toBeTruthy();
  });

  // https://nocobase.height.app/T-3953/description
  test('form (Add new)', async ({ page, mockPage }) => {
    await mockPage(T3953).goto();

    // 1. 打开弹窗，填写表单
    await page.getByLabel('action-Action.Link-View-view-').click();
    await page.getByLabel('block-item-CollectionField-').getByRole('textbox').fill('1234');
    await page.getByLabel('action-Action-Submit-submit-').click();

    // 2. 提交后，Table 会显示新增的数据
    await expect(page.getByLabel('block-item-CardItem-users-').getByText('1234')).toBeVisible();

    // 3. 将创建的 roles record 删除，防止影响其他测试
    await deleteRecords('roles', { name: { $ne: ['root', 'admin', 'member'] } });
  });

  // https://nocobase.height.app/T-3979/description
  test('association table block add new ', async ({ page, mockPage, mockRecord }) => {
    await mockPage(T3979).goto();
    await mockRecord('general');
    await expect(page.getByLabel('block-item-CardItem-general-')).toBeVisible();
    // 1. 打开关系字段弹窗
    await page.getByLabel('block-item-CardItem-general-').locator('a').first().click();
    await page.getByLabel('block-item-CardItem-roles-').click();

    // 2. 提交后，Table 会显示新增的数据
    await page.getByLabel('action-Action-Add new-create-roles-table').click();

    // 3. 区块数据表为关系字段的区块
    await page
      .getByTestId('drawer-Action.Container-roles-Add record')
      .getByLabel('schema-initializer-Grid-popup')
      .click();

    await page.getByRole('menuitem', { name: 'form Form' }).hover();
    await page.getByRole('menuitem', { name: 'Current collection' }).click();
    await expect(page.getByLabel('block-item-CardItem-roles-form')).toBeVisible();
  });
});
