/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { ordinaryBlockTemplatesCannotBeUsedToCreateAssociationBlocksAndViceVersa } from './templatesOfBug';

test.skip('block template', () => {
  test('Ordinary block templates cannot be used to create association blocks, and vice versa', async ({
    page,
    mockPage,
    clearBlockTemplates,
  }) => {
    await mockPage(ordinaryBlockTemplatesCannotBeUsedToCreateAssociationBlocksAndViceVersa).goto();

    // ensure the block templates are cleared at the end of the test
    await clearBlockTemplates();

    // Save the table block on the page as a template -------------------------------------------
    await page.getByLabel('block-item-CardItem-roles-').hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:table-roles').hover();
    await page.getByRole('menuitem', { name: 'Save as template' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // The template saved above cannot be used to create a association block.
    await page.getByLabel('action-Action.Link-View-view-').click();
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'Table right' }).hover();
    await page.getByRole('menuitem', { name: 'Associated records right' }).hover();

    // The saved template should not be displayed (no arrow should be shown)
    await expect(page.getByRole('menuitem', { name: 'Roles' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Roles right' })).not.toBeVisible();

    // but can be used to create an other blocks by the "Other record" option
    await page.getByRole('menuitem', { name: 'Other records right' }).hover();
    await page.getByRole('menuitem', { name: 'Roles right' }).hover();
    await page.getByRole('menuitem', { name: 'Duplicate template right' }).hover();
    await expect(page.getByRole('menuitem', { name: 'Roles_Table' })).toBeVisible();
    await page.mouse.move(300, 0);

    // Save the details block on the drawer as a template -------------------------------------------
    await page.getByLabel('block-item-CardItem-roles-details').hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:detailsWithPagination-roles').hover();
    await page.getByRole('menuitem', { name: 'Save as template' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.mouse.move(300, 0);
    // make more stable
    await page.waitForTimeout(500);

    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'Details right' }).hover();
    await page.getByRole('menuitem', { name: 'Associated records right' }).hover();
    await page.getByRole('menuitem', { name: 'Roles right' }).hover();
    await page.getByRole('menuitem', { name: 'Duplicate template right' }).hover();
    await expect(page.getByRole('menuitem', { name: 'Roles_Details' })).toBeVisible();
    await page.mouse.move(300, 0);

    // Save the association block on the drawer as a template -------------------------------------------
    await page
      .getByTestId('drawer-Action.Container-users-View record')
      .getByLabel('block-item-CardItem-roles-table')
      .hover();
    await page
      .getByTestId('drawer-Action.Container-users-View record')
      .getByLabel('designer-schema-settings-CardItem-blockSettings:table-roles')
      .hover();
    await page.getByRole('menuitem', { name: 'Save as template' }).click();
    await page.getByLabel('Save as template').getByRole('textbox').fill('association_block');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // close the drawer
    await page.getByLabel('drawer-Action.Container-users-View record-mask').click();

    // The template saved above cannot be used to create a non-association block.
    await page.getByLabel('schema-initializer-Grid-page:').hover();
    await page.getByRole('menuitem', { name: 'Table right' }).hover();
    await page.getByRole('menuitem', { name: 'Roles right' }).hover();
    await page.getByRole('menuitem', { name: 'Duplicate template right' }).hover();
    await expect(page.getByRole('menuitem', { name: 'Roles_Table' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'association_block' })).not.toBeVisible();
    await page.mouse.move(300, 0);

    // Click on the association field to open the drawer --------------------------------------
    await page.getByText('member').click();
    await page.getByLabel('block-item-CardItem-roles-details').hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:details-roles').hover();
    await page.getByRole('menuitem', { name: 'Save as block template' }).click();
    await page.getByRole('textbox').fill('association_block_detail_item');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'Details right' }).hover();
    await page.getByRole('menuitem', { name: 'Current record right' }).hover();
    await page.getByRole('menuitem', { name: 'Duplicate template right' }).hover();
    await expect(page.getByRole('menuitem', { name: 'association_block_detail_item' })).toBeVisible();
    await page.mouse.move(300, 0);
  });
});
