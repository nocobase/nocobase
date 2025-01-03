/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';

test('menu permission ', async ({ page, mockPage, mockRole, updateRole }) => {
  const page2 = mockPage({ name: 'page2' });
  const page1 = mockPage({ name: 'page1' });
  await page1.goto();
  const uid1 = await page1.getUid();
  const uid2 = await page2.getUid();
  //新建角色并切换到新角色，page1有权限,page2无权限
  const roleData = await mockRole({
    snippets: ['pm.*'],
    strategy: {
      actions: ['view', 'update'],
    },
    menuUiSchemas: [uid1],
  });
  await page.evaluate((roleData) => {
    window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
  }, roleData);
  await page.reload();
  await expect(page.getByLabel('page1')).toBeVisible();
  await expect(page.getByLabel('page2')).not.toBeVisible();
  await page.getByTestId('plugin-settings-button').hover();
  await page.getByRole('link', { name: 'Users & Permissions' }).click();
  await page.getByText('Roles & Permissions').click();
  await page
    .getByRole('menuitem', { name: `${roleData.name}` })
    .locator('span')
    .nth(1)
    .click();
  await page.getByRole('tab').getByText('Desktop routes').click();
  await page.waitForTimeout(1000);
  await expect(page.getByRole('row', { name: 'page1' }).locator('.ant-checkbox-input').last()).toBeChecked({
    checked: true,
  });
  await expect(page.getByRole('row', { name: 'page2' }).locator('.ant-checkbox-input')).toBeChecked({ checked: false });
  //修改菜单权限，page1无权限,page2有权限
  await updateRole({ name: roleData.name, menuUiSchemas: [uid2] });
  await page.reload();
  await expect(page.getByLabel('page2')).toBeVisible();
  await expect(page.getByLabel('page1')).not.toBeVisible();
  await page.getByTestId('plugin-settings-button').hover();
  await page.getByRole('link', { name: 'Users & Permissions' }).click();
  await page.getByText('Roles & Permissions').click();
  await page.getByText(`${roleData.name}`).click();
  await page
    .getByRole('menuitem', { name: `${roleData.name}` })
    .locator('span')
    .nth(1)
    .click();
  await page.getByRole('tab').getByText('Desktop routes').click();
  await page.waitForTimeout(1000);
  await expect(page.getByRole('row', { name: 'page1' }).locator('.ant-checkbox-input').last()).toBeChecked({
    checked: false,
  });
  await expect(page.getByRole('row', { name: 'page2' }).locator('.ant-checkbox-input')).toBeChecked({ checked: true });
  //通过路由访问无权限的菜单,跳到有权限的第一个菜单
  await page.goto(`/admin/${uid1}`);
  await expect(page.locator('.nb-page-wrapper')).toBeVisible();
  expect(page.url()).toContain(uid2);
});

// TODO: this is not stable
test.skip('i18n should not fallbackNS', async ({ page }) => {
  await page.goto('/admin/settings/system-settings');

  // 创建 Users 页面
  await page.getByTestId('schema-initializer-Menu-header').hover();
  await page.getByRole('menuitem', { name: 'Page' }).click();
  await page.getByLabel('block-item-Input-Menu item').getByRole('textbox').click();
  await page.getByLabel('block-item-Input-Menu item').getByRole('textbox').fill('Users');
  await page.getByRole('button', { name: 'OK' }).click();
  await expect(page.getByLabel('Users')).toBeVisible();
  await expect(page.getByLabel('用户')).not.toBeVisible();

  // 添加中文选项
  await page.reload();
  await page.getByTestId('select-multiple').click();
  await page.getByRole('option', { name: '简体中文 (zh-CN)' }).click();
  await page.getByLabel('action-Action-Submit').click();

  // 切换为中文
  await page.getByTestId('user-center-button').click();
  await page.getByText('LanguageEnglish').click();
  await page.getByRole('option', { name: '简体中文' }).click();

  // await page.reload();

  // 应该显示 Users 而非中文 “用户”
  await expect(page.getByLabel('Users')).toBeVisible();
  await expect(page.getByLabel('用户')).not.toBeVisible();

  // 删除中文
  await page.getByLabel('简体中文 (zh-CN)').getByLabel('icon-close-tag').click();
  await page.getByLabel('action-Action-提交').click();

  // 删除 Users 页面
  await page.getByLabel('Users').hover();
  await page.getByLabel('designer-schema-settings-Menu').hover();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'OK' }).click();
});
