/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { accessControlActionWithTable } from './template';

test.describe('Access control', () => {
  test('popup、link、custom request support access control', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(accessControlActionWithTable).waitForInit();
    await nocoPage.goto();
    await page.getByLabel('block-item-CardItem-users-').hover();
    //popup
    await page.getByLabel('action-Action-Popup-customize').hover();
    await page.getByLabel('designer-schema-settings-Action-actionSettings:popup-users').hover();
    await expect(page.getByRole('menuitem', { name: 'Access control' })).toBeVisible();
    await page.getByLabel('designer-schema-settings-Action-actionSettings:popup-users').hover();
    await page.mouse.move(300, 0);

    //link
    await page.getByLabel('action-Action-Link-customize:').hover();

    await page.getByLabel('designer-schema-settings-Action-actionSettings:link-users').hover();
    await expect(page.getByRole('menuitem', { name: 'Access control' })).toBeVisible();
    await page.mouse.move(300, 0);

    // custom request
    await page.getByLabel('action-CustomRequestAction-').hover();
    await page.getByLabel('designer-schema-settings-CustomRequestAction-actionSettings:customRequest-users').hover();
    await expect(page.getByRole('menuitem', { name: 'Access control' })).toBeVisible();
    await page.mouse.move(300, 0);
  });
  test('access control with role ', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(accessControlActionWithTable).waitForInit();
    await nocoPage.goto();
    await page.getByLabel('block-item-CardItem-users-').hover();
    //popup only member can see
    await page.getByLabel('action-Action-Popup-customize').hover();
    await page.getByLabel('designer-schema-settings-Action-actionSettings:popup-users').hover();
    await page.getByRole('menuitem', { name: 'Access control' }).click();
    await page.getByLabel('block-item-RemoteSelect-users').click();
    await page.getByText('Member').click();
    await page.getByRole('option', { name: 'Member' }).locator('div').click();
    await page.getByLabel('block-item-RemoteSelect-users').click();
    await page.getByRole('button', { name: 'Submit' }).click();

    //root 角色有权限
    await expect(page.getByLabel('action-Action-Popup-customize')).toBeVisible();

    //切换 为admin
    await page.getByTestId('user-center-button').click();
    await page.getByText('Switch roleRoot').click();
    await page.getByText('Admin', { exact: true }).click();
    await expect(page.getByLabel('action-Action-Popup-customize')).not.toBeVisible();

    // 切换 为 member

    await page.getByTestId('user-center-button').click();
    await page.getByText('Switch roleAdmin').click();
    await page.getByText('Member').click();
    await expect(page.getByLabel('action-Action-Popup-customize')).toBeVisible();
  });
});
