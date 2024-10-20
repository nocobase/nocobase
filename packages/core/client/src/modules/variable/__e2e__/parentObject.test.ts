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
    await page.getByRole('button', { name: 'Add new' }).click();
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
});
