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
  PopupAndSubPageWithParams,
  URLSearchParamsUseAssociationFieldValue,
  oneEmptyTableWithUsers,
  openInNewWidow,
} from './templates';

test.describe('Link', () => {
  test('basic', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneEmptyTableWithUsers).waitForInit();
    const users = await mockRecords('users', 2, 0);
    await nocoPage.goto();

    // 1. create a new Link button
    await page.getByRole('button', { name: 'Actions', exact: true }).hover();
    await page.getByLabel('designer-schema-initializer-TableV2.Column-TableV2.ActionColumnDesigner-users').hover();
    await page.getByRole('menuitem', { name: 'Link' }).click();

    // 2. config the Link button
    await page.getByLabel('action-Action.Link-Link-customize:link-users-table-0').hover();
    await expect(
      page.getByRole('button', { name: 'designer-schema-settings-Action.Link-actionSettings:link-users' }),
    ).toHaveCount(1);
    await page
      .getByRole('button', { name: 'designer-schema-settings-Action.Link-actionSettings:link-users' })
      .first()
      .hover();
    await page.getByLabel('designer-schema-settings-Action.Link-actionSettings:link-users').first().hover();
    await page.getByRole('menuitem', { name: 'Edit link' }).click();
    await page.getByLabel('block-item-users-table-URL').getByLabel('textbox').click();
    await page
      .getByLabel('block-item-users-table-URL')
      .getByLabel('textbox')
      .fill(await nocoPage.getUrl());
    await page.getByPlaceholder('Name').fill('id');
    await page.getByLabel('block-item-ArrayItems-users-').getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Current record right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
    await page.getByRole('button', { name: 'plus Add parameter' }).click();
    await page.getByPlaceholder('Name').nth(1).fill('name');
    await page.getByLabel('variable-button').nth(2).click();
    await page.getByRole('menuitemcheckbox', { name: 'Current record right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Username' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 3. click the Link button then config data scope for the Table block using "URL search params" variable
    await page.getByLabel('action-Action.Link-Link-customize:link-users-table-0').click();
    await page.getByLabel('block-item-CardItem-users-').hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:table-users').hover();
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
    await page.getByTestId('select-filter-operator').click();
    await page.getByRole('option', { name: 'is not' }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'URL search params right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'id', exact: true }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByRole('button', { name: 'nocobase', exact: true })).not.toBeVisible();
    await expect(page.getByRole('button', { name: users[0].username, exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: users[1].username, exact: true })).toBeVisible();

    // 4. click the Link button，check the data of the table block
    await page.getByLabel('action-Action.Link-Link-customize:link-users-table-1').click();
    await expect(page.getByRole('button', { name: users[1].username, exact: true })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'nocobase', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: users[0].username, exact: true })).toBeVisible();

    // 5. Change the operator of the data scope from "is not" to "is"
    await page.getByLabel('block-item-CardItem-users-').hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:table-users').hover();
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await page.getByTestId('select-filter-operator').click();
    await page.getByRole('option', { name: 'is', exact: true }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'URL search params right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'id', exact: true }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByRole('button', { name: users[1].username, exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'nocobase', exact: true })).not.toBeVisible();
    await expect(page.getByRole('button', { name: users[0].username, exact: true })).not.toBeVisible();

    // 6. Re-enter the page (to eliminate the query string in the URL), at this time the value of the variable is undefined, and all data should be displayed
    await nocoPage.goto();
    await expect(page.getByRole('button', { name: users[1].username, exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'nocobase', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: users[0].username, exact: true })).toBeVisible();
  });

  test('open in new window', async ({ page, mockPage, mockRecords }) => {
    await mockPage(openInNewWidow).goto();
    const otherPage = mockPage();
    const otherPageUrl = await otherPage.getUrl();

    // 默认情况下，点击链接按钮会在当前窗口打开
    await page.getByLabel('action-Action.Link-Link-').hover();
    await page.getByLabel('designer-schema-settings-Action.Link-actionSettings:link-users').hover();
    await page.getByRole('menuitem', { name: 'Edit link' }).click();
    await page.getByLabel('block-item-users-table-URL').getByLabel('textbox').fill(otherPageUrl);
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await page.getByLabel('action-Action.Link-Link-').first().click();
    expect(page.url().endsWith(otherPageUrl)).toBe(true);

    // 开启 “Open in new window” 选项后，点击链接按钮会在新窗口打开
    await page.goBack();
    await page.getByLabel('action-Action.Link-Link-').hover();
    await page.getByLabel('designer-schema-settings-Action.Link-actionSettings:link-users').hover();
    await page.getByRole('menuitem', { name: 'Edit link' }).click();
    await page.getByLabel('Open in new window').check();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await page.getByLabel('action-Action.Link-Link-').click();
    await page.waitForTimeout(1000);

    const newPage = page.context().pages()[1];
    expect(newPage.url().endsWith(otherPageUrl)).toBe(true);
  });

  test('popup and sub page with search params', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = mockPage(PopupAndSubPageWithParams);
    const url = await nocoPage.getUrl();
    await page.goto(url + '?name=abc');

    // open popup with drawer mode
    await page.getByLabel('action-Action.Link-View-view-').click();
    await expect(page.getByLabel('block-item-CollectionField-').getByRole('textbox')).toHaveValue('abc');

    await page.reload();
    await expect(page.getByLabel('block-item-CollectionField-').getByRole('textbox')).toHaveValue('abc');

    await page.goBack();
    await page.getByLabel('action-Action.Link-View-view-').hover();
    await page.getByLabel('designer-schema-settings-Action.Link-actionSettings:view-users').hover();
    await page.getByRole('menuitem', { name: 'Open mode Drawer' }).click();
    await page.getByRole('option', { name: 'Page' }).click();

    // open sub page with page mode
    await page.getByLabel('action-Action.Link-View-view-').click();
    await expect(page.getByLabel('block-item-CollectionField-').getByRole('textbox')).toHaveValue('abc');

    await page.reload();
    await expect(page.getByLabel('block-item-CollectionField-').getByRole('textbox')).toHaveValue('abc');
  });

  test('URL search params: use association field value', async ({ page, mockPage, mockRecords }) => {
    await mockPage(URLSearchParamsUseAssociationFieldValue).goto();

    // After clicking the Link button, the browser URL will change, and the value of the input box using variables will be updated
    await page.getByLabel('action-Action.Link-Link-').click();
    await page.waitForTimeout(100);
    await expect(page.getByLabel('block-item-CollectionField-')).toContainText(`Roles:adminmemberroot`);
  });
});
