/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { TableBlockWithDataScope, tableListDetailsGridCardWithUsers } from './templatesOfBug';

test.describe('setDataLoadingModeSettingsItem', () => {
  test('basic', async ({ page, mockPage }) => {
    await mockPage(tableListDetailsGridCardWithUsers).goto();

    // 1. 默认情况下，Table、List、Details、GridCard 的 dataLoadingMode 都是 auto（自动加载数据）
    await expect(page.getByLabel('block-item-CardItem-users-table').getByText('Super Admin')).toBeVisible();
    await expect(page.getByLabel('block-item-CardItem-users-details').getByText('Super Admin')).toBeVisible();
    await expect(page.getByLabel('block-item-CardItem-users-list').getByText('Super Admin')).toBeVisible();
    await expect(page.getByLabel('block-item-BlockItem-users-').getByText('Super Admin')).toBeVisible();

    // 2. 将区块的 dataLoadingMode 设置为 manual（手动加载数据），区块内应该显示 No data
    // Table
    await page.getByLabel('block-item-CardItem-users-table').hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:table-users').hover();
    await page.getByRole('menuitem', { name: 'Set data loading mode' }).click();
    await page.getByLabel('Do not load data when filter is empty').check();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // Details
    await page.getByLabel('block-item-CardItem-users-details').hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:detailsWithPagination-users').hover();
    await page.getByRole('menuitem', { name: 'Set data loading mode' }).click();
    await page.getByLabel('Do not load data when filter is empty').check();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // List
    await page.getByLabel('block-item-CardItem-users-list').hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:list-users').hover();
    await page.getByRole('menuitem', { name: 'Set data loading mode' }).click();
    await page.getByLabel('Do not load data when filter is empty').check();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // GridCard
    await page.getByLabel('block-item-BlockItem-users-').hover();
    await page.getByLabel('designer-schema-settings-BlockItem-blockSettings:gridCard-users').hover();
    await page.getByRole('menuitem', { name: 'Set data loading mode' }).click();
    await page.getByLabel('Do not load data when filter is empty').check();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 所有区块应该显示 No data
    await expect(page.getByLabel('block-item-CardItem-users-table').getByText('No data').last()).toBeVisible();
    await expect(page.getByLabel('block-item-CardItem-users-details').getByText('No data').last()).toBeVisible();
    await expect(page.getByLabel('block-item-CardItem-users-list').getByText('No data').last()).toBeVisible();
    await expect(page.getByLabel('block-item-BlockItem-users-').getByText('No data').last()).toBeVisible();

    // 3. 在筛选表单中数据一个筛选条件，点击筛选按钮，区块内应该显示数据
    await page.getByLabel('block-item-CollectionField-').getByRole('textbox').click();
    await page.getByLabel('block-item-CollectionField-').getByRole('textbox').fill('Super Admin');
    await page.getByLabel('action-Action-Filter records-submit-').click();

    await expect(page.getByLabel('block-item-CardItem-users-table').getByText('Super Admin')).toBeVisible();
    await expect(page.getByLabel('block-item-CardItem-users-details').getByText('Super Admin')).toBeVisible();
    await expect(page.getByLabel('block-item-CardItem-users-list').getByText('Super Admin')).toBeVisible();
    await expect(page.getByLabel('block-item-BlockItem-users-').getByText('Super Admin')).toBeVisible();

    // 4. 点击筛选表单的 Reset 按钮，区块内应该显示 No data
    await page.getByLabel('action-Action-Reset to empty-users-').click();
    await expect(page.getByLabel('block-item-CardItem-users-table').getByText('No data').last()).toBeVisible();
    await expect(page.getByLabel('block-item-CardItem-users-details').getByText('No data').last()).toBeVisible();
    await expect(page.getByLabel('block-item-CardItem-users-list').getByText('No data').last()).toBeVisible();
    await expect(page.getByLabel('block-item-BlockItem-users-').getByText('No data').last()).toBeVisible();
  });

  test('When the data block has data scope settings and dataLoadingMode is manual, data should not be displayed after the first page load', async ({
    page,
    mockPage,
  }) => {
    await mockPage(TableBlockWithDataScope).goto();
    await expect(page.getByLabel('block-item-CardItem-users-table').getByText('No data').last()).toBeVisible();

    // 此时点击 filter 按钮，应该还是没数据，因为表单没有值
    await page.getByLabel('action-Action-Filter-submit-').click({
      position: {
        x: 10,
        y: 10,
      },
    });
    await expect(page.getByLabel('block-item-CardItem-users-table').getByText('No data').last()).toBeVisible();

    // 点击 Reset 按钮，也是一样
    await page.getByLabel('action-Action-Reset-users-').click({
      position: {
        x: 10,
        y: 10,
      },
    });
    await expect(page.getByLabel('block-item-CardItem-users-table').getByText('No data').last()).toBeVisible();
  });
});
