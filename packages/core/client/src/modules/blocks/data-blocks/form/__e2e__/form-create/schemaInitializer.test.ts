/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@formily/shared';
import { Page, createBlockInPage, expect, oneEmptyForm, test } from '@nocobase/test/e2e';
import { oneEmptyTableWithUsers } from '../../../details-multi/__e2e__/templatesOfBug';
import { T3106, T3469, T4350, oneFormWithInheritFields } from './templatesOfBug';

const deleteButton = async (page: Page, name: string) => {
  await page.getByRole('button', { name }).hover();
  await page.getByRole('button', { name }).getByLabel('designer-schema-settings-').hover();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'OK', exact: true }).click();
};

test.describe('where creation form block can be added', () => {
  test('page', async ({ page, mockPage }) => {
    await mockPage().goto();

    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await createBlockInPage(page, 'Form');
    await expect(page.getByLabel('block-item-CardItem-users-form')).toBeVisible();
  });

  test('popup', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTableWithUsers).goto();

    // 1. 打开弹窗，通过 Associated records 创建一个创建表单区块
    await page.getByLabel('action-Action.Link-View').click();
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'form Form (Add new) right' }).hover();
    await page.getByRole('menuitem', { name: 'Associated records right' }).hover();
    await page.getByRole('menuitem', { name: 'Roles' }).click();
    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CardItem-roles-form')).toBeVisible();

    // 2. 通过 Other records 创建一个创建表单区块
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'form Form (Add new) right' }).hover();
    await page.getByRole('menuitem', { name: 'Other records right' }).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();
    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CardItem-users-form')).toBeVisible();
  });
});

test.describe('configure fields', () => {
  test('display collection fields & display association fields & add text', async ({ page, mockPage }) => {
    await mockPage(oneEmptyForm).goto();

    // collection fields
    await page.getByLabel('schema-initializer-Grid-form:configureFields-general').hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch')).toBeChecked();

    // add association fields
    await page.getByRole('menuitem', { name: 'Many to one right' }).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    await page.getByRole('menuitem', { name: 'Many to one right' }).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.id-ID')).toBeVisible();
    await expect(page.getByLabel('block-item-CollectionField-general-form-users.nickname-Nickname')).toBeVisible();

    // delete fields
    await page.getByLabel('schema-initializer-Grid-form:configureFields-general').hover();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true })).toHaveCount(1);
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch')).not.toBeChecked();

    await page.getByRole('menuitem', { name: 'Many to one right' }).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    await page.getByRole('menuitem', { name: 'Many to one right' }).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.id-ID')).not.toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-general-form-general.manyToOne.nickname'),
    ).not.toBeVisible();

    // add markdown
    await page.getByLabel('schema-initializer-Grid-form:configureFields-general').hover();
    await page.getByRole('menuitem', { name: 'Add Markdown' }).click();
    await expect(page.getByLabel('block-item-Markdown.Void-general-form')).toBeVisible();
  });

  test.pgOnly('display inherit fields', async ({ page, mockPage }) => {
    await mockPage(oneFormWithInheritFields).goto();

    // 在表单中选择继承的字段
    await page.getByLabel('schema-initializer-Grid-form:').hover();
    await page.getByRole('menuitem', { name: 'parentField1' }).click();
    await page.getByRole('menuitem', { name: 'parentField2' }).click();
    await page.mouse.move(300, 0);
    await expect(
      page.getByLabel('block-item-CollectionField-child-form-child.parentField1-parentField1').getByRole('textbox'),
    ).toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-child-form-child.parentField2-parentField2').getByRole('textbox'),
    ).toBeVisible();
  });
});

test.describe('configure actions', () => {
  test('submit', async ({ page, mockPage }) => {
    await mockPage(oneEmptyForm).goto();

    await page.getByLabel('schema-initializer-ActionBar-createForm:configureActions-general').hover();

    // add button
    await page.getByRole('menuitem', { name: 'Submit' }).click();
    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Submit' })).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();

    // delete button
    await deleteButton(page, 'Submit');
    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Submit' })).not.toBeVisible();
  });

  // https://nocobase.height.app/T-3106
  test('subTable: should clear form value after submit', async ({ page, mockPage }) => {
    await mockPage(T3106).goto();

    await page.locator('.nb-sub-table-addNew').click();
    await expect(
      page.getByLabel('block-item-CollectionField-users-form-users.nickname-Nickname').getByRole('textbox'),
    ).toHaveValue('test name');

    // 点击提交后，应该清空子表格中的值
    await page.getByLabel('action-Action-Submit-submit-').click();
    await expect(
      page.getByLabel('block-item-CollectionField-users-form-users.nickname-Nickname').getByRole('textbox'),
    ).toBeHidden();
    await page.mouse.move(600, 0);

    // 再次点击添加按钮，默认值应该正常显示出来
    await page.locator('.nb-sub-table-addNew').click();
    await expect(
      page.getByLabel('block-item-CollectionField-users-form-users.nickname-Nickname').getByRole('textbox'),
    ).toHaveValue('test name');
  });

  // https://nocobase.height.app/T-4350/description
  test('subTable: should clear subTable after submit', async ({ page, mockPage }) => {
    await mockPage(T4350).goto();

    // 1. 填入 Nickname
    await page
      .getByLabel('block-item-CollectionField-users-form-users.nickname-Nickname')
      .getByRole('textbox')
      .fill('123456');

    // 2. 添加一行子表格数据，其中显示刚填入的值
    await page.locator('.nb-sub-table-addNew').click();
    await expect(
      page.getByLabel('block-item-CollectionField-roles-form-roles.name-Role UID').getByRole('textbox'),
    ).toHaveValue('123456');
    await expect(
      page.getByLabel('block-item-CollectionField-roles-form-roles.title-Role name').getByRole('textbox'),
    ).toHaveValue('123456');

    // 3. 点击提交按钮，子表格数据应该被清空
    await page.getByLabel('action-Action-Submit-submit-').click();
    await page.waitForTimeout(500);
    await expect(
      page.getByLabel('block-item-CollectionField-roles-form-roles.title-Role name').getByRole('textbox'),
    ).toBeHidden();
  });

  // https://nocobase.height.app/T-3469
  test('default values for fields should not be cleared after submission', async ({ page, mockPage }) => {
    await mockPage(T3469).goto();

    // username 的值不能重复，所以为了避免报错这里随机生成一个值
    const username = uid();

    // Username 字段没有设置默认值，手动输入一个值
    await page
      .getByLabel('block-item-CollectionField-users-form-users.username-Username')
      .getByRole('textbox')
      .fill(username);

    // Nickname 字段设置了默认值，应该显示出默认值
    await expect(
      page.getByLabel('block-item-CollectionField-users-form-users.nickname-Nickname').getByRole('textbox'),
    ).toHaveValue('Should be cleared after submission');
    await expect(
      page.getByLabel('block-item-CollectionField-users-form-users.username-Username').getByRole('textbox'),
    ).toHaveValue(username);

    // 点击提交按钮之后，Nickname 字段的默认值应该依然显示，Username 字段的值应该被清空
    await page.getByLabel('action-Action-Submit-submit-').click();

    await expect(
      page.getByLabel('block-item-CollectionField-users-form-users.nickname-Nickname').getByRole('textbox'),
    ).toHaveValue('Should be cleared after submission');
    await expect(
      page.getByLabel('block-item-CollectionField-users-form-users.username-Username').getByRole('textbox'),
    ).toHaveValue('');
  });
});
