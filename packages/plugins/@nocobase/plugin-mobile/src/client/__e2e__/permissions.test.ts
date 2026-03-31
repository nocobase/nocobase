/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, Page, test } from '@nocobase/test/e2e';

const createNewPage = async (title: string, page: Page) => {
  await page.getByTestId('schema-initializer-MobileTabBar').hover();
  await page.getByRole('menuitem', { name: 'Page' }).click();
  await page.getByLabel('block-item-Input-Title').getByRole('textbox').fill(title);
  await page.getByRole('button', { name: 'Select icon' }).click();
  await page.getByRole('tooltip').getByLabel('account-book').locator('svg').click();
  await page.getByLabel('action-Action-Submit').click();
};

const createNewTab = async (title: string, page: Page) => {
  await page.getByLabel('action-Action-undefined').click();
  await page.getByLabel('block-item-Input-Title').getByRole('textbox').fill(title);
  await page.getByLabel('action-Action-Submit').click();
};

const deletePage = async (title: string, page: Page) => {
  await page.getByLabel('block-item-MobileTabBar.Page').filter({ hasText: title }).hover();
  await page.getByTestId('mobile-tab-bar').getByRole('button', { name: 'designer-schema-settings-' }).hover();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'OK', exact: true }).click();
};

test.describe('mobile permissions', () => {
  test('menu permission ', async ({ page }) => {
    await page.goto('/m');

    // by default, the user's role is root, which has all permissions
    // create a new page
    await createNewPage('root', page);

    // expect: the new page should be visible
    await expect(page.getByLabel('block-item-MobileTabBar.Page').filter({ hasText: 'root' })).toHaveCount(1);
    await expect(page.getByLabel('block-item-MobileTabBar.Page').filter({ hasText: 'root' })).toBeVisible();

    // change the user's role to admin
    await page.evaluate(() => {
      window.localStorage.setItem('NOCOBASE_ROLE', 'admin');
    });
    await page.reload();
    await createNewPage('admin', page);

    await page.getByLabel('block-item-MobilePageProvider').hover();
    await page.getByLabel('designer-schema-settings-MobilePageProvider-mobile:page').hover();
    await page.getByRole('menuitem', { name: 'Display tabs' }).getByRole('switch').check();

    // create a new tab
    await createNewTab('tab456', page);
    await expect(page.getByRole('tab', { name: 'tab456', exact: true })).toBeVisible();

    // change tab title 'Unnamed' to 'tab123'
    await page.getByRole('tab', { name: 'Unnamed', exact: true }).hover();
    await page.getByTestId('mobile-page-tabs-Unnamed').getByLabel('designer-schema-settings-').hover();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await page.getByLabel('block-item-Input-Title').getByRole('textbox').fill('tab123');
    await page.getByRole('button', { name: 'Submit' }).click();

    // expect: the new page should be visible
    await expect(page.getByLabel('block-item-MobileTabBar.Page').filter({ hasText: 'admin' })).toHaveCount(1);
    await expect(page.getByLabel('block-item-MobileTabBar.Page').filter({ hasText: 'admin' })).toBeVisible();

    // change the user's role to admin, and then change the menu permission
    await page.evaluate(() => {
      window.localStorage.setItem('NOCOBASE_ROLE', 'admin');
    });
    await page.reload();
    await page.goto('/admin/settings/users-permissions/roles');
    await page.getByRole('tab', { name: 'Mobile routes' }).click();
    await page.getByRole('row', { name: 'Expand row admin' }).getByLabel('', { exact: true }).uncheck();
    await page.getByRole('button', { name: 'Expand row' }).click();
    // the children of the admin tabs should be unchecked
    await expect(page.getByRole('row', { name: 'tab123' }).getByLabel('', { exact: true })).toBeChecked({
      checked: false,
    });
    await expect(page.getByRole('row', { name: 'tab456' }).getByLabel('', { exact: true })).toBeChecked({
      checked: false,
    });

    // the admin tab should be checked when the child is checked
    await page.getByRole('row', { name: 'tab123' }).getByLabel('', { exact: true }).check();
    await expect(page.getByRole('row', { name: 'Collapse row admin' }).getByLabel('', { exact: true })).toBeChecked({
      checked: true,
    });

    // the admin tab should be unchecked when the children is all unchecked
    await page.getByRole('row', { name: 'tab123' }).getByLabel('', { exact: true }).uncheck();
    await expect(page.getByRole('row', { name: 'Collapse row admin' }).getByLabel('', { exact: true })).toBeChecked({
      checked: false,
    });

    // to the mobile, the admin page should be hidden
    await page.goto('/m');
    await expect(page.getByLabel('block-item-MobileTabBar.Page').filter({ hasText: 'admin' })).not.toBeVisible();

    // go back to the configuration page, and check one child of the admin
    await page.goto('/admin/settings/users-permissions/roles');
    await page.getByRole('tab', { name: 'Mobile routes' }).click();
    await page.getByRole('button', { name: 'Expand row' }).click();
    await page.getByRole('row', { name: 'tab123' }).getByLabel('', { exact: true }).check();

    // to the mobile, the admin page should be visible, and the tab123 should be visible, and the tab456 should be hidden
    await page.goto('/m');
    await expect(page.getByLabel('block-item-MobileTabBar.Page').filter({ hasText: 'admin' })).toBeVisible();
    await page.getByLabel('block-item-MobileTabBar.Page').filter({ hasText: 'admin' }).click();
    await expect(page.getByRole('tab', { name: 'tab123', exact: true })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'tab456', exact: true })).not.toBeVisible();

    // delete the pages
    await deletePage('root', page);
    await deletePage('admin', page);
  });
});
