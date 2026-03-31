/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { shouldBackAfterClickBackButton } from './templatesOfBug';

test.describe('sub page', () => {
  test('should back after click back button', async ({ page, mockPage }) => {
    await mockPage(shouldBackAfterClickBackButton).goto();

    // 单层子页面 ------------------------------------------------------------------------
    await page.getByLabel('action-Action.Link-View-view-').first().click();
    await expect(
      page.getByLabel('block-item-Markdown.Void-').getByText('Markdown：单层子页面中的内容。'),
    ).toBeVisible();

    // 切换 tab 之后点击返回按钮
    await page.getByText('tab2').click();
    await expect(
      page.getByLabel('block-item-Markdown.Void-').getByText('Markdown：单层子页面中的内容，tab2。'),
    ).toBeVisible();
    await page.getByLabel('back-button').click();

    // 从弹窗中打开子页面 ----------------------------------------------------------------------
    await page.getByLabel('action-Action.Link-View-view-').nth(1).click();
    await page.getByLabel('action-Action.Link-View-view-roles-table-admin').click();
    await expect(
      page.getByLabel('block-item-Markdown.Void-').getByText('Markdown：从弹窗中打开的子页面。'),
    ).toBeVisible();

    // 切换 tab 之后点击返回按钮
    await page.getByText('tab2').click();
    await expect(
      page.getByLabel('block-item-Markdown.Void-').getByText('Markdown：从弹窗中打开的子页面，tab2。'),
    ).toBeVisible();
    await page.getByLabel('back-button').click();
    await page.getByLabel('drawer-Action.Container-users-View record-mask').click();

    // 从嵌套弹窗中打开子页面 --------------------------------------------------------------------
    await page.getByLabel('action-Action.Link-View-view-').nth(2).click();
    await page.getByLabel('action-Action.Link-View-view-roles-table-admin').click();
    await page.getByLabel('action-Action-Edit-update-').click();
    await expect(
      page.getByLabel('block-item-Markdown.Void-').getByText('Markdown：从嵌套弹窗中打开的子页面。'),
    ).toBeVisible();
    await page.getByLabel('back-button').click();
    await page.getByLabel('drawer-Action.Container-roles-View record-mask').click();
    await page.getByLabel('drawer-Action.Container-users-View record-mask').click();

    // 嵌套的子页面 ----------------------------------------------------------------------------
    await page.getByLabel('action-Action.Link-View-view-').nth(3).click();
    await page.getByLabel('action-Action.Link-View-view-roles-table-member').click();
    await expect(
      page.getByLabel('block-item-Markdown.Void-').getByText('Markdown：嵌套的子页面，第二层级。'),
    ).toBeVisible();

    // 切换 tab 之后点击返回按钮
    await page.getByText('tab2').click();
    await expect(
      page.getByLabel('block-item-Markdown.Void-').getByText('Markdown：嵌套的子页面，第二层级，tab2。'),
    ).toBeVisible();
    await page.getByLabel('back-button').nth(1).click();
    await page.getByLabel('back-button').click();

    expect(page.url()).not.toContain('/popups/');

    // 确认是否回到了主页面
    await page.getByText('单层子页面').hover();
    await expect(
      page.getByRole('button', { name: 'designer-schema-settings-CardItem-blockSettings:table-users' }),
    ).toBeVisible();
  });
});
