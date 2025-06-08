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
  createFormSubmit,
  shouldRefreshDataWhenSubpageIsClosedByPageMenu,
  submitInReferenceTemplateBlock,
} from './templates';

test.describe('Submit: should refresh data after submit', () => {
  test.skip('submit in reference template block', async ({ page, mockPage, clearBlockTemplates, mockRecord }) => {
    const nocoPage = await mockPage(submitInReferenceTemplateBlock).waitForInit();
    await mockRecord('collection', { nickname: 'abc' });
    await nocoPage.goto();

    await clearBlockTemplates();

    // 1. save a form as a reference template block
    await page.getByLabel('block-item-CardItem-collection-form').hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:createForm-collection').hover();
    await page.getByRole('menuitem', { name: 'Save as block template' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 2. click the "View" button to open subpage, and then click the "Edit" button to open the drawer
    await page.getByLabel('action-Action.Link-View-view-').click();
    await page.getByLabel('action-Action-Edit-update-').click();

    // 3. in the drawer, use the reference template block to create a new form block
    await page
      .getByTestId('drawer-Action.Container-collection-Edit record')
      .getByLabel('schema-initializer-Grid-popup')
      .hover();
    await page.getByRole('menuitem', { name: 'form Form (Edit) right' }).hover();
    await page.getByRole('menuitem', { name: 'Reference template right' }).hover();
    await page.getByRole('menuitem', { name: 'collection_Form (Fields only)' }).click();
    await page
      .getByTestId('drawer-Action.Container-collection-Edit record')
      .getByLabel('schema-initializer-ActionBar-')
      .hover();
    await page.getByRole('menuitem', { name: 'Submit' }).click();

    // 4. change the value of "user name" field, and then click the "Submit" button
    await page.getByTestId('drawer-Action.Container-collection-Edit record').getByRole('textbox').fill('abc123');
    await page
      .getByTestId('drawer-Action.Container-collection-Edit record')
      .getByLabel('action-Action-Submit-submit-')
      .click();

    // expect: the data in the subpage should be refreshed
    await expect(
      page.getByLabel('block-item-CollectionField-collection-details-collection.nickname-Nickname').getByText('abc123'),
    ).toBeVisible();

    // 5. go back the main page, and expect: the data in the main page should be refreshed
    await page.getByLabel('back-button').click();
    await expect(
      page.getByLabel('block-item-CardItem-collection-table').getByRole('button', { name: 'abc123' }),
    ).toBeVisible();

    // open the drawer, and then reload the page, and then repeat the above steps from step 4
    await page.getByLabel('action-Action.Link-View-view-').click();
    await page.getByLabel('action-Action-Edit-update-').click();
    await page.reload();

    // change the value of "user name" field, and then click the "Submit" button
    await page.getByTestId('drawer-Action.Container-collection-Edit record').getByRole('textbox').fill('abc456');
    await page
      .getByTestId('drawer-Action.Container-collection-Edit record')
      .getByLabel('action-Action-Submit-submit-')
      .click();

    // expect: the data in the subpage should be refreshed
    await expect(
      page.getByLabel('block-item-CollectionField-collection-details-collection.nickname-Nickname').getByText('abc456'),
    ).toBeVisible();

    // go back the main page, and expect: the data in the main page should be refreshed
    await page.getByLabel('back-button').click();
    await expect(
      page.getByLabel('block-item-CardItem-collection-table').getByRole('button', { name: 'abc456' }),
    ).toBeVisible();
  });

  test('should refresh data when subpage is closed by page menu', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(shouldRefreshDataWhenSubpageIsClosedByPageMenu).waitForInit();
    await mockRecord('testRefresh', { name: 'abcdefg' });
    await nocoPage.goto();
    const pageUid = await nocoPage.getUid();

    // 1. Initially, there should be a row with "abcdefg" on the page
    await expect(page.getByRole('button', { name: 'abcdefg', exact: true })).toBeVisible();

    // 2. Click the "Edit" button to open the subpage
    await page.getByLabel('action-Action.Link-Edit-').click();

    // 3. On the subpage, open a popup, fill out the form, and submit
    await page.getByLabel('Edit', { exact: true }).getByLabel('action-Action.Link-Edit-').click();
    await page.getByLabel('block-item-CollectionField-').getByRole('textbox').fill('1234567890');
    await page.getByLabel('action-Action-Submit-submit-').click();

    // 4. Close the subpage by clicking on the menu at the top of the page
    await page.getByLabel(pageUid).click();

    // 5. The data in the block on the page should be up-to-date
    await expect(page.getByRole('button', { name: '1234567890', exact: true })).toBeVisible();
  });
});

test.describe('Submit: After successful submission', () => {
  test('return to the previous popup or page as default value', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(createFormSubmit).waitForInit();
    await nocoPage.goto();

    await page.getByLabel('action-Action-Add new-create-').click();
    await page.getByLabel('action-Action-Submit-submit-').click();
    await expect(page.getByTestId('drawer-Action.Container-users-Add record')).not.toBeVisible();
  });

  test('return to the previous popup or page change to stay on the current popup or page', async ({
    page,
    mockPage,
    mockRecord,
  }) => {
    const nocoPage = await mockPage(createFormSubmit).waitForInit();
    await nocoPage.goto();

    await page.getByLabel('action-Action-Add new-create-').click();

    await page.getByLabel('action-Action-Submit-submit-').hover();
    await page.getByLabel('designer-schema-settings-Action-actionSettings:createSubmit-users').hover();

    await page.getByText('After successful submission').click();
    await page.getByLabel('Stay on the current popup or').check();
    await page.getByRole('button', { name: 'OK' }).click();
    await page.getByLabel('action-Action-Submit-submit-').click();
    await expect(page.getByTestId('drawer-Action.Container-users-Add record')).toBeVisible();
  });
});
