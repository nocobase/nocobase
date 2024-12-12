/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { formFieldDependsOnSubtableFieldsWithLinkageRules } from './template';

test.describe('linkage rules', () => {
  test('form field depends on subtable fields with linkage rules', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(formFieldDependsOnSubtableFieldsWithLinkageRules).waitForInit();
    const record = await mockRecord('test');
    await nocoPage.goto();

    // 1. 点击 Add new，打开新增表单弹窗
    await page.getByLabel('action-Action-Add new-create-').click();

    // 2. 新增表单中，填上子表单的值，result 会自动计算结果
    await page.getByLabel('action-AssociationField.').click();
    await page.getByLabel('block-item-CollectionField-A-form-A.count-count').getByRole('spinbutton').fill('10');
    await page.getByLabel('block-item-CollectionField-A-form-A.price-price').getByRole('spinbutton').fill('10');
    // 10 * 10 = 100
    await expect(
      page.getByLabel('block-item-CollectionField-test-form-test.result-result').getByRole('spinbutton'),
    ).toHaveValue('100');

    // 3. 关闭弹窗，点击 Edit 按钮打开编辑表单弹窗
    await page.getByLabel('drawer-Action.Container-test-Add record-mask').click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.getByLabel('action-Action.Link-Edit-').click();

    // 4. 编辑表单中的 result 字段值，应该是由子表格中填入的值计算得出的
    await expect(
      page.getByLabel('block-item-CollectionField-test-form-test.result-result').getByRole('spinbutton'),
    ).toHaveValue(calcResult(record));

    // 5. 在子表格中新增并输入新的值，result 字段值会自动计算
    await page.getByLabel('action-AssociationField.').click();
    await page.getByRole('row', { name: 'table-index-3 block-item-' }).getByRole('spinbutton').first().fill('10');
    await page.getByRole('row', { name: 'table-index-3 block-item-' }).getByRole('spinbutton').nth(1).fill('10');
    await expect(
      page.getByLabel('block-item-CollectionField-test-form-test.result-result').getByRole('spinbutton'),
    ).toHaveValue(calcResult(record) + 10 * 10);
  });
});

function calcResult(record) {
  return record.subtable.reduce((acc, item) => acc + item.count * item.price, 0);
}
