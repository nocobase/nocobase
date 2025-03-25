/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { oneTableWithGeneral } from './templates';

test.describe('bulk-destroy', () => {
  test('in table', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneTableWithGeneral).waitForInit();
    await mockRecords('general', 3);
    await nocoPage.goto();

    await expect(page.getByLabel('block-item-CardItem-general-').getByText('No data')).not.toBeVisible();

    // 1. 创建一个批量删除按钮
    await page.getByLabel('schema-initializer-ActionBar-').hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();

    // 2. 选中所有行
    await page.getByLabel('Select all').check();

    // 3. 点击批量删除按钮，Table 显示无数据
    await page.getByLabel('action-Action-Delete-destroy-').click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByLabel('block-item-CardItem-general-').getByText('No data').last()).toBeVisible();
  });

  test('Secondary confirmation', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneTableWithGeneral).waitForInit();
    await mockRecords('general', 3);
    await nocoPage.goto();

    await expect(page.getByLabel('block-item-CardItem-general-').getByText('No data')).not.toBeVisible();

    // 1. 创建一个批量删除按钮，并关闭二次确认
    await page.getByLabel('schema-initializer-ActionBar-').hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByLabel('action-Action-Delete-destroy-').hover();
    await page.getByLabel('designer-schema-settings-Action-actionSettings:bulkDelete-general').hover();
    await page.getByRole('menuitem', { name: 'Secondary confirmation' }).click();
    await page.getByLabel('Enable secondary confirmation').uncheck();
    await expect(page.getByRole('button', { name: 'OK' })).toHaveCount(1);
    await page.getByRole('button', { name: 'OK' }).click();
    await page.mouse.move(500, 0);

    // 2. 选中所有行
    await page.getByLabel('Select all').check();

    // 3. 点击批量删除按钮，Table 显示无数据
    await page.getByLabel('action-Action-Delete-destroy-').click();
    await expect(page.getByLabel('block-item-CardItem-general-').getByText('No data').last()).toBeVisible();
  });
});
