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

test.describe('export', () => {
  test('general permission', async ({ page, mockPage, mockRole, updateRole }) => {
    await mockPage(oneTableBlock).goto();
    //新建角色并切换到新角色
    const roleData = await mockRole({
      strategy: {
        actions: ['view'],
      },
      allowNewMenu: true,
    });
    await mockPage(oneTableBlock).goto();
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await expect(page.getByLabel('action-Action-Export')).not.toBeVisible();
    await updateRole({
      name: roleData.name,
      strategy: {
        actions: ['view', 'export'],
      },
    });
    await page.reload();
    await expect(page.getByLabel('action-Action-Export')).toBeVisible();
  });
  test('individual collection permission', async ({ page, mockPage, mockRole }) => {
    await mockPage().goto();
    //新建角色并切换到新角色
    const roleData = await mockRole({
      allowNewMenu: true,
      resources: [
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [
            { name: 'view' },
            {
              name: 'export',
              scope: null,
            },
          ],
        },
      ],
    });
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await mockPage(oneTableBlock).goto();
    await expect(page.getByLabel('action-Action-Export')).toBeVisible();
  });
});

test.describe('import', () => {
  test('general permission', async ({ page, mockPage, mockRole, updateRole }) => {
    await mockPage().goto();
    //新建角色并切换到新角色
    const roleData = await mockRole({
      strategy: {
        actions: ['view'],
      },
      allowNewMenu: true,
    });
    await mockPage(oneTableBlock).goto();
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await expect(page.getByLabel('action-Action-Import')).not.toBeVisible();
    await updateRole({
      name: roleData.name,
      strategy: {
        actions: ['view', 'importXlsx'],
      },
    });
    await page.reload();
    await expect(page.getByLabel('action-Action-Import')).toBeVisible();
  });
  test('individual collection permission', async ({ page, mockPage, mockRole }) => {
    await mockPage().goto();
    //新建角色并切换到新角色
    const roleData = await mockRole({
      allowNewMenu: true,
      resources: [
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [
            { name: 'view' },
            {
              name: 'importXlsx',
              scope: null,
            },
          ],
        },
      ],
    });
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await mockPage(oneTableBlock).goto();
    await expect(page.getByLabel('action-Action-Import')).toBeVisible();
  });
});
