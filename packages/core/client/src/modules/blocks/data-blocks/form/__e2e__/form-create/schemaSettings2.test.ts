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
  expectSupportedVariables,
  oneTableBlockWithAddNewAndViewAndEditAndBasicFields,
  test,
} from '@nocobase/test/e2e';
import { expressionTemplateInLinkageRules, T2165, T3251, T3806, T3815, T4891 } from './templatesOfBug';

test.describe('linkage rules', () => {
  test('basic usage', async ({ page, mockPage }) => {
    const openLinkageRules = async () => {
      await page.getByLabel('designer-schema-settings-CardItem-FormV2.Designer-general').hover();
      await page.getByRole('menuitem', { name: 'Linkage rules' }).click();
    };

    await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).goto();

    await page.getByRole('button', { name: 'Add new' }).click();

    // 设置第一组规则 --------------------------------------------------------------------------
    // 打开联动规则弹窗
    await page.getByLabel('block-item-CardItem-general-form').hover();
    await openLinkageRules();

    // 增加一组规则
    // 条件：singleLineText 字段的值包含 123 时
    await page.getByRole('button', { name: 'plus Add linkage rule' }).click();
    await page.getByText('Add condition', { exact: true }).click();

    await page.getByLabel('variable-button').first().click();
    await page.getByText('Current form').last().click();
    await page.getByText('Current form').last().click();
    await page.getByRole('menuitemcheckbox', { name: 'singleLineText' }).locator('div').click();

    // await page.getByRole('menuitemcheckbox', { name: 'singleLineText' }).click();
    await page.getByTestId('right-filter-field').getByRole('textbox').click();
    await page.getByTestId('right-filter-field').getByRole('textbox').fill('123');
    await page.getByRole('tabpanel').getByRole('textbox').last().fill('123');
    // action：禁用 longText 字段
    await page.getByText('Add property').click();
    await page.getByTestId('select-linkage-property-field').click();
    await page.getByRole('tree').getByText('longText').click();
    await page.getByTestId('select-linkage-action-field').click();
    await page.getByRole('option', { name: 'Disabled' }).click();

    // 保存规则
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 验证第一组规则 --------------------------------------------------------------------------
    // 初始状态下，longText 字段是可编辑的
    await expect(
      page.getByLabel('block-item-CollectionField-general-form-general.longText-longText').getByRole('textbox'),
    ).toBeEditable();

    // 输入 123，longText 字段被禁用
    await page
      .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
      .getByRole('textbox')
      .click();
    await page
      .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
      .getByRole('textbox')
      .fill('123');
    await expect(
      page.getByLabel('block-item-CollectionField-general-form-general.longText-longText').getByRole('textbox'),
    ).toBeDisabled();

    // 清空输入，longText 字段应该恢复成可编辑状态
    await page
      .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
      .getByRole('textbox')
      .clear();
    await expect(
      page.getByLabel('block-item-CollectionField-general-form-general.longText-longText').getByRole('textbox'),
    ).toBeEditable();

    // 修改第一组规则，使其条件中包含一个变量 --------------------------------------------------------------------------
    // 当 singleLineText 字段的值包含 longText 字段的值时，禁用 longText 字段
    await openLinkageRules();
    await page.getByLabel('variable-button').last().click();
    await expectSupportedVariables(page, [
      'Constant',
      'Current user',
      'Current role',
      'API token',
      'Date variables',
      'Current form',
    ]);
    await page.getByRole('menuitemcheckbox', { name: 'Current form' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'longText' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // singleLineText 字段和 longText 字段都为空的情况下，longText 字段应该是可编辑的
    await expect(
      page.getByLabel('block-item-CollectionField-general-form-general.longText-longText').getByRole('textbox'),
    ).toBeEditable();

    // 先为 longText 字段填入 123，然后为 singleLineText 字段填入 1，longText 字段应该是可编辑的
    await page
      .getByLabel('block-item-CollectionField-general-form-general.longText-longText')
      .getByRole('textbox')
      .fill('123');
    await page
      .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
      .getByRole('textbox')
      .fill('1');
    await expect(
      page.getByLabel('block-item-CollectionField-general-form-general.longText-longText').getByRole('textbox'),
    ).toBeEditable();

    // 改变变量的值：即将 longText 字段的值改为 1，longText 字段应该是禁用的
    await page
      .getByLabel('block-item-CollectionField-general-form-general.longText-longText')
      .getByRole('textbox')
      .click();
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await expect(
      page.getByLabel('block-item-CollectionField-general-form-general.longText-longText').getByRole('textbox'),
    ).toBeDisabled();

    // 添加第二组规则 -------------------------------------------------------------------------------------------
    await openLinkageRules();

    // 增加一条规则：当 number 字段的值等于 123 时
    await page.getByRole('button', { name: 'plus Add linkage rule' }).click();
    await page.locator('.ant-collapse-header .ant-collapse-expand-icon').nth(1).click();

    await page
      .getByLabel('Linkage rules')
      .getByRole('tabpanel')
      .getByText('Add condition', { exact: true })
      .last()
      .click();
    // await page.getByRole('button', { name: 'Select field' }).click();

    await page.getByTestId('left-filter-field').getByLabel('variable-button').last().click();
    await page.getByText('Current form').last().click();
    await page.getByText('Current form').last().click();
    await page.getByRole('menuitemcheckbox', { name: 'number' }).locator('div').click();

    await page.getByLabel('Linkage rules').getByRole('spinbutton').click();
    await page.getByLabel('Linkage rules').getByRole('spinbutton').fill('123');

    // action：使 longText 字段可编辑
    await page.getByLabel('Linkage rules').getByRole('tabpanel').getByText('Add property').click();
    await page.getByRole('button', { name: 'Select field' }).click();
    await page.getByRole('tree').getByText('longText').click();
    await page.getByRole('button', { name: 'action', exact: true }).click();
    await page.getByRole('option', { name: 'Editable' }).click();

    // action: 为 longText 字段赋上常量值
    await page.getByLabel('Linkage rules').getByRole('tabpanel').getByText('Add property').click();
    await page.getByRole('button', { name: 'Select field' }).click();
    await page.getByRole('tree').getByText('longText').last().click();
    await page.getByRole('button', { name: 'action', exact: true }).click();
    await page.getByRole('option', { name: 'Value', exact: true }).last().click();
    await page.getByLabel('dynamic-component-linkage-rules').getByRole('textbox').fill('456');

    // action: 为 integer 字段附上一个表达式，使其值等于 number 字段的值
    await page.getByLabel('Linkage rules').getByRole('tabpanel').getByText('Add property').click();

    await page.getByRole('button', { name: 'Select field' }).click();
    await page.getByRole('tree').getByText('integer').last().click();
    await page.getByRole('button', { name: 'action', exact: true }).click();
    await page.getByRole('option', { name: 'Value', exact: true }).last().click();
    await page.getByTestId('select-linkage-value-type').last().click();
    await page.getByText('Expression').click();

    await page.getByText('xSelect a variable').click();
    await expectSupportedVariables(page, [
      'Current user',
      'Current role',
      'API token',
      'Date variables',
      'Current form',
    ]);
    await page.getByRole('menuitemcheckbox', { name: 'Current form right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'number' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 验证第二组规则 -------------------------------------------------------------------------------------------
    // 此时 longText 字段是禁用状态，当满足第二组规则时，longText 字段应该是可编辑的
    await page
      .getByLabel('block-item-CollectionField-general-form-general.number-number')
      .getByRole('spinbutton')
      .fill('123');
    await expect(
      page.getByLabel('block-item-CollectionField-general-form-general.longText-longText').getByRole('textbox'),
    ).toBeEditable();

    // 并且 longText 字段的值应该是 456
    await expect(
      page.getByLabel('block-item-CollectionField-general-form-general.longText-longText').getByRole('textbox'),
    ).toHaveValue('456');

    // integer 字段的值应该等于 number 字段的值
    await expect(
      page.getByLabel('block-item-CollectionField-general-form-general.integer-integer').getByRole('spinbutton'),
    ).toHaveValue('123');
  });

  // https://nocobase.height.app/T-2165
  test('variable labels should be displayed normally', async ({ page, mockPage }) => {
    await mockPage(T2165).goto();

    await page.getByLabel('block-item-CardItem-users-form').hover();
    await page.getByLabel('designer-schema-settings-CardItem-FormV2.Designer-users').hover();
    await page.getByRole('menuitem', { name: 'Linkage rules' }).click();

    await expect(page.getByText('Current form / Nickname')).toBeVisible();
    await expect(page.getByText('Current form / Phone')).toBeVisible();
  });

  // https://nocobase.height.app/T-3251
  test('nested conditions', async ({ page, mockPage }) => {
    await mockPage(T3251).goto();

    // 一开始 email 字段是可编辑的
    await expect(
      page.getByLabel('block-item-CollectionField-users-form-users.email-Email').getByRole('textbox'),
    ).toBeEditable();

    // 满足联动规则条件时，email 字段应该是禁用的
    await page
      .getByLabel('block-item-CollectionField-users-form-users.nickname-Nickname')
      .getByRole('textbox')
      .fill('nickname');
    await page
      .getByLabel('block-item-CollectionField-users-form-users.username-Username')
      .getByRole('textbox')
      .fill('username');
    await expect(
      page.getByLabel('block-item-CollectionField-users-form-users.email-Email').getByRole('textbox'),
    ).toBeDisabled();

    // 再次改成不满足条件时，email 字段应该是可编辑的
    await page.getByLabel('block-item-CollectionField-users-form-users.nickname-Nickname').getByRole('textbox').clear();
    await expect(
      page.getByLabel('block-item-CollectionField-users-form-users.email-Email').getByRole('textbox'),
    ).toBeEditable();
  });

  // https://nocobase.height.app/T-3806
  test.skip('after save as block template', async ({ page, mockPage }) => {
    await mockPage(T3806).goto();

    // 1. 一开始联动规则应该正常
    await page
      .getByLabel('block-item-CollectionField-users-form-users.nickname-Nickname')
      .getByRole('textbox')
      .fill('123');
    await expect(
      page.getByLabel('block-item-CollectionField-users-form-users.username-Username').getByRole('textbox'),
    ).toHaveValue('123');

    try {
      // 2. 将表单区块保存为模板后
      await page.getByLabel('block-item-CardItem-users-form').hover();
      await page.getByLabel('designer-schema-settings-CardItem-blockSettings:createForm-users').hover();
      await page.getByRole('menuitem', { name: 'Save as block template' }).click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForTimeout(1000);

      // 3. 联动规则应该依然是正常的
      await page
        .getByLabel('block-item-CollectionField-users-form-users.nickname-Nickname')
        .getByRole('textbox')
        .fill('456');
      await expect(
        page.getByLabel('block-item-CollectionField-users-form-users.username-Username').getByRole('textbox'),
      ).toHaveValue('456');
    } catch (err) {
      throw err;
    } finally {
      // 4. 把创建的模板删除
      await page.goto('/admin/settings/ui-schema-storage');
      await page.getByLabel('Select all').check();
      await page.getByLabel('action-Action-Delete-destroy-').click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await expect(page.getByRole('row', { name: 'Users_Form' }).first()).toBeHidden();
    }
  });

  test('fireImmediately in create form & edit form', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(T3815).waitForInit();
    await mockRecord('general', {
      RadioGroup: '002',
      number: 66,
      select: '002',
    });
    await nocoPage.goto();

    // 编辑表单中获取到接口数据后再触发联动规则
    await page.getByLabel('action-Action.Link-Edit-').click();
    await expect(page.getByRole('spinbutton')).toHaveValue('66');
    await page.getByLabel('drawer-Action.Container-general-Edit record-mask').click();

    //新建表单中的赋默认值后的联动规则
    await expect(page.getByLabel('block-item-CardItem-general-')).toBeVisible();
    await page.getByLabel('action-Action-Add new-create-').click();
    await expect(page.getByRole('spinbutton')).toHaveValue('88');
  });

  test('expression', async ({ page, mockPage }) => {
    // 这里联动规则的表达式是 SUM({{$nForm.m2m.number2}})
    await mockPage(expressionTemplateInLinkageRules).goto();

    // 1. 一开始 number1 字段的值是 0
    await expect(
      page.getByLabel('block-item-CollectionField-general1-form-general1.number1-number1').getByRole('spinbutton'),
    ).toHaveValue('0');

    // 2. 为 m2m 字段添加一条数据，并将 number2 字段的值设置为 1，此时 number1 字段的值应该是 1
    await page.locator('.nb-sub-table-addNew').click();
    await page
      .getByLabel('block-item-CollectionField-general2-form-general2.number2-number2')
      .getByRole('spinbutton')
      .fill('1');
    await expect(
      page.getByLabel('block-item-CollectionField-general1-form-general1.number1-number1').getByRole('spinbutton'),
    ).toHaveValue('1');

    // 3. 再为 m2m 字段添加一条数据，并将 number2 字段的值设置为 2，此时 number1 字段的值应该是 3
    await page.locator('.nb-sub-table-addNew').click();
    await page.getByRole('row', { name: 'table-index-2 block-item-' }).getByRole('spinbutton').fill('2');
    await expect(
      page.getByLabel('block-item-CollectionField-general1-form-general1.number1-number1').getByRole('spinbutton'),
    ).toHaveValue('3');
  });
  test('field are set from not displayed to displayed and required', async ({ page, mockPage }) => {
    await mockPage(T4891).goto();

    await expect(page.getByLabel('block-item-CardItem-general-')).toBeVisible();

    // 初始化时select没有值,name 必填
    await expect(
      page.getByLabel('block-item-CollectionField-general-form-general.name-name').locator('.ant-formily-item-label'),
    ).toContainText('*name');

    //select 为111,name 隐藏
    await page.getByLabel('block-item-CollectionField-general-form-general.select-select').click();
    await page.getByText('111').click();

    await expect(page.getByLabel('block-item-CollectionField-general-form-general.name-name')).not.toBeVisible();

    //select 为333,name 显示且必填
    await page.getByTestId('select-single').click();
    await page.getByText('333').click();
    await expect(
      page.getByLabel('block-item-CollectionField-general-form-general.name-name').locator('.ant-formily-item-label'),
    ).toContainText('*name');

    //select 为222,name 显示且非必填
    await page.getByLabel('block-item-CollectionField-general-form-general.select-select').click();
    await page.getByText('222').click();

    await expect(
      page.getByLabel('block-item-CollectionField-general-form-general.name-name').locator('.ant-formily-item-label'),
    ).not.toContainText('*name');
  });
});
