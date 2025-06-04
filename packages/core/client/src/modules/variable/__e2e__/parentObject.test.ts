/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { inDefaultValue } from './templates';

test.describe('variable: parent object', () => {
  test('in default value', async ({ page, mockPage }) => {
    await mockPage(inDefaultValue).goto();

    // 1. 在当前表单中的子表单中，使用 “当前表单” 变量为 text2 字段设置默认值
    await page.getByLabel('block-item-CollectionField-collection2-form-collection2.text2-text2').hover();
    await page
      .getByLabel('designer-schema-settings-CollectionField-fieldSettings:FormItem-collection2-collection2.text2', {
        exact: true,
      })
      .hover();
    await page.getByRole('menuitem', { name: 'Set default value' }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Current form right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'text1' }).click();
    await page.getByRole('button', { name: 'OK' }).click();

    // 2. 在子表单中的子表格中，使用 “上级对象” 变量为 text3 字段设置默认值
    await page.getByRole('button', { name: 'text3' }).click();
    await page.getByLabel('designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-collection3').click();
    await page.getByRole('menuitem', { name: 'Set default value' }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Parent object right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'text2' }).click();
    await page.getByRole('button', { name: 'OK' }).click();

    // 3. 当更改当前表单中的 text1 字段后，text2 和 text3 字段应该也会被自动更改
    await page.locator('.nb-sub-table-addNew').click();
    await page
      .getByLabel('block-item-CollectionField-collection1-form-collection1.text1-text1')
      .getByRole('textbox')
      .fill('123456abcdefg');
    await expect(
      page.getByLabel('block-item-CollectionField-collection2-form-collection2.text2-text2').getByRole('textbox'),
    ).toHaveValue('123456abcdefg');
    await expect(
      page.getByLabel('block-item-CollectionField-collection2-form-collection2.m2m2-m2m2').getByRole('textbox'),
    ).toHaveValue('123456abcdefg');
  });

  test('in linkage rules', async ({ page, mockPage }) => {
    await mockPage(inDefaultValue).goto();

    // 1. Use "Current form" and "Parent object" variables in nested subforms and subtables
    await page.getByLabel('block-item-CollectionField-collection1-form-collection1.m2m1-m2m1').hover();
    await page.getByRole('menuitem', { name: 'Linkage rules' }).waitFor({ state: 'detached' });
    await page
      .getByLabel('designer-schema-settings-CollectionField-fieldSettings:FormItem-collection1-collection1.m2m1', {
        exact: true,
      })
      .hover();
    await page.getByRole('menuitem', { name: 'Linkage rules' }).click();
    await page.getByRole('button', { name: 'plus Add linkage rule' }).click();
    await page.getByText('Add property').click();
    await page.getByTestId('select-linkage-property-field').click();
    await page.getByTitle('text2').click();
    await page.getByTestId('select-linkage-action-field').click();
    await page.getByRole('option', { name: 'Value', exact: true }).click();
    await page.getByTestId('select-linkage-value-type').click();
    await page.getByTitle('Expression').click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Current form right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'text1' }).click();
    await page.getByRole('button', { name: 'OK' }).click();

    await page.getByLabel('block-item-CollectionField-collection2-form-collection2.m2m2-m2m2').hover();
    await page
      .getByLabel('designer-schema-settings-CollectionField-fieldSettings:FormItem-collection2-collection2.m2m2', {
        exact: true,
      })
      .hover();
    await page.getByRole('menuitem', { name: 'Linkage rules' }).click();
    await page.getByRole('button', { name: 'plus Add linkage rule' }).click();
    await page.getByText('Add property').click();
    await page.getByTestId('select-linkage-property-field').click();
    await page.getByTitle('text3').click();
    await page.getByTestId('select-linkage-action-field').click();
    await page.getByRole('option', { name: 'Value', exact: true }).click();
    await page.getByTestId('select-linkage-value-type').click();
    await page.getByTitle('Expression').click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Parent object right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'text2' }).click();
    await page.getByRole('button', { name: 'OK' }).click();

    // 2. Assert: When the text1 field in the current form is changed, the text2 and text3 fields should also be automatically changed
    await page.locator('.nb-sub-table-addNew').click();
    await page
      .getByLabel('block-item-CollectionField-collection1-form-collection1.text1-text1')
      .getByRole('textbox')
      .fill('123456abcdefg');

    await expect(
      page.getByLabel('block-item-CollectionField-collection2-form-collection2.text2-text2').getByRole('textbox'),
    ).toHaveValue('123456abcdefg');
    await expect(
      page.getByLabel('block-item-CollectionField-collection2-form-collection2.m2m2-m2m2').getByRole('textbox'),
    ).toHaveValue('123456abcdefg');

    // 3. Test if the "Current object" variable can be used normally in the subform
    await page.getByLabel('schema-initializer-Grid-form:configureFields-collection2').hover();
    await page.getByRole('menuitem', { name: 'form Add Markdown' }).click();
    await page.getByLabel('block-item-Markdown.Void-').hover();
    await page.getByLabel('designer-schema-settings-Markdown.Void-blockSettings:markdown-collection2').hover();
    await page.getByRole('menuitem', { name: 'Edit markdown' }).click();
    await page.getByText('This is a demo text, **').click();
    await page.getByText('This is a demo text, **').clear();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Current object right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'text2' }).click();
    await page.getByRole('button', { name: 'Save' }).click();

    await page
      .getByLabel('block-item-CollectionField-collection2-form-collection2.text2-text2')
      .getByRole('textbox')
      .fill('987654321');

    // 4. Assert: The subtable and Markdown should be updated in real-time
    await expect(
      page.getByLabel('block-item-CollectionField-collection2-form-collection2.m2m2-m2m2').getByRole('textbox'),
    ).toHaveValue('987654321');
    // await expect(page.getByLabel('block-item-Markdown.Void-')).toHaveText('987654321');
  });
});
