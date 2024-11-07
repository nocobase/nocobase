/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@formily/shared';
import { expect, groupPageEmpty, test } from '@nocobase/test/e2e';

test.describe('add menu item', () => {
  test('header', async ({ page, deletePage }) => {
    await page.goto('/');
    const pageGroup = uid();
    const pageItem = uid();
    const pageLink = uid();

    // add group
    await page.getByTestId('schema-initializer-Menu-header').hover();
    await page.getByRole('menuitem', { name: 'Group' }).click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill(pageGroup);
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByLabel(pageGroup, { exact: true })).toBeVisible();

    // add page
    await page.getByTestId('schema-initializer-Menu-header').hover();
    await page.getByRole('menuitem', { name: 'Page', exact: true }).click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill(pageItem);
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByLabel(pageItem, { exact: true })).toBeVisible();

    // add link
    await page.getByTestId('schema-initializer-Menu-header').hover();
    await page.getByRole('menuitem', { name: 'Link', exact: true }).click();
    await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').fill(pageLink);
    await page.getByLabel('block-item-URL').getByLabel('textbox').fill('baidu.com');
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByText(pageLink, { exact: true })).toBeVisible();

    // delete pages
    await deletePage(pageGroup);
    await deletePage(pageItem);
    await deletePage(pageLink);
  });

  test('sidebar', async ({ page, mockPage }) => {
    await mockPage(groupPageEmpty).goto();

    const pageGroupSide = uid();
    const pageItemSide = uid();
    const pageLinkSide = uid();

    // add group in side
    await page.getByTestId('schema-initializer-Menu-side').hover();
    await page.getByRole('menuitem', { name: 'Group', exact: true }).click();
    await page.getByRole('textbox').fill(pageGroupSide);
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByText(pageGroupSide, { exact: true })).toBeVisible();

    // add page in side
    await page.getByTestId('schema-initializer-Menu-side').hover();
    await page.getByRole('menuitem', { name: 'Page', exact: true }).click();
    await page.getByRole('textbox').fill(pageItemSide);
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByText(pageItemSide, { exact: true })).toBeVisible();

    // add link in side
    await page.getByTestId('schema-initializer-Menu-side').hover();
    await page.getByRole('menuitem', { name: 'Link', exact: true }).click();
    await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').fill(pageLinkSide);
    await page.getByLabel('block-item-URL').getByLabel('textbox').fill('/');
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByText(pageLinkSide, { exact: true })).toBeVisible();
  });

  test('link: use variable', async ({ page, deletePage }) => {
    await page.goto('/');
    const pageLink = uid();

    const token = await page.evaluate(() => {
      return window.localStorage.getItem('NOCOBASE_TOKEN');
    });

    // add link
    await page.getByTestId('schema-initializer-Menu-header').hover();
    await page.getByRole('menuitem', { name: 'Link', exact: true }).click();
    await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').fill(pageLink);
    await page.getByLabel('block-item-URL').getByLabel('textbox').fill('https://www.baidu.com');
    await page.getByRole('button', { name: 'plus Add parameter' }).click();
    await page.getByPlaceholder('Name').click();
    await page.getByPlaceholder('Name').fill('token');
    await page.getByLabel('block-item-ArrayItems-Search').getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'API token' }).click();
    await page.getByRole('button', { name: 'OK' }).click();

    // open link page
    await page.getByLabel(pageLink).click();
    await page.waitForTimeout(2000);

    // After clicking, it will redirect to another page, so we need to get the instance of the new page
    const newPage = page.context().pages()[1];
    expect(newPage.url()).toBe('https://www.baidu.com/?token=' + token);

    await deletePage(pageLink);
  });
});
