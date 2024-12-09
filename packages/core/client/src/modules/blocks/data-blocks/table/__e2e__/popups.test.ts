/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import {
  differentURL_DifferentPopupContent,
  popupConfigurationShouldPersistAcrossDifferentRowsInTheSameColumn,
} from './templatesOfBug';

test.describe('popup opened by clicking the association field', async () => {
  test('different URL, different popup content', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(differentURL_DifferentPopupContent).waitForInit();
    await mockRecord('users', { roles: [{ name: 'test', title: 'Test' }] });
    await nocoPage.goto();

    await page.getByText('admin').click();
    await expect(page.getByLabel('block-item-CollectionField-')).toHaveText('Role name:Admin');
    const prevURL = page.url();
    await page.goBack();

    await page.getByText('test').click();
    await expect(page.getByLabel('block-item-CollectionField-')).toHaveText('Role name:Test');

    // 通过 URL 打开第一行的弹窗，弹窗中的内容应该是第一行的内容
    await page.goto(prevURL);
    await expect(page.getByLabel('block-item-CollectionField-')).toHaveText('Role name:Admin');
  });

  test('popup configuration should persist across different rows in the same column', async ({
    page,
    mockPage,
    mockRecord,
  }) => {
    const nocoPage = await mockPage(popupConfigurationShouldPersistAcrossDifferentRowsInTheSameColumn).waitForInit();
    await mockRecord('users', { roles: [{ name: 'member', title: 'Member' }], nickname: 'test popup' });
    await nocoPage.goto();

    // 1. 新建一个 View 按钮
    await page.getByRole('button', { name: 'Actions', exact: true }).hover();
    await page.getByLabel('designer-schema-initializer-TableV2.Column-fieldSettings:TableColumn-users').hover();
    await page.getByRole('menuitem', { name: 'View' }).click();

    // 2. 点击第一行的 View 按钮，打开弹窗，然后增加一个 Markdown 区块
    await page.getByLabel('action-Action.Link-View-view-users-table-0').click();
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'form Markdown' }).click();
    await expect(page.getByLabel('block-item-Markdown.Void-')).toBeVisible();

    // 3. 关闭弹窗，然后点击第二行的 View 按钮，打开弹窗，弹窗中的 Markdown 区块应该和第一行的一样
    await page.getByLabel('drawer-Action.Container-users-View record-mask').click();
    await page.getByLabel('action-Action.Link-View-view-users-table-1').click();
    await expect(page.getByLabel('block-item-Markdown.Void-')).toBeVisible();

    // 4. 关闭弹窗，然后再点击第一行的 View 按钮，打开弹窗，弹窗中的 Markdown 区块依然存在
    await page.getByLabel('drawer-Action.Container-users-View record-mask').click();
    await page.getByLabel('action-Action.Link-View-view-users-table-0').click();
    await expect(page.getByLabel('block-item-Markdown.Void-')).toBeVisible();
    await page.getByLabel('drawer-Action.Container-users-View record-mask').click();

    // -----------------------------------------------------------------------------------------

    // 1. 新建一个关系字段（Roles）
    await page.getByLabel('schema-initializer-TableV2-').hover();
    await page.getByRole('menuitem', { name: 'Roles' }).click();
    await page.mouse.move(300, 0);

    // 2. 点击第一行的 Roles 字段，打开弹窗，然后增加一个 Markdown 区块
    await page.getByText('root').click();
    await page.getByLabel('schema-initializer-Grid-popup').click();
    await page.getByRole('menuitem', { name: 'form Markdown' }).click();
    await expect(page.getByLabel('block-item-Markdown.Void-')).toBeVisible();

    // 3. 关闭弹窗，然后点击第二行的 Roles 字段，打开弹窗，弹窗中的 Markdown 区块应该和第一行的一样
    await page.getByLabel('drawer-AssociationField.Viewer-roles-View record-mask').click();
    await page.getByText('member').nth(1).click();
    await expect(page.getByLabel('block-item-Markdown.Void-')).toBeVisible();

    // 4. 关闭弹窗，然后再点击第一行的 Roles 字段，打开弹窗，弹窗中的 Markdown 区块依然存在
    await page.getByLabel('drawer-AssociationField.Viewer-roles-View record-mask').click();
    await page.getByText('root').click();
    await expect(page.getByLabel('block-item-Markdown.Void-')).toBeVisible();
    await page.getByLabel('drawer-AssociationField.Viewer-roles-View record-mask').click();

    // ---------------------------------------------------------------------------------------------------

    // 1. 新建一个单行文本字段（nickname），并开启 Enable link
    await page.getByLabel('schema-initializer-TableV2-').hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await page.mouse.move(300, 0);
    // 开启 Enable link
    await page.getByRole('button', { name: 'Nickname' }).hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-users' })
      .hover();
    await page.getByRole('menuitem', { name: 'Enable link' }).click();
    await page.mouse.move(300, 0);

    // 2. 点击第一行的 nickname 字段，打开弹窗，然后增加一个 Markdown 区块
    await page.getByRole('button', { name: 'Super Admin' }).locator('a').click();
    await page.getByLabel('schema-initializer-Grid-popup').click();
    await page.getByRole('menuitem', { name: 'form Markdown' }).click();
    await expect(page.getByLabel('block-item-Markdown.Void-')).toBeVisible();

    // 3. 关闭弹窗，然后点击第二行的 nickname 字段，打开弹窗，弹窗中的 Markdown 区块应该和第一行的一样
    await page.getByLabel('drawer-Action.Container-users-View record-mask').click();
    await page.getByRole('button', { name: 'test popup' }).locator('a').click();
    await expect(page.getByLabel('block-item-Markdown.Void-')).toBeVisible();

    // 4. 关闭弹窗，然后再点击第一行的 nickname 字段，打开弹窗，弹窗中的 Markdown 区块依然存在
    await page.getByLabel('drawer-Action.Container-users-View record-mask').click();
    await page.getByRole('button', { name: 'Super Admin' }).locator('a').click();
    await expect(page.getByLabel('block-item-Markdown.Void-')).toBeVisible();
    await page.getByLabel('drawer-Action.Container-users-View record-mask').click();
  });
});
