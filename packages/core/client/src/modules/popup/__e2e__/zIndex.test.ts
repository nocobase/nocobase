/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { T2797, T2838, zIndexOfSubpage } from './templatesOfBug';

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
});
