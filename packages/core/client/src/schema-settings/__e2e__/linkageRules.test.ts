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
  formFieldDependsOnSubtableFieldsWithLinkageRules,
  whenARequiredFieldIsSetToHideRetainValueItShouldBeAbleToSubmitTheFormNormally,
  whenClearingARelationshipFieldInASubtableTheCorrespondingCurrentObjectVariableShouldAlsoBeCleared,
  whenClearingARelationshipFieldTheValueOfTheAssociatedFieldShouldBeCleared,
  whenSetToHideRetainedValueItShouldNotImpactTheFieldSDefaultValueVariables,
} from './template';

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
    ).toHaveValue(String(calcResult(record)));

    // 5. 在子表格中新增并输入新的值，result 字段值会自动计算
    await page.getByLabel('action-AssociationField.').click();
    await page
      .getByRole('row', { name: `table-index-${record.subtable.length + 1} block-item-` })
      .getByRole('spinbutton')
      .first()
      .fill('10');
    await page
      .getByRole('row', { name: `table-index-${record.subtable.length + 1} block-item-` })
      .getByRole('spinbutton')
      .nth(1)
      .fill('10');
    await expect(
      page.getByLabel('block-item-CollectionField-test-form-test.result-result').getByRole('spinbutton'),
    ).toHaveValue(String(calcResult(record) + 10 * 10));
  });

  test("When set to 'Hide retained value', it should not impact the field's default value variables", async ({
    page,
    mockPage,
  }) => {
    await mockPage(whenSetToHideRetainedValueItShouldNotImpactTheFieldSDefaultValueVariables).goto();

    // 1. 给 Nickname 字段输入一个值，子表单中被隐藏的字段 title 的值应该为 Nickname 字段的值（因为其设置了默认值，其中使用了“当前表单”变量中 Nickname 字段的值）
    await page
      .getByRole('button', { name: 'block-item-CollectionField-users-form-users.nickname-Nickname' })
      .getByRole('textbox')
      .fill('123456789');

    // 2. 点击提交后，Roles 表格区块中应该显示刚才创建的 Role

    // 等待默认值生效
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: 'action-Action-Submit-submit-' }).click();
    await page.getByRole('button', { name: 'action-Action-Refresh-refresh' }).click();
    await expect(
      page.getByRole('button', { name: 'block-item-CardItem-roles-' }).getByRole('row', { name: '123456789' }),
    ).toBeVisible();
  });

  test('When a required field is set to "Hide (retain value)", it should be able to submit the form normally', async ({
    mockPage,
    page,
  }) => {
    await mockPage(whenARequiredFieldIsSetToHideRetainValueItShouldBeAbleToSubmitTheFormNormally).goto();

    // 1. 输入昵称
    await page
      .getByLabel('block-item-CollectionField-users-form-users.nickname-Nickname')
      .getByRole('textbox')
      .fill('123456');

    // 2. 点击提交
    await page.getByLabel('action-Action-Submit-submit-').click();

    // 3. 应该能正常提交，不应该被拦截
    await page.reload();
    await expect(
      page.getByLabel('block-item-CardItem-users-table').getByRole('cell', { name: '123456' }),
    ).toBeVisible();
  });

  test('When clearing a relationship field, the value of the associated field should be cleared', async ({
    page,
    mockPage,
  }) => {
    await mockPage(whenClearingARelationshipFieldTheValueOfTheAssociatedFieldShouldBeCleared).goto();

    // 1. 点击 Edit 按钮打开编辑表单弹窗
    await page.getByLabel('action-Action.Link-Edit-').click();

    // 2. 清空 roles 字段的值，nickname 字段的值应该被清空
    await page.getByTestId('select-object-multiple').hover();
    await page.getByLabel('icon-close-select').click();
    await expect(
      page
        .getByRole('button', { name: 'block-item-CollectionField-users-form-users.nickname-Nickname' })
        .getByRole('textbox'),
    ).toBeEmpty();
  });

  test('When clearing a relationship field in a subtable, the corresponding "current object" variable should also be cleared', async ({
    page,
    mockPage,
    mockRecord,
  }) => {
    await mockPage(
      whenClearingARelationshipFieldInASubtableTheCorrespondingCurrentObjectVariableShouldAlsoBeCleared,
    ).goto();
    const record = await mockRecord('test', 2);

    // 1. 打开弹窗
    await page.getByLabel('action-Action.Link-Edit-').click();

    // 2. 应该显示通过联动规则计算出来的值
    const value = record.user[0].roles.map((item) => item.name).join(',');
    await expect(page.getByRole('row', { name: 'table-index-1 block-item-' }).getByRole('textbox')).toHaveValue(value);

    // 3. 将子表格中第一行的 roles 字段清空，第一行的 Nickname 字段也应该被清空
    await page.getByRole('row', { name: 'table-index-1 block-item-' }).locator('.ant-select-selector').hover();
    await page.getByRole('row', { name: 'table-index-1 block-item-' }).getByLabel('icon-close-select').click();

    await expect(page.getByRole('row', { name: 'table-index-1 block-item-' }).getByRole('textbox')).toHaveValue('');
  });
});

function calcResult(record) {
  return record.subtable.reduce((acc, item) => acc + item.count * item.price, 0);
}
