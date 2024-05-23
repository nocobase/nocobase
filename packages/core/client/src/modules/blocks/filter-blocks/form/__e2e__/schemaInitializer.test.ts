/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Page, createBlockInPage, expect, oneEmptyFilterFormBlock, test } from '@nocobase/test/e2e';
import { oneFilterFormWithInherit } from './templatesOfBug';

const deleteButton = async (page: Page, name: string) => {
  await page.getByLabel(`action-Action-${name}-`).hover();
  await page.getByLabel(`action-Action-${name}-`).getByLabel('designer-schema-settings-').hover();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'OK', exact: true }).click();
};

test.describe('where filter form block can be added', () => {
  test('page', async ({ page, mockPage }) => {
    await mockPage().goto();

    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await createBlockInPage(page, 'Filter form');
    await expect(page.getByLabel('block-item-CardItem-users-filter-form')).toBeVisible();
  });
});

test.describe('configure fields', () => {
  test('display collection fields & display association fields & add text', async ({ page, mockPage }) => {
    await mockPage(oneEmptyFilterFormBlock).goto();

    const formItemInitializer = page.getByLabel('schema-initializer-Grid-filterForm:configureFields-general');

    // add fields
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-filter-form-general.id-ID')).toBeVisible();

    // delete fields
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-filter-form-general.id-ID')).not.toBeVisible();

    // add association fields
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(
      page.getByLabel('block-item-CollectionField-general-filter-form-general.manyToOne.nickname'),
    ).toBeVisible();

    // delete association fields
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(
      page.getByLabel('block-item-CollectionField-general-filter-form-general.manyToOne.nickname'),
    ).not.toBeVisible();

    // add text
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'Add text' }).click();

    await expect(page.getByLabel('block-item-Markdown.Void-general-filter-form')).toBeVisible();
  });

  test.pgOnly('display inherit fields', async ({ page, mockPage }) => {
    await mockPage(oneFilterFormWithInherit).goto();

    // 选择继承的字段
    await page.getByLabel('schema-initializer-Grid-filterForm:configureFields-child').hover();
    await page.getByRole('menuitem', { name: 'parentField1' }).click();
    await page.getByRole('menuitem', { name: 'parentField2' }).click();
    await page.mouse.move(300, 0);
    await expect(
      page
        .getByLabel('block-item-CollectionField-child-filter-form-child.parentField1-parentField1')
        .getByRole('textbox'),
    ).toBeVisible();
    await expect(
      page
        .getByLabel('block-item-CollectionField-child-filter-form-child.parentField2-parentField2')
        .getByRole('textbox'),
    ).toBeVisible();
  });
});

test.describe('configure actions', () => {
  test('filter & reset', async ({ page, mockPage }) => {
    await mockPage(oneEmptyFilterFormBlock).goto();

    await page.getByLabel('schema-initializer-ActionBar-filterForm:configureActions-general').hover();
    await page.getByRole('menuitem', { name: 'Filter' }).click();
    await page.getByRole('menuitem', { name: 'Reset' }).click();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action-Filter-submit-general-filter-form')).toBeVisible();
    await expect(page.getByLabel('action-Action-Reset-general-filter-form')).toBeVisible();

    // delete buttons
    await deleteButton(page, 'Filter');
    await deleteButton(page, 'Reset');
    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action-Filter-submit-general-filter-form')).not.toBeVisible();
    await expect(page.getByLabel('action-Action-Reset-general-filter-form')).not.toBeVisible();
  });
});
