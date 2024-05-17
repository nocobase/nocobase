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
import { T2174, T3871, oneFormAndOneTableWithUsers } from './templatesOfBug';

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
    await page
      .getByTestId('drawer-Action.Container-general-Add record')
      .getByRole('button', { name: 'Add new' })
      .click();
    await expect(
      page
        .getByRole('cell', { name: 'block-item-CollectionField-users-form-users.nickname-Nickname' })
        .getByRole('textbox'),
    ).toHaveValue('test default value');

    // https://nocobase.height.app/T-4028/description
    // 刷新页面后，默认值应该依然存在
    await page.reload();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page
      .getByTestId('drawer-Action.Container-general-Add record')
      .getByRole('button', { name: 'Add new' })
      .click();
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
    await page.getByLabel('designer-schema-settings-CollectionField-fieldSettings:FormItem-users-users.').hover();
    await page.getByRole('menuitem', { name: 'Set default value' }).click();
    await page.getByLabel('block-item-VariableInput-').getByRole('textbox').click();
    await page.getByLabel('block-item-VariableInput-').getByRole('textbox').fill('abcd');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 2. 设置的 ‘abcd’ 应该立即显示在 Nickname 字段的输入框中
    await expect(page.getByLabel('block-item-CollectionField-').getByRole('textbox')).toHaveValue('abcd');
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
    await page.getByRole('menuitem', { name: 'Linkage rules' }).click();
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
    await page.getByRole('menuitem', { name: 'table Table right' }).hover();
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
