/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { T3924 } from './templatesOfBug';

test.describe('bulk edit form', () => {
  // https://nocobase.height.app/T-3924/description
  test('should be required when switching to "Changed to"', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(T3924).waitForInit();
    await mockRecord('users2');
    await nocoPage.goto();

    // 1. 先选中一条记录
    await page.getByLabel('table-index-').hover();
    await page.getByLabel('table-index-').getByLabel('checkbox').check();
    await page.getByLabel('schema-initializer-TableV2-').hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    // 2. 打开弹窗，显示出批量编辑表单
    await page.getByLabel('action-Action-Bulk edit-').click();

    await page.getByLabel('block-item-BulkEditField-').click();
    await page.getByRole('option', { name: 'Changed to' }).click();

    //  "Changed to" 模式，此时应该显示字段是必填的
    await expect(page.getByLabel('block-item-BulkEditField-').getByText('*')).toBeVisible();

    // 3. 输入值，点击提交
    await expect(page.getByLabel('block-item-BulkEditField-').getByRole('textbox')).toHaveCount(1);
    await page.getByLabel('block-item-BulkEditField-').getByRole('textbox').fill('123');
    await page.getByRole('button', { name: 'Submit' }).click();

    // 4. Table 中的值应该被改变
    await expect(page.getByRole('button', { name: '123', exact: true })).toBeVisible();
  });

  test('should be success to submit', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(T3924).waitForInit();
    await mockRecord('users2');
    await nocoPage.goto();

    // 1. 打开弹窗，显示出批量编辑表单
    await page.getByLabel('action-Action-Bulk edit-').click();

    await page.getByLabel('block-item-BulkEditField-').click();
    await page.getByRole('option', { name: 'Changed to' }).click();

    //  "Changed to" 模式，此时应该显示字段是必填的
    await expect(page.getByLabel('block-item-BulkEditField-').getByText('*')).toBeVisible();

    // 2. 切换为其它模式，此时应该不显示字段是必填的
    await page.getByLabel('block-item-BulkEditField-').locator('.ant-select-selector').click();
    await page.getByRole('option', { name: 'Remains the same' }).click();
    await expect(page.getByLabel('block-item-BulkEditField-').getByText('*')).toBeHidden();

    // 3. 再切换为 "Changed to" 模式，此时应该显示字段是必填的
    await page.getByLabel('block-item-BulkEditField-').locator('.ant-select-selector').click();
    await page.getByRole('option', { name: 'Changed to' }).click();
    await expect(page.getByLabel('block-item-BulkEditField-').getByText('*')).toBeVisible();

    // 4. 点击提交按钮，应该提示一个错误
    await expect(page.getByRole('button', { name: 'Submit' })).toHaveCount(1);
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByLabel('block-item-BulkEditField-').getByText('The field value is required')).toBeVisible();

    // 5. 输入值后，应该不再提示错误
    await page.getByLabel('block-item-BulkEditField-').getByRole('textbox').fill('123');
    await expect(page.getByLabel('block-item-BulkEditField-').getByText('The field value is required')).toBeHidden();
    // 将鼠标指针移除 Submit 按钮，防止显示右上角的图标，不然影响 Locator 的定位
    await page.mouse.move(-300, 0);
    await page.getByRole('button', { name: 'Submit' }).click();

    // 6. 由于没有选中任何记录，应该提示一个错误
    await expect(page.getByText('Please select the records to')).toBeVisible();
  });
});
