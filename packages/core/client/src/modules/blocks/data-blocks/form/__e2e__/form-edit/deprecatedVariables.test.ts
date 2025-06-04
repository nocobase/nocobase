/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { oneTableWithUsersForDeprecatedVariables } from '../form-create/templatesOfBug';

test.describe('deprecated variables', () => {
  test.skip('current record', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneTableWithUsersForDeprecatedVariables).goto();

    // 1. 已设置过 Current record 的变量依然能正常显示
    await page.getByLabel('action-Action.Link-Edit').click();
    await page.getByLabel('block-item-CardItem-users-form').hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:editForm-users').hover();
    await page.getByRole('menuitem', { name: 'Field linkage rules' }).click();
    await expect(page.getByLabel('variable-tag').getByText('Current record / Nickname')).toBeVisible();

    // 2. 但是变量列表中是禁用状态
    await page.locator('button').filter({ hasText: /^x$/ }).last().click();
    await page.getByRole('menuitemcheckbox', { name: 'Current record right' }).hover({ position: { x: 40, y: 12 } });
    await expect(page.getByRole('tooltip', { name: 'This variable has been deprecated' })).toBeVisible();
    await expect(page.getByRole('menuitemcheckbox', { name: 'Current record right' })).toHaveClass(
      new RegExp('ant-cascader-menu-item-disabled'),
    );
    await page.mouse.move(0, 300);
    // 使下拉菜单消失
    await page.getByLabel('Linkage rules').getByText('Linkage rules').click();

    // 表达式输入框也是一样
    await page.getByText('xSelect a variable').click();
    await expect(page.getByRole('menuitemcheckbox', { name: 'Current record right' })).toHaveCount(1);
    await page.getByRole('menuitemcheckbox', { name: 'Current record right' }).hover({ position: { x: 40, y: 12 } });
    await expect(page.getByRole('tooltip', { name: 'This variable has been deprecated' })).toBeVisible();
    await expect(page.getByRole('menuitemcheckbox', { name: 'Current record right' })).toHaveClass(
      new RegExp('ant-cascader-menu-item-disabled'),
    );
    await page.mouse.move(0, 300);
    // 使下拉菜单消失
    await page.getByLabel('Linkage rules').getByText('Linkage rules').click();

    // 3. 当设置为其它变量后，再次打开，变量列表中的弃用变量不再显示
    await page.locator('button').filter({ hasText: /^x$/ }).last().click();
    await expect(page.getByRole('menuitemcheckbox', { name: 'Current form right' })).toHaveCount(1);
    await page.getByRole('menuitemcheckbox', { name: 'Current form right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Nickname' }).click();
    await expect(page.getByLabel('variable-tag').getByText('Current form / Nickname').last()).toBeVisible();
    // 清空表达式
    await page.getByLabel('textbox').clear();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 4. 再次打开弹窗，变量列表中的弃用变量不再显示
    await page.getByLabel('block-item-CardItem-users-form').hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:editForm-users').hover();
    await page.getByRole('menuitem', { name: 'Field linkage rules' }).click();
    await page.locator('button').filter({ hasText: /^x$/ }).last().click();
    await expect(page.getByRole('menuitemcheckbox', { name: 'Current record right' })).toBeHidden();
    // 使下拉菜单消失
    await page.getByLabel('Linkage rules').getByText('Linkage rules').click();

    // 表达式也是一样
    await page.getByText('xSelect a variable').click();
    await expect(page.getByRole('menuitemcheckbox', { name: 'Current record right' })).toBeHidden();
  });
});
