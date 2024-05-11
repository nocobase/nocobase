/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { oneTableBlock } from './utils';

test.describe('view', () => {
  test('general permission', async ({ page, mockPage, mockRole, updateRole }) => {
    await mockPage(oneTableBlock).goto();
    //新建角色并切换到新角色
    const roleData = await mockRole({
      allowNewMenu: true,
    });
    await mockPage(oneTableBlock).goto();
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await expect(page.getByLabel('block-item-CardItem-general-table')).not.toBeVisible();
    await updateRole({
      name: roleData.name,
      strategy: {
        actions: ['view'],
      },
    });
    await page.reload();
    await expect(page.getByLabel('block-item-CardItem-general-table')).toBeVisible();
  });
  test('individual collection permission', async ({ page, mockPage, mockRole, mockRecord, updateRole }) => {
    await mockPage(oneTableBlock).goto();
    await mockRecord('general');
    //新建角色并切换到新角色
    const roleData = await mockRole({
      allowNewMenu: true,
      strategy: {
        actions: ['view'],
      },
      resources: [
        {
          usingActionsConfig: true,
          name: 'general',
        },
      ],
    });
    await mockPage(oneTableBlock).goto();
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await expect(page.getByLabel('block-item-CardItem-general-table')).not.toBeVisible();
    await updateRole({
      name: roleData.name,
      resources: [
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [{ name: 'view', fields: [] }],
        },
      ],
    });
    await page.reload();
    await expect(page.getByLabel('block-item-CardItem-general-table')).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-View')).toBeVisible();
    await expect(page.getByRole('button', { name: 'singleLineText' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'phone' })).not.toBeVisible();
  });
  test('individual collection permission with fields', async ({ page, mockPage, mockRole }) => {
    await mockPage(oneTableBlock).goto();
    //新建角色并切换到新角色
    const roleData = await mockRole({
      allowNewMenu: true,
      resources: [
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [{ name: 'view', fields: ['singleLineText'] }],
        },
      ],
    });
    await mockPage(oneTableBlock).goto();
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    //特定字段有权限
    await expect(page.getByLabel('block-item-CardItem-general-table')).toBeVisible();
    await expect(page.getByRole('button', { name: 'singleLineText' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'phone' })).not.toBeVisible();
  });
});
