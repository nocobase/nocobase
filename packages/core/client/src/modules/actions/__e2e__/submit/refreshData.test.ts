/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { submitInReferenceTemplateBlock } from './templates';

test.describe('Submit: should refresh data after submit', () => {
  test('submit in reference template block', async ({ page, mockPage, clearBlockTemplates, mockRecord }) => {
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
});
