/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { T2797, T2838, zIndexEditProfile, zIndexOfSubpage } from './templatesOfBug';

test.describe('z-index of dialog', () => {
  test('edit block title', async ({ page, mockPage }) => {
    await mockPage(T2797).goto();

    await page.getByLabel('action-Action.Link-Popup').click();
    await page.getByLabel('action-Action-Popup drawer-').click();
    await page.getByText('UsersConfigure fieldsSubmitConfigure actions').hover();
    await page.getByRole('button', { name: 'designer-schema-settings-' }).hover();
    await page.getByRole('menuitem', { name: 'Edit block title' }).click();

    await expect(page.getByLabel('block-item-Input-users-form-')).toBeVisible();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByLabel('block-item-Input-users-Block')).not.toBeVisible();
  });

  test('multilevel modal', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(T2838).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await page.getByLabel('action-Action.Link-Edit').click();
    await page.getByLabel('action-Action-Edit button 1-').click();
    await page.getByLabel('action-Action-Edit button 2-').click();
    await expect(page.getByLabel('block-item-CollectionField-')).toBeVisible();
    await page.getByLabel('action-Action-Submit-submit-').click();
    await expect(page.getByLabel('block-item-CollectionField-')).not.toBeVisible();
  });

  test('z-index of subpage', async ({ page, mockPage }) => {
    await mockPage(zIndexOfSubpage).goto();

    // 1. Open the "Assign field values" popup in the subpage, it should be displayed on the top layer
    await page.getByText('open subpage level1').click();
    await page.getByLabel('action-Action-Submit-submit-').hover();
    await page.getByLabel('designer-schema-settings-Action-actionSettings:updateSubmit-users').hover();
    await page.getByRole('menuitem', { name: 'Assign field values' }).click();
    await expect(page.getByRole('dialog').getByText('Assign field values')).toBeVisible();
    // If the click is ineffective, it means the popup is not displayed on the top layer
    await page.getByRole('button', { name: 'Cancel' }).click({ timeout: 1000 });
    await expect(page.getByRole('dialog').getByText('Assign field values')).not.toBeVisible();
  });

  test('Users & Permissions', async ({ page }) => {
    await page.goto('/admin/settings/users-permissions/roles');

    // Data source
    await page.getByRole('tab', { name: 'Data sources' }).click();
    await page.getByLabel('action-Action.Link-Configure-').click();
    await page.getByRole('tab', { name: 'Action permissions', exact: true }).click();
    await page.getByLabel('action-Action.Link-Configure-dataSourcesCollections-users', { exact: true }).click();
    await page.getByLabel('Individual').check();
    await page
      .getByTestId('drawer-Action.Drawer-dataSourcesCollections-Configure permission')
      .getByRole('cell')
      .locator('.ant-select-selector')
      .first()
      .click();
    await page
      .getByTestId('drawer-RecordPicker.Selector-dataSourcesCollections-Select record')
      .getByLabel('action-Action-Add new-create-')
      .click();
    await expect(page.getByText('Add condition', { exact: true })).toBeVisible();
  });

  test('edit profile', async ({ page, mockPage }) => {
    await mockPage(zIndexEditProfile).goto();

    // open subpage, and then open the Edit Profile drawer
    await page.getByLabel('action-Action.Link-open').click();
    await page.getByTestId('user-center-button').hover();
    await page.getByRole('menuitem', { name: 'Edit profile' }).click();
    await expect(page.getByTestId('drawer-Action.Drawer-Edit profile')).toBeVisible();

    // click the Cancel button to close the drawer
    await page.getByLabel('drawer-Action.Drawer-Edit profile-mask').click();
    await expect(page.getByTestId('drawer-Action.Drawer-Edit profile')).not.toBeVisible();
  });

  test('change password', async ({ page, mockPage }) => {
    await mockPage(zIndexEditProfile).goto();

    // open subpage, and then open the Change password drawer
    await page.getByLabel('action-Action.Link-open').click();
    await page.getByTestId('user-center-button').hover();
    await page.getByRole('menuitem', { name: 'Change password' }).click();
    await expect(page.getByTestId('drawer-Action.Drawer-Change password')).toBeVisible();

    // click the Cancel button to close the drawer
    await page.getByLabel('action-Action-Cancel').click();
    await expect(page.getByTestId('drawer-Action.Drawer-Change password')).not.toBeVisible();
  });
});
