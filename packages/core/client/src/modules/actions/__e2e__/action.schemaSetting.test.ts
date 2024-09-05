/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { OneTableWithDelete, shouldRefreshBlockDataAfterMultiplePopupsClosed } from './templates';

test.describe('action settings', () => {
  test('refresh data on action', async ({ page, mockPage, mockRecords }) => {
    await mockPage(OneTableWithDelete).goto();
    await mockRecords('general', 2);
    await page.getByLabel('block-item-CardItem-general-').hover();
    await page.getByLabel('action-Action.Link-Delete-').first().hover();
    await page.getByLabel('designer-schema-settings-Action.Link-actionSettings:delete-general').first().hover();

    await expect(page.getByRole('menuitem', { name: 'Refresh data on action' }).getByRole('switch')).toBeChecked();
    // 默认开启执行后刷新
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('api/general:list')),
      page.getByLabel('action-Action.Link-Delete-').first().click(),
      page.getByRole('button', { name: 'OK' }).click(),
    ]);
    expect(request).toBeTruthy();

    await page.getByLabel('action-Action.Link-Delete-').first().hover();
    await page.getByLabel('designer-schema-settings-Action.Link-actionSettings:delete-general').first().hover();

    //关闭则执行后不刷新数据
    await page.getByRole('menuitem', { name: 'Refresh data on action' }).click();

    let requestMade = false;
    // 监听所有网络请求
    page.on('request', (request) => {
      if (request.url().includes('api/general:list')) {
        requestMade = true;
      }
    });
    await page.getByLabel('action-Action.Link-Delete-').click();
    await page.getByRole('button', { name: 'OK' }).click();
    await page.waitForTimeout(500);
    expect(requestMade).toBeFalsy();
  });

  test('should refresh block data after multiple popups closed', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(shouldRefreshBlockDataAfterMultiplePopupsClosed).waitForInit();
    await mockRecord('users', { username: 'Test', roles: [{ title: 'Test role' }] });
    await nocoPage.goto();

    await page.getByLabel('action-Action.Link-Edit-update-users-table-1').click();
    await page.getByTestId('drawer-Action.Container-users-Edit record').getByLabel('action-Action.Link-Edit-').click();
    await page.getByLabel('block-item-CollectionField-').getByRole('textbox').fill('abc123');
    await page.getByLabel('action-Action-Submit-submit-').click();

    // the first popup
    await expect(
      page.getByTestId('drawer-Action.Container-users-Edit record').getByRole('button', { name: 'abc123' }),
    ).toBeVisible();

    // close the first popup
    await page.getByLabel('drawer-Action.Container-users-Edit record-mask').click();
    await expect(page.getByLabel('block-item-CardItem-users-').getByRole('button', { name: 'abc123' })).toBeVisible();

    // 重复上面的步骤，中间加上刷新页面的操作 -----------------------------------------------------------------------------------
    await page.getByLabel('action-Action.Link-Edit-update-users-table-1').click();
    await page.getByTestId('drawer-Action.Container-users-Edit record').getByLabel('action-Action.Link-Edit-').click();

    // 刷新页面后依然正常
    await page.reload();

    await page.getByLabel('block-item-CollectionField-').getByRole('textbox').fill('abc456');
    await page.getByLabel('action-Action-Submit-submit-').click();

    // the first popup
    await expect(page.getByRole('button', { name: 'abc456' })).toBeVisible();

    // close the first popup
    await page.locator('.ant-drawer-mask').click();
    await expect(page.getByLabel('block-item-CardItem-users-').getByRole('button', { name: 'abc456' })).toBeVisible();
  });
});
