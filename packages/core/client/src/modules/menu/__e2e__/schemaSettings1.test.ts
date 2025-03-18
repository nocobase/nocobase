/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Page, expect, test } from '@nocobase/test/e2e';

test.describe('group page menus schema settings', () => {
  test('edit', async ({ page, mockPage }) => {
    await mockPage({ type: 'group', name: 'group page' }).goto();
    await showSettings(page, 'group page');
    await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
    await page.mouse.move(300, 0);

    // 设置一个新名称
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('new group page');
    // 设置一个图标
    await page.getByRole('button', { name: 'Select icon' }).click();
    await page.getByRole('tooltip').getByLabel('account-book').locator('svg').click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await page.reload();

    await expect(page.getByLabel('new group page')).toBeVisible();
    await expect(page.getByLabel('new group page').getByLabel('account-book').locator('svg')).toBeVisible();
  });

  // TODO: desktopRoutes:move 接口有问题，例如，有 3 个路由，把 1 移动到 2 后面，实际上会把 1 移动到 3 后面
  test.skip('move to', async ({ page, mockPage }) => {
    await mockPage({ type: 'group', name: 'anchor page' }).waitForInit();
    await mockPage({ type: 'group', name: 'a other group page' }).waitForInit();
    await mockPage({ type: 'group', name: 'group page' }).goto();

    // 默认情况下的排列顺序：anchor page, group page
    await expect(page.getByText('anchor pagea other group pagegroup page')).toBeVisible();

    // 移动到 anchor page 之前 --------------------------------------------
    await showSettings(page, 'group page');
    await page.getByRole('menuitem', { name: 'Move to' }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('block-item-TreeSelect-Target').locator('.ant-select').click();
    await page.locator('.ant-select-dropdown').getByText('anchor page').click();
    await page.getByLabel('Before').click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByText('group pageanchor pagea other group page')).toBeVisible();

    // 移动到 anchor page 之后
    await showSettings(page, 'group page');
    await page.getByRole('menuitem', { name: 'Move to' }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('block-item-TreeSelect-Target').locator('.ant-select').click();
    await page.locator('.ant-select-dropdown').getByText('anchor page').click();
    await page.getByLabel('After').click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByText('anchor pagegroup pagea other group page')).toBeVisible();

    // 移动到 anchor page 内部 --------------------------------------------
    await showSettings(page, 'group page');
    await page.getByRole('menuitem', { name: 'Move to' }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('block-item-TreeSelect-Target').locator('.ant-select').click();
    await page.locator('.ant-select-dropdown').getByText('anchor page').click();
    await page.getByLabel('Inner').click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    // 跳转到 anchor page 页面，会有一个名为 group page 的子页面菜单
    await page.getByLabel('anchor page').click();
    await expect(page.locator('.ant-layout-sider').getByLabel('group page')).toBeVisible();

    // 移动到子页面菜单之前 --------------------------------------------
    await showSettings(page, 'a other group page');
    await page.getByRole('menuitem', { name: 'Move to' }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('block-item-TreeSelect-Target').locator('.ant-select').click();
    await page.getByLabel('caret-down').locator('svg').click();
    await page.locator('.ant-select-dropdown').getByText('group page', { exact: true }).click();
    await page.getByLabel('Before').click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.locator('.ant-layout-sider').getByText('a other group pagegroup page')).toBeVisible();
  });

  test('insert before', async ({ page, mockPage, deletePage }) => {
    await mockPage({ name: 'single page' }).goto();

    // 在 single page 之前插入一个 group page
    await showSettings(page, 'single page');
    await page.getByRole('menuitem', { name: 'Insert before' }).hover();
    await page.getByRole('menuitem', { name: 'Group', exact: true }).click();
    await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').fill('group page');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await expect(page.locator('.ant-layout-header').getByText('group pagesingle page')).toBeVisible();

    await deletePage('group page');
  });

  test('insert after', async ({ page, mockPage, deletePage }) => {
    await mockPage({ name: 'single page' }).goto();

    // 在 single page 之后插入一个 group page
    await showSettings(page, 'single page');
    await page.getByRole('menuitem', { name: 'Insert after' }).hover();
    await page.getByRole('menuitem', { name: 'Group', exact: true }).click();
    await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').fill('group page');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await expect(page.locator('.ant-layout-header').getByText('single pagegroup page')).toBeVisible();

    await deletePage('group page');
  });

  test('insert inner', async ({ page, mockPage }) => {
    await mockPage({ type: 'group', name: 'group page' }).goto();

    // 在 group page 内部插入一个 single page
    await showSettings(page, 'group page');
    await page.getByRole('menuitem', { name: 'Insert inner' }).hover();
    await page.getByRole('menuitem', { name: 'Page', exact: true }).click();
    await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').fill('single page');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await expect(page.locator('.ant-layout-sider').getByText('single page')).toBeVisible();
  });

  test('delete', async ({ page, mockPage }) => {
    await mockPage({ type: 'group', name: 'group page' }).goto();
    await expect(page.getByLabel('group page')).toBeVisible();

    await showSettings(page, 'group page');
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 现在需要刷新一下页面，被删除的页面内容才会消失
    await page.reload();
    await expect(page.getByLabel('group page')).not.toBeVisible();
  });
});

async function showSettings(page: Page, pageName: string) {
  await page.locator('.ant-layout-header').getByText(pageName, { exact: true }).hover();
  // hover 方法有时会失效，所以用 click 替代，原因未知
  await page.getByRole('button', { name: 'designer-schema-settings-' }).click();
}
