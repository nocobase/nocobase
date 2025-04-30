/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { NocoPage, Page, expect, oneEmptyTableBlockWithActions, test } from '@nocobase/test/e2e';

test.describe('tabs schema settings', () => {
  let commonPage: NocoPage;
  let commonPageUrl: string;

  test.beforeAll(async ({ mockManualDestroyPage }) => {
    commonPage = await mockManualDestroyPage(oneEmptyTableBlockWithActions).waitForInit();
    commonPageUrl = await commonPage.getUrl();
  });

  test.afterAll(async () => {
    await commonPage.destroy();
  });

  async function showSettings(page: Page) {
    await page.getByTestId('drawer-Action.Container-general-Add record').getByText('Add new').hover();
    await page.getByLabel('designer-schema-settings-Tabs.TabPane-Tabs.Designer-general').hover();
  }

  test('edit', async ({ page }) => {
    await page.goto(commonPageUrl);
    await page.getByRole('button', { name: 'Add new' }).click();

    // There will be a prompt at the top, wait for it to disappear
    await page.waitForTimeout(1000);

    await showSettings(page);
    await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('block-item-Input-general-').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-general-').getByRole('textbox').fill('Add new with new name');
    await page.getByRole('button', { name: 'Select icon' }).click();
    await page.getByLabel('account-book').locator('svg').click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await expect(page.getByText('Add new with new name')).toBeVisible();
    await expect(page.getByLabel('account-book').locator('svg')).toHaveCount(1);
    await expect(page.getByLabel('account-book').locator('svg')).toBeVisible();
  });

  test('delete', async ({ page }) => {
    await page.goto(commonPageUrl);
    await page.getByRole('button', { name: 'Add new' }).click();

    // There will be a prompt at the top, wait for it to disappear
    await page.waitForTimeout(1000);

    await showSettings(page);
    await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await expect(page.getByTestId('drawer-Action.Container-general-Add record').getByText('Add new')).toBeHidden();
  });
});
