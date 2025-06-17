/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { oneTableWithMap } from './templates';

test.describe('where map block can be added', () => {
  test('page & popup', async ({ page, mockPage }) => {
    const nocoPage = await mockPage(oneTableWithMap).waitForInit();
    await nocoPage.goto();
    await page.waitForLoadState('networkidle');

    // 1. 在页面中添加地图区块，因为没有配置 Access key 等信息，所以会显示错误提示
    await page.getByLabel('schema-initializer-Grid-page:').hover();
    await page.getByRole('menuitem', { name: 'Map right' }).hover();
    await page.getByRole('menuitem', { name: 'map', exact: true }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(
      page
        .getByLabel('block-item-CardItem-map-map')
        .getByText('Please configure the AccessKey and SecurityJsCode first'),
    ).toBeVisible();

    // 2. 点击跳转按钮去配置页面，配置好后返回刚才的页面，应该能正常显示地图
    await page.getByRole('button', { name: 'Go to the configuration page' }).click();
    await page.waitForURL('/admin/settings/map');
    await page.waitForLoadState('networkidle');
    const editBtn = page.getByRole('button', { name: 'Edit' }).first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
    }
    await page.getByLabel('Access key').fill('9717a70e44273882bcf5489f72b4e261');
    await page.getByLabel('securityJsCode or serviceHost').fill('6876ed2d3a6168b75c4fba852e16c99c');
    await page.getByRole('button', { name: 'Save' }).first().click();
    await expect(page.locator('.ant-message-notice').getByText('Saved successfully')).toBeVisible();
    await nocoPage.goto();
    await page.waitForSelector('.amap-layer');
    await expect(page.getByLabel('block-item-CardItem-map-map').locator('.amap-layer')).toBeAttached();

    // 3. 在弹窗中添加地图区块，应该能正常显示地图
    await page.getByLabel('block-item-CardItem-map-table').getByLabel('action-Action-Add new-create-').click();
    await page.getByLabel('schema-initializer-Grid-form:').hover();
    await page.getByRole('menuitem', { name: 'point' }).click();
    await page.waitForSelector('.amap-layer');
    await expect(page.getByLabel('block-item-CollectionField-').locator('.amap-layer')).toBeAttached();

    // 4. 清空配置信息，以免影响其他测试用例
    await page.goto('/admin/settings/map');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await page.getByLabel('Access key').clear();
    await page.getByLabel('securityJsCode or serviceHost').clear();
    await page.getByRole('button', { name: 'Save' }).first().click();
    await expect(page.locator('.ant-message-notice').getByText('Saved successfully')).toBeVisible();
  });
});
