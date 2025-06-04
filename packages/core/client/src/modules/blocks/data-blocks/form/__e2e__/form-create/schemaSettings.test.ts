/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  expect,
  expectSettingsMenu,
  expectSupportedVariables,
  oneEmptyFormWithActions,
  oneTableBlockWithAddNewAndViewAndEditAndAssociationFields,
  oneTableBlockWithAddNewAndViewAndEditAndBasicFields,
  test,
} from '@nocobase/test/e2e';
import { oneEmptyTableWithUsers } from '../../../details-multi/__e2e__/templatesOfBug';
import {
  T2174,
  T3871,
  currentPopupRecordInPopupThatOpenedByAssociationField,
  oneFormAndOneTableWithUsers,
  oneTableWithNestPopups,
  parentPopupRecordInSubPageTheFirstLevelIsASubpageAndTheSecondLevelIsAPopup,
  parentPopupRecordInSubPageTheFirstLevelIsASubpageAndTheSecondLevelIsASubpageToo,
} from './templatesOfBug';

test.describe('set default value', () => {
  test('basic fields', async ({ page, mockPage }) => {
    await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).goto();

    const openDialog = async (fieldName: string) => {
      await page.getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`).hover();
      await page
        .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`)
        .hover();
      await page.getByRole('menuitem', { name: 'Set default value', exact: true }).click();
    };

    await page.getByRole('button', { name: 'Add new' }).click();
    await openDialog('singleLineText');
    await page.getByLabel('Set default value').getByRole('textbox').click();
    await page.getByLabel('Set default value').getByRole('textbox').fill('test default value');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 关闭弹窗在打开，应该显示默认值
    await page.getByLabel('drawer-Action.Container-general-Add record-mask').click();
    await page.getByRole('button', { name: 'Add new' }).click();
    await expect(
      page
        .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
        .getByRole('textbox'),
    ).toHaveValue('test default value');

    // 为 longText 设置一个变量默认值: {{ currentForm.singleLineText }}
    await openDialog('longText');
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Current form' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'singleLineText' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await page.getByLabel('drawer-Action.Container-general-Add record-mask').click();
    await page.getByRole('button', { name: 'Add new' }).click();
    // 值应该和 singleLineText 一致
    await expect(
      page.getByLabel('block-item-CollectionField-general-form-general.longText-longText').getByRole('textbox'),
    ).toHaveValue('test default value');

    // 更改变量的值，longText 的值也应该跟着变化
    await page
      .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
      .getByRole('textbox')
      .fill('new value');
    await expect(
      page.getByLabel('block-item-CollectionField-general-form-general.longText-longText').getByRole('textbox'),
    ).toHaveValue('new value');

    // 再次打开设置默认值的弹窗，变量输入框应该显示设置的变量值
    await openDialog('longText');
    await expect(page.getByLabel('block-item-VariableInput-')).toHaveText(/Current form \/ singleLineText/);
  });

  test('subform: basic fields', async ({ page, mockPage }) => {
    await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).goto();

    await page.getByRole('button', { name: 'Add new' }).click();

    // 先切换为子表单
    await page.getByLabel('block-item-CollectionField-general-form-general.manyToOne-manyToOne').hover();
    await page
      .getByLabel('designer-schema-settings-CollectionField-FormItem.Designer-general-general.manyToOne')
      .hover();
    await page.getByRole('menuitem', { name: 'Field component' }).click();
    await page.getByRole('option', { name: 'Sub-form', exact: true }).click();

    // 关闭下拉菜单
    await page.getByLabel('block-item-CollectionField-general-form-general.manyToOne-manyToOne').hover();
    await page
      .getByLabel('designer-schema-settings-CollectionField-FormItem.Designer-general-general.manyToOne')
      .hover();
    await page.mouse.move(100, 0);

    await page.getByLabel('schema-initializer-Grid-form:configureFields-users').hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await page.getByRole('menuitem', { name: 'Username' }).click();

    // 子表单状态下，没有默认值选项
    await page.getByLabel('block-item-CollectionField-general-form-general.manyToOne-manyToOne').hover();
    await expect(page.getByRole('menuitem', { name: 'Set default value' })).not.toBeVisible();

    // 测试子表单字段默认值 ------------------------------------------------------------------------------------------
    await page.getByLabel(`block-item-CollectionField-users-form-users.nickname-Nickname`).hover();
    await page
      .getByLabel(`designer-schema-settings-CollectionField-fieldSettings:FormItem-users-users.Nickname`)
      .hover();
    await page.getByRole('menuitem', { name: 'Set default value', exact: true }).click();
    await page.getByLabel('Set default value').getByRole('textbox').click();
    await page.getByLabel('Set default value').getByRole('textbox').fill('test default value');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 关闭弹窗在打开，应该显示默认值
    await page.getByLabel('drawer-Action.Container-general-Add record-mask').click();
    await page.getByRole('button', { name: 'Add new' }).click();
    await expect(
      page.getByLabel('block-item-CollectionField-users-form-users.nickname-Nickname').getByRole('textbox'),
    ).toHaveValue('test default value');

    // 为 username 设置一个变量默认值: {{ currentObject.nickname }}
    await page.getByLabel(`block-item-CollectionField-users-form-users.username-Username`).hover();
    await page
      .getByLabel(`designer-schema-settings-CollectionField-fieldSettings:FormItem-users-users.Username`)
      .hover();
    await page.getByRole('menuitem', { name: 'Set default value', exact: true }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Current object' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Nickname' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await page.getByLabel('drawer-Action.Container-general-Add record-mask').click();
    await page.getByRole('button', { name: 'Add new' }).click();
    // 值应该和 Nickname 一致
    await expect(
      page.getByLabel('block-item-CollectionField-users-form-users.username-Username').getByRole('textbox'),
    ).toHaveValue('test default value');

    // 更改变量的值，longText 的值也应该跟着变化
    await page
      .getByLabel('block-item-CollectionField-users-form-users.nickname-Nickname')
      .getByRole('textbox')
      .fill('new value');
    await expect(
      page.getByLabel('block-item-CollectionField-users-form-users.username-Username').getByRole('textbox'),
    ).toHaveValue('new value');
  });

  test('subtable: basic fields', async ({ page, mockPage }) => {
    await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).goto();

    await page.getByRole('button', { name: 'Add new' }).click();

    // 先切换为子表格
    await page.getByLabel('block-item-CollectionField-general-form-general.oneToMany-oneToMany').hover();
    await page
      .getByLabel('designer-schema-settings-CollectionField-FormItem.Designer-general-general.oneToMany')
      .hover();
    await page.getByRole('menuitem', { name: 'Field component' }).click();
    await page.getByRole('option', { name: 'Sub-table' }).click();

    // 关闭下拉菜单
    await page.getByLabel('block-item-CollectionField-general-form-general.oneToMany-oneToMany').hover();
    await page
      .getByLabel('designer-schema-settings-CollectionField-FormItem.Designer-general-general.oneToMany')
      .hover();
    await page.mouse.move(100, 0);

    await page.getByLabel('schema-initializer-AssociationField.SubTable-table:configureColumns-users').hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await page.getByRole('menuitem', { name: 'Username' }).click();

    // 子表格状态下，没有默认值选项
    await page.getByLabel('block-item-CollectionField-general-form-general.oneToMany-oneToMany').hover();
    await expect(page.getByRole('menuitem', { name: 'Set default value' })).not.toBeVisible();

    // 测试子表格字段默认值 ------------------------------------------------------------------------------------------
    await page.getByRole('button', { name: 'Nickname', exact: true }).hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-users' })
      .hover();
    await page.getByRole('menuitem', { name: 'Set default value', exact: true }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('Set default value').getByRole('textbox').click();
    await page.getByLabel('Set default value').getByRole('textbox').fill('test default value');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 确保下拉选项被隐藏
    await page.getByRole('button', { name: 'Nickname', exact: true }).hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-users' })
      .hover();
    await page.mouse.move(300, 0);

    // 当新增一行时，应该显示默认值
    await page.getByTestId('drawer-Action.Container-general-Add record').locator('.nb-sub-table-addNew').click();
    await expect(
      page
        .getByRole('cell', { name: 'block-item-CollectionField-users-form-users.nickname-Nickname' })
        .getByRole('textbox'),
    ).toHaveValue('test default value');

    // https://nocobase.height.app/T-4028/description
    // 刷新页面后，默认值应该依然存在
    await page.reload();
    await page.getByTestId('drawer-Action.Container-general-Add record').locator('.nb-sub-table-addNew').click();
    await expect(
      page
        .getByRole('cell', { name: 'block-item-CollectionField-users-form-users.nickname-Nickname' })
        .getByRole('textbox'),
    ).toHaveValue('test default value');

    // 为 username 设置一个变量默认值: {{ currentObject.nickname }}
    await page.getByRole('button', { name: 'Username', exact: true }).hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-users' })
      .hover();
    await page.getByRole('menuitem', { name: 'Set default value', exact: true }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Current object' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Nickname' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 值应该和 Nickname 一致
    await expect(
      page
        .getByRole('cell', { name: 'block-item-CollectionField-users-form-users.username-Username' })
        .getByRole('textbox'),
    ).toHaveValue('test default value');

    // 更改变量的值，longText 的值也应该跟着变化
    await page
      .getByRole('cell', { name: 'block-item-CollectionField-users-form-users.username-Username' })
      .getByRole('textbox')
      .fill('new value');
    await expect(
      page
        .getByRole('cell', { name: 'block-item-CollectionField-users-form-users.username-Username' })
        .getByRole('textbox'),
    ).toHaveValue('new value');
  });

  // fix https://nocobase.height.app/T-2174
  test('should show default value option', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(T2174).waitForInit();
    await mockRecord('test2174');
    await nocoPage.goto();

    await page.getByLabel('action-Action.Link-View details-view-test2174-table-0').click();
    await page.getByLabel('block-item-CollectionField-test2174-form-test2174.singleSelect-Single select').hover();
    await page
      .getByLabel('designer-schema-settings-CollectionField-FormItem.Designer-test2174-test2174.singleSelect')
      .hover();

    await expect(page.getByRole('menuitem', { name: 'Set default value' })).toBeVisible();
  });

  // https://nocobase.height.app/T-3871
  test('should immediate effect when set default value', async ({ page, mockPage }) => {
    await mockPage(T3871).goto();

    // 1. 为 Nickname 设置默认值
    await page.getByLabel('block-item-CollectionField-').getByRole('textbox').hover();
    // hover 方法有时会失效，所以用 click 替代，原因未知
    await page.getByLabel('designer-schema-settings-CollectionField-fieldSettings:FormItem-users-users.').click();
    await page.getByRole('menuitem', { name: 'Set default value' }).click();
    await page.getByLabel('block-item-VariableInput-').getByRole('textbox').click();
    await page.getByLabel('block-item-VariableInput-').getByRole('textbox').fill('abcd');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 2. 设置的 ‘abcd’ 应该立即显示在 Nickname 字段的输入框中
    await expect(page.getByLabel('block-item-CollectionField-').getByRole('textbox').last()).toHaveValue('abcd');
  });

  test('Current popup record', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTableWithUsers).goto();

    // 1. 表单字段默认值中使用 `Current popup record`
    await page.getByLabel('action-Action.Link-View').click();
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'form Form (Add new) right' }).hover();
    await page.getByRole('menuitem', { name: 'Other records right' }).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('schema-initializer-Grid-form:').hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await page.getByLabel('block-item-CollectionField-').hover();
    await page.getByLabel('designer-schema-settings-CollectionField-fieldSettings:FormItem-users-users.').hover();
    await page.getByRole('menuitem', { name: 'Set default value' }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Current popup record right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Nickname' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByLabel('block-item-CollectionField-').getByRole('textbox')).toHaveValue('Super Admin');

    // 2. 表单联动规则中使用 `Current popup record`
    // 创建 Username 字段
    await page.getByLabel('schema-initializer-Grid-form:').hover();
    await page.getByRole('menuitem', { name: 'Username' }).click();
    // 设置联动规则
    await page.getByLabel('block-item-CardItem-users-form').hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:createForm-users').hover();
    await page.getByRole('menuitem', { name: 'Field linkage rules' }).click();
    await page.mouse.move(300, 0);
    await page.getByRole('button', { name: 'plus Add linkage rule' }).click();
    await page.getByText('Add property').click();
    await page.getByTestId('select-linkage-property-field').click();
    await page.getByTitle('Username').click();
    await page.getByTestId('select-linkage-action-field').click();
    await page.getByRole('option', { name: 'Value', exact: true }).click();
    await page.getByTestId('select-linkage-value-type').click();
    await page.getByTitle('Expression').click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Current popup record right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Username' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    // 需正确显示变量的值
    await expect(
      page.getByLabel('block-item-CollectionField-users-form-users.username-Username').getByRole('textbox'),
    ).toHaveValue('nocobase');

    // 3. Table 数据选择器中使用 `Current popup record`
    // 创建 Table 区块
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'Table right' }).hover();
    await page.getByRole('menuitem', { name: 'Other records right' }).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();
    await page.mouse.move(300, 0);
    // 显示 Nickname 字段
    await page
      .getByTestId('drawer-Action.Container-users-View record')
      .getByLabel('schema-initializer-TableV2-')
      .hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await page.mouse.move(300, 0);
    // 设置数据范围（使用 `Current popup record` 变量）
    await page
      .getByTestId('drawer-Action.Container-users-View record')
      .getByLabel('block-item-CardItem-users-table')
      .hover();
    await page
      .getByTestId('drawer-Action.Container-users-View record')
      .getByLabel('designer-schema-settings-CardItem-blockSettings:table-users')
      .hover();
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByRole('menuitemcheckbox', { name: 'Nickname' }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Current popup record right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Nickname' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    // 数据需显示正确
    await expect(
      page
        .getByTestId('drawer-Action.Container-users-View record')
        .getByLabel('block-item-CardItem-users-table')
        .getByRole('button', { name: 'Super Admin' }),
    ).toBeVisible();
  });

  test('Current popup record in popup that opened by association field', async ({ mockPage, page }) => {
    await mockPage(currentPopupRecordInPopupThatOpenedByAssociationField).goto();

    await page.getByText('Member').click();

    // Current popup record in the first popup
    await expect(page.getByLabel('block-item-CollectionField-').getByRole('textbox')).toHaveValue('Member');

    // Current popup record and Parent popup record in the second popup
    await page.getByLabel('action-Action-Edit-update-').click();
    await expect(
      page
        .getByTestId('drawer-Action.Container-roles-Edit record')
        .getByLabel('block-item-CollectionField-users-form-users.nickname-Current popup record')
        .getByRole('textbox'),
    ).toHaveValue('Member');
    await expect(
      page.getByLabel('block-item-CollectionField-users-form-users.username-Parent popup record').getByRole('textbox'),
    ).toHaveValue('Member');
  });

  test('Parent popup record', async ({ page, mockPage }) => {
    await mockPage(oneTableWithNestPopups).goto();

    // 1. 表单字段默认值中使用 `Parent popup record`
    await page.getByLabel('action-Action.Link-View').click();

    // 在第一级弹窗中，不应该包含 Parent popup record 变量
    await page
      .getByTestId('drawer-Action.Container-users-View record')
      .getByLabel('block-item-CardItem-users-')
      .hover();
    await page
      .getByTestId('drawer-Action.Container-users-View record')
      .getByLabel('designer-schema-settings-CardItem-blockSettings:table-users')
      .hover();
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByLabel('variable-button').click();
    await expect(page.getByRole('menuitemcheckbox', { name: 'Current popup record right' })).toBeVisible();
    await expect(page.getByRole('menuitemcheckbox', { name: 'Parent popup record right' })).not.toBeVisible();

    // 关闭数据范围设置弹窗
    await page.getByRole('button', { name: 'Close', exact: true }).click();

    await page.getByLabel('action-Action.Link-View in popup').click();
    await page.getByLabel('schema-initializer-Grid-popup').nth(1).hover();
    await page.getByRole('menuitem', { name: 'form Form (Add new) right' }).hover();
    await page.getByRole('menuitem', { name: 'Other records right' }).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('schema-initializer-Grid-form:').hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await page.getByLabel('block-item-CollectionField-').hover();
    await page.getByLabel('designer-schema-settings-CollectionField-fieldSettings:FormItem-users-users.').hover();
    await page.getByRole('menuitem', { name: 'Set default value' }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Parent popup record right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Nickname' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByLabel('block-item-CollectionField-').getByRole('textbox')).toHaveValue('Super Admin');

    // 2. 表单联动规则中使用 `Parent popup record`
    // 创建 Username 字段
    await page.getByLabel('schema-initializer-Grid-form:').hover();
    await page.getByRole('menuitem', { name: 'Username' }).click();
    // 设置联动规则
    await page.getByLabel('block-item-CardItem-users-form').hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:createForm-users').hover();
    await page.getByRole('menuitem', { name: 'Field linkage rules' }).click();
    await page.mouse.move(300, 0);
    await page.getByRole('button', { name: 'plus Add linkage rule' }).click();
    await page.getByText('Add property').click();
    await page.getByTestId('select-linkage-property-field').click();
    await page.getByTitle('Username').click();
    await page.getByTestId('select-linkage-action-field').click();
    await page.getByRole('option', { name: 'Value', exact: true }).click();
    await page.getByTestId('select-linkage-value-type').click();
    await page.getByTitle('Expression').click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Parent popup record right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Username' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    // 需正确显示变量的值
    await expect(
      page.getByLabel('block-item-CollectionField-users-form-users.username-Username').getByRole('textbox'),
    ).toHaveValue('nocobase');

    // 3. Table 数据选择器中使用 `Parent popup record`
    // 创建 Table 区块
    await page.getByLabel('schema-initializer-Grid-popup').nth(1).hover();
    await page.getByRole('menuitem', { name: 'Table right' }).hover();
    await page.getByRole('menuitem', { name: 'Other records right' }).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();
    await page.mouse.move(300, 0);
    // 显示 Nickname 字段
    await page
      .getByTestId('drawer-Action.Container-users-View record')
      .getByLabel('schema-initializer-TableV2-')
      .nth(1)
      .hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await page.mouse.move(300, 0);
    // 设置数据范围（使用 `Parent popup record` 变量）
    await page
      .getByTestId('drawer-Action.Container-users-View record')
      .getByLabel('block-item-CardItem-users-table')
      .nth(1)
      .hover();
    await page
      .getByTestId('drawer-Action.Container-users-View record')
      .getByLabel('designer-schema-settings-CardItem-blockSettings:table-users')
      .nth(1)
      .hover();
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByRole('menuitemcheckbox', { name: 'Nickname' }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Parent popup record right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Nickname' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    // 数据需显示正确
    await expect(
      page
        .getByTestId('drawer-Action.Container-users-View record')
        .getByLabel('block-item-CardItem-users-table')
        .getByRole('button', { name: 'Super Admin' }),
    ).toBeVisible();

    // 4. 退出二级弹窗，在第一级弹窗中点击 Add new 按钮
    await page.getByLabel('drawer-Action.Container-users').nth(2).click();
    await page.getByLabel('action-Action-Add new-create-').click();

    // 5. 在新增表单中使用 `Parent popup record`
    await page.getByLabel('block-item-CollectionField-').hover();
    await page.getByLabel('designer-schema-settings-CollectionField-fieldSettings:FormItem-users-users.').hover();
    await page.getByRole('menuitem', { name: 'Set default value' }).click();
    await page.getByLabel('variable-button').click();
    await expect(page.getByRole('menuitemcheckbox', { name: 'Current popup record right' })).not.toBeVisible();
    await page.getByRole('menuitemcheckbox', { name: 'Parent popup record right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Nickname' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByLabel('block-item-CollectionField-').getByRole('textbox')).toHaveValue('Super Admin');
  });

  test('Parent popup record in sub page. The first level is a subpage, and the second level is a popup', async ({
    page,
    mockPage,
  }) => {
    await mockPage(parentPopupRecordInSubPageTheFirstLevelIsASubpageAndTheSecondLevelIsAPopup).goto();

    // 1. 表单字段默认值中使用 `Parent popup record`
    await page.getByLabel('action-Action.Link-View').click();

    // 在第一级弹窗中，不应该包含 Parent popup record 变量
    await page.getByText('UsersAdd newConfigure').hover();
    await page.getByRole('button', { name: 'designer-schema-settings-' }).hover();
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByLabel('variable-button').click();
    await expect(page.getByRole('menuitemcheckbox', { name: 'Current popup record right' })).toBeVisible();
    await expect(page.getByRole('menuitemcheckbox', { name: 'Parent popup record right' })).not.toBeVisible();

    // 关闭数据范围设置弹窗
    await page.getByRole('button', { name: 'Close', exact: true }).click();

    await page.getByLabel('action-Action.Link-View in popup').click();
    await page.getByLabel('schema-initializer-Grid-popup').nth(1).hover();
    await page.getByRole('menuitem', { name: 'form Form (Add new) right' }).hover();
    await page.getByRole('menuitem', { name: 'Other records right' }).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('schema-initializer-Grid-form:').hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await page.getByLabel('block-item-CollectionField-').hover();
    await page.getByLabel('designer-schema-settings-CollectionField-fieldSettings:FormItem-users-users.').hover();
    await page.getByRole('menuitem', { name: 'Set default value' }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Parent popup record right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Nickname' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByLabel('block-item-CollectionField-').getByRole('textbox')).toHaveValue('Super Admin');

    await page.reload();
    await expect(page.getByLabel('block-item-CollectionField-').getByRole('textbox')).toHaveValue('Super Admin');

    // 2. 表单联动规则中使用 `Parent popup record`
    // 创建 Username 字段
    await page.getByLabel('schema-initializer-Grid-form:').hover();
    await page.getByRole('menuitem', { name: 'Username' }).click();
    // 设置联动规则
    await page.getByLabel('block-item-CardItem-users-form').hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:createForm-users').hover();
    await page.getByRole('menuitem', { name: 'Field linkage rules' }).click();
    await page.mouse.move(300, 0);
    await page.getByRole('button', { name: 'plus Add linkage rule' }).click();
    await page.getByText('Add property').click();
    await page.getByTestId('select-linkage-property-field').click();
    await page.getByTitle('Username').click();
    await page.getByTestId('select-linkage-action-field').click();
    await page.getByRole('option', { name: 'Value', exact: true }).click();
    await page.getByTestId('select-linkage-value-type').click();
    await page.getByTitle('Expression').click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Parent popup record right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Username' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    // 需正确显示变量的值
    await expect(
      page.getByLabel('block-item-CollectionField-users-form-users.username-Username').getByRole('textbox'),
    ).toHaveValue('nocobase');

    await page.reload();
    await expect(
      page.getByLabel('block-item-CollectionField-users-form-users.username-Username').getByRole('textbox'),
    ).toHaveValue('nocobase');

    // 3. Table 数据选择器中使用 `Parent popup record`
    // 创建 Table 区块
    await page.getByLabel('schema-initializer-Grid-popup').nth(1).hover();
    await page.getByRole('menuitem', { name: 'Table right' }).hover();
    await page.getByRole('menuitem', { name: 'Other records right' }).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();
    await page.mouse.move(300, 0);
    // 显示 Nickname 字段
    await page
      .getByTestId('drawer-Action.Container-users-View record')
      .getByLabel('schema-initializer-TableV2-')
      .hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await page.mouse.move(300, 0);
    // 设置数据范围（使用 `Parent popup record` 变量）
    await page
      .getByTestId('drawer-Action.Container-users-View record')
      .getByLabel('block-item-CardItem-users-table')
      .hover();
    await page
      .getByTestId('drawer-Action.Container-users-View record')
      .getByLabel('designer-schema-settings-CardItem-blockSettings:table-users')
      .hover();
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByRole('menuitemcheckbox', { name: 'Nickname' }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Parent popup record right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Nickname' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    // 数据需显示正确
    await expect(
      page
        .getByTestId('drawer-Action.Container-users-View record')
        .getByLabel('block-item-CardItem-users-table')
        .getByRole('button', { name: 'Super Admin' }),
    ).toBeVisible();

    await page.reload();
    await expect(
      page
        .getByTestId('drawer-Action.Container-users-View record')
        .getByLabel('block-item-CardItem-users-table')
        .getByRole('button', { name: 'Super Admin' }),
    ).toBeVisible();

    // 4. 退出二级弹窗，在第一级弹窗中点击 Add new 按钮
    await page.goBack();
    await page.getByLabel('action-Action-Add new-create-').click();

    // 5. 在新增表单中使用 `Parent popup record`
    await page.getByLabel('block-item-CollectionField-').hover();
    await page.getByLabel('designer-schema-settings-CollectionField-fieldSettings:FormItem-users-users.').hover();
    await page.getByRole('menuitem', { name: 'Set default value' }).click();
    await page.getByLabel('variable-button').click();
    await expect(page.getByRole('menuitemcheckbox', { name: 'Current popup record right' })).not.toBeVisible();
    await page.getByRole('menuitemcheckbox', { name: 'Parent popup record right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Nickname' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByLabel('block-item-CollectionField-').getByRole('textbox')).toHaveValue('Super Admin');

    await page.reload();
    await expect(page.getByLabel('block-item-CollectionField-').getByRole('textbox')).toHaveValue('Super Admin');
  });

  test('Parent popup record in sub page. The first level is a subpage, and the second level is a subpage too', async ({
    page,
    mockPage,
  }) => {
    await mockPage(parentPopupRecordInSubPageTheFirstLevelIsASubpageAndTheSecondLevelIsASubpageToo).goto();

    // 1. 表单字段默认值中使用 `Parent popup record`
    await page.getByLabel('action-Action.Link-View').click();

    // 在第一级弹窗中，不应该包含 Parent popup record 变量
    await page.getByText('UsersAdd newConfigure').hover();
    await page.getByRole('button', { name: 'designer-schema-settings-' }).hover();
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByLabel('variable-button').click();
    await expect(page.getByRole('menuitemcheckbox', { name: 'Current popup record right' })).toBeVisible();
    await expect(page.getByRole('menuitemcheckbox', { name: 'Parent popup record right' })).not.toBeVisible();

    // 关闭数据范围设置弹窗
    await page.getByRole('button', { name: 'Close', exact: true }).click();

    await page.getByLabel('action-Action.Link-View in').click();
    await page.getByLabel('schema-initializer-Grid-popup').nth(1).hover();
    await page.getByRole('menuitem', { name: 'form Form (Add new) right' }).hover();
    await page.getByRole('menuitem', { name: 'Other records right' }).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('schema-initializer-Grid-form:').hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await page.getByLabel('block-item-CollectionField-').hover();
    await page.getByLabel('designer-schema-settings-CollectionField-fieldSettings:FormItem-users-users.').hover();
    await page.getByRole('menuitem', { name: 'Set default value' }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Parent popup record right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Nickname' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByLabel('block-item-CollectionField-').getByRole('textbox')).toHaveValue('Super Admin');

    await page.reload();
    await expect(page.getByLabel('block-item-CollectionField-').getByRole('textbox')).toHaveValue('Super Admin');

    // 2. 表单联动规则中使用 `Parent popup record`
    // 创建 Username 字段
    await page.getByLabel('schema-initializer-Grid-form:').hover();
    await page.getByRole('menuitem', { name: 'Username' }).click();
    // 设置联动规则
    await page.getByLabel('block-item-CardItem-users-form').hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:createForm-users').hover();
    await page.getByRole('menuitem', { name: 'Field linkage rules' }).click();
    await page.mouse.move(300, 0);
    await page.getByRole('button', { name: 'plus Add linkage rule' }).click();
    await page.getByText('Add property').click();
    await page.getByTestId('select-linkage-property-field').click();
    await page.getByTitle('Username').click();
    await page.getByTestId('select-linkage-action-field').click();
    await page.getByRole('option', { name: 'Value', exact: true }).click();
    await page.getByTestId('select-linkage-value-type').click();
    await page.getByTitle('Expression').click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Parent popup record right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Username' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    // 需正确显示变量的值
    await expect(
      page.getByLabel('block-item-CollectionField-users-form-users.username-Username').getByRole('textbox'),
    ).toHaveValue('nocobase');

    await page.reload();
    await expect(
      page.getByLabel('block-item-CollectionField-users-form-users.username-Username').getByRole('textbox'),
    ).toHaveValue('nocobase');

    // 3. Table 数据选择器中使用 `Parent popup record`
    // 创建 Table 区块
    await page.getByLabel('schema-initializer-Grid-popup').nth(1).hover();
    await page.getByRole('menuitem', { name: 'Table right' }).hover();
    await page.getByRole('menuitem', { name: 'Other records right' }).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();
    await page.mouse.move(300, 0);
    // 显示 Nickname 字段
    await page.getByLabel('schema-initializer-TableV2-').nth(2).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await page.mouse.move(300, 0);
    // 设置数据范围（使用 `Parent popup record` 变量）
    await page.getByLabel('block-item-CardItem-users-table').nth(2).hover();
    await page.getByRole('button', { name: 'designer-schema-settings-' }).hover();
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByRole('menuitemcheckbox', { name: 'Nickname' }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Parent popup record right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Nickname' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    // 数据需显示正确
    await expect(
      page.getByLabel('block-item-CardItem-users-table').getByRole('button', { name: 'Super Admin' }),
    ).toBeVisible();

    await page.reload();
    await expect(
      page.getByLabel('block-item-CardItem-users-table').getByRole('button', { name: 'Super Admin' }),
    ).toBeVisible();

    // 4. 退出二级弹窗，在第一级弹窗中点击 Add new 按钮
    await page.goBack();
    await page.getByLabel('action-Action-Add new-create-').click();

    // 5. 在新增表单中使用 `Parent popup record`
    await page.getByLabel('block-item-CollectionField-').hover();
    await page.getByLabel('designer-schema-settings-CollectionField-fieldSettings:FormItem-users-users.').hover();
    await page.getByRole('menuitem', { name: 'Set default value' }).click();
    await page.getByLabel('variable-button').click();
    await expect(page.getByRole('menuitemcheckbox', { name: 'Current popup record right' })).not.toBeVisible();
    await page.getByRole('menuitemcheckbox', { name: 'Parent popup record right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Nickname' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByLabel('block-item-CollectionField-').getByRole('textbox')).toHaveValue('Super Admin');

    await page.reload();

    // wait for the parsed variable value to be displayed
    await expect(page.getByLabel('block-item-CollectionField-').getByRole('textbox')).toBeVisible();
    await page.waitForTimeout(500);

    await expect(page.getByLabel('block-item-CollectionField-').getByRole('textbox')).toHaveValue('Super Admin');
  });

  test('easy reading', async ({ page, mockPage, mockRecords }) => {
    await mockPage({
      collections: [
        {
          name: 'collection_1',
          fields: [
            {
              name: 'm2o',
              interface: 'm2o',
              target: 'collection_2',
            },
            {
              name: 'm2o_2',
              interface: 'm2o',
              target: 'collection_2',
            },
          ],
        },
        {
          name: 'collection_2',
        },
      ],
      pageSchema: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Page',
        properties: {
          '7kj0c20cftn': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'page:addBlock',
            properties: {
              omaogkkx2ec: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Row',
                'x-app-version': '1.5.0-beta.28',
                properties: {
                  cdiy18aj1ug: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-component': 'Grid.Col',
                    'x-app-version': '1.5.0-beta.28',
                    properties: {
                      wtyaf2xemgb: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-acl-action-props': {
                          skipScopeCheck: true,
                        },
                        'x-acl-action': 'collection_1:create',
                        'x-decorator': 'FormBlockProvider',
                        'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
                        'x-decorator-props': {
                          dataSource: 'main',
                          collection: 'collection_1',
                        },
                        'x-toolbar': 'BlockSchemaToolbar',
                        'x-settings': 'blockSettings:createForm',
                        'x-component': 'CardItem',
                        'x-app-version': '1.5.0-beta.28',
                        properties: {
                          cp1f3ggdy5e: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'FormV2',
                            'x-use-component-props': 'useCreateFormBlockProps',
                            'x-app-version': '1.5.0-beta.28',
                            properties: {
                              grid: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid',
                                'x-initializer': 'form:configureFields',
                                'x-app-version': '1.5.0-beta.28',
                                properties: {
                                  '3a5awam8yz3': {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Row',
                                    'x-app-version': '1.5.0-beta.28',
                                    properties: {
                                      '7895fn3fxwx': {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        'x-component': 'Grid.Col',
                                        'x-app-version': '1.5.0-beta.28',
                                        properties: {
                                          m2o: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'string',
                                            'x-toolbar': 'FormItemSchemaToolbar',
                                            'x-settings': 'fieldSettings:FormItem',
                                            'x-component': 'CollectionField',
                                            'x-decorator': 'FormItem',
                                            'x-collection-field': 'collection_1.m2o',
                                            'x-component-props': {
                                              fieldNames: {
                                                label: 'id',
                                                value: 'id',
                                              },
                                            },
                                            'x-app-version': '1.5.0-beta.28',
                                            'x-uid': 'bx3vx09ykir',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'lkaqolxp5qv',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': '1ljx4q7tvth',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                  jg7epacpge9: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Row',
                                    'x-app-version': '1.5.0-beta.28',
                                    properties: {
                                      '9upq531yh61': {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        'x-component': 'Grid.Col',
                                        'x-app-version': '1.5.0-beta.28',
                                        properties: {
                                          m2o_2: {
                                            'x-uid': 'ionq23oqorg',
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'string',
                                            'x-toolbar': 'FormItemSchemaToolbar',
                                            'x-settings': 'fieldSettings:FormItem',
                                            'x-component': 'CollectionField',
                                            'x-decorator': 'FormItem',
                                            'x-collection-field': 'collection_1.m2o_2',
                                            'x-component-props': {
                                              fieldNames: {
                                                label: 'id',
                                                value: 'id',
                                              },
                                            },
                                            'x-app-version': '1.5.0-beta.28',
                                            'x-read-pretty': true,
                                            'x-disabled': false,
                                            default: '{{$nForm.m2o}}',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'i7ebjgsford',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'mkm21x783fl',
                                    'x-async': false,
                                    'x-index': 2,
                                  },
                                },
                                'x-uid': 'fpaalp1zmth',
                                'x-async': false,
                                'x-index': 1,
                              },
                              ofw9x3hrdjx: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-initializer': 'createForm:configureActions',
                                'x-component': 'ActionBar',
                                'x-component-props': {
                                  layout: 'one-column',
                                },
                                'x-app-version': '1.5.0-beta.28',
                                'x-uid': 'litw9kt4c0j',
                                'x-async': false,
                                'x-index': 2,
                              },
                            },
                            'x-uid': 'eyvufccf8sl',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'h97bmbe1jwi',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': '65nov2oolvr',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'snhlffsnqz7',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': '031qbdov70d',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'h5ytr3kqoto',
        'x-async': true,
        'x-index': 1,
      },
    }).goto();
    await mockRecords('collection_2', 3);

    // 1. 设置 `m2o` 字段的值后，`m2o_2` 字段的值会自动更新（因为 `m2o_2` 的默认值是 `{{$nForm.m2o}}`）
    await page
      .getByLabel('block-item-CollectionField-collection_1-form-collection_1.m2o-m2o')
      .getByTestId('select-object-single')
      .click();
    await page.getByRole('option', { name: '1' }).click();
    await expect(page.getByLabel('block-item-CollectionField-collection_1-form-collection_1.m2o_2-m2o_2')).toHaveText(
      'm2o_2:1',
    );

    // 2. 设置 `m2o` 字段的值为其它值后，`m2o_2` 字段的值应该自动更新
    await page
      .getByLabel('block-item-CollectionField-collection_1-form-collection_1.m2o-m2o')
      .getByTestId('select-object-single')
      .click();
    await page.getByRole('option', { name: '2' }).click();
    await expect(page.getByLabel('block-item-CollectionField-collection_1-form-collection_1.m2o_2-m2o_2')).toHaveText(
      'm2o_2:2',
    );
  });
});

test.describe('actions schema settings', () => {
  test('submit', async ({ page, mockPage }) => {
    await mockPage(oneEmptyFormWithActions).goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByRole('button', { name: 'Submit' }).hover();
        await page.getByRole('button', { name: 'designer-schema-settings-Action-Action.Designer-users' }).hover();
      },
      supportedOptions: ['Edit button', 'Secondary confirmation', 'Delete'],
    });
  });

  test.describe('customize: save record', () => {
    test('supported options', async ({ page, mockPage }) => {
      await mockPage(oneEmptyFormWithActions).goto();

      await expectSettingsMenu({
        page,
        showMenu: async () => {
          await page.getByRole('button', { name: 'Save record' }).hover();
          await page.getByRole('button', { name: 'designer-schema-settings-Action-Action.Designer-users' }).hover();
        },
        supportedOptions: [
          'Edit button',
          'Assign field values',
          'Skip required validation',
          'After successful submission',
          'Delete',
        ],
      });
    });

    test('Assign field values', async ({ page, mockPage }) => {
      await mockPage(oneFormAndOneTableWithUsers).goto();

      const openPopup = async () => {
        if (!(await page.getByLabel('action-Action-Submit-').isVisible())) {
          await page.getByLabel('schema-initializer-ActionBar-createForm:configureActions-users').hover();
          await page.getByRole('menuitem', { name: 'Submit' }).click();
        }

        await page.getByLabel('action-Action-Submit-').hover();
        await page.getByLabel('designer-schema-settings-Action-actionSettings:createSubmit-users').hover();
        await page.getByRole('menuitem', { name: 'Assign field values' }).click();

        await page.waitForTimeout(500);
        if (!(await page.getByLabel('block-item-AssignedField-').getByRole('textbox').isVisible())) {
          await page.getByLabel('schema-initializer-Grid-assignFieldValuesForm:configureFields-users').hover();
          await page.getByRole('menuitem', { name: 'Nickname' }).click();
        }
      };

      const expectNewValue = async (value: string) => {
        await page.getByLabel('action-Action-Submit-').click();
        await page.getByLabel('action-Action-Refresh-refresh').click();
        await expect(page.getByLabel('block-item-CardItem-users-table').getByText(value)).toBeVisible();
      };

      // 1. 打开 Assign field values 配置弹窗
      await openPopup();

      // 2. 将 Nickname 字段的值设置为 `123456`
      await page.getByLabel('block-item-AssignedField-').getByRole('textbox').click();
      await page.getByLabel('block-item-AssignedField-').getByRole('textbox').fill('123456');
      await page.getByRole('button', { name: 'Submit', exact: true }).click();

      // 3. 保存后点击 Submit 按钮，然后刷新表格，应该显示一条 Nickname 为 “123456” 的记录
      await expectNewValue('123456');

      // 4. 再次打开 Assign field values 配置弹窗，这次为 Nickname 设置一个变量值（Current role）
      await openPopup();
      await page.getByLabel('variable-button').click();
      await expectSupportedVariables(page, [
        'Constant',
        'Current user',
        'Current role',
        'API token',
        'Date variables',
        'Current form',
      ]);
      await page.getByRole('menuitemcheckbox', { name: 'Current role' }).click();
      await page.getByRole('button', { name: 'Submit', exact: true }).click();

      // 5. 保存后点击 Submit 按钮，然后刷新表格，应该显示一条 Nickname 为 “root” 的记录
      await expectNewValue('root');
    });
  });
});
