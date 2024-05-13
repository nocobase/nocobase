/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { newTableBlock, oneTableBlock } from './utils';

test.describe('destroy', () => {
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
    await expect(page.getByLabel('action-Action-Delete-destroy-general-table')).not.toBeVisible();
    await updateRole({
      name: roleData.name,
      strategy: {
        actions: ['view', 'destroy'],
      },
    });
    await page.reload();
    await expect(page.getByLabel('action-Action-Delete-destroy-general-table')).toBeVisible();
  });
  test('individual collection permission', async ({ page, mockPage, mockRole, mockRecord, updateRole }) => {
    await mockPage().goto();
    //新建角色并切换到新角色
    const roleData = await mockRole({
      allowNewMenu: true,
      strategy: {
        actions: ['destroy'],
      },
      resources: [
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [{ name: 'view' }],
        },
      ],
    });
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await mockPage(oneTableBlock).goto();
    await mockRecord('general');
    await expect(page.getByLabel('block-item-CardItem-general-table')).toBeVisible();
    await expect(page.getByLabel('action-Action-Delete-destroy-general-table')).not.toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Delete')).not.toBeVisible();

    await updateRole({
      name: roleData.name,
      resources: [
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [
            {
              name: 'view',
            },
            { name: 'destroy' },
          ],
        },
      ],
    });
    await page.reload();
    await expect(page.getByLabel('action-Action-Delete-destroy-general-table')).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Delete')).toBeVisible();
  });
  test('individual collection permission support new data block', async ({
    page,
    mockPage,
    mockRole,
    mockRecord,
    updateRole,
  }) => {
    await mockPage().goto();
    //新建角色并切换到新角色
    const roleData = await mockRole({
      allowNewMenu: true,
      strategy: {
        actions: ['destroy'],
      },
      resources: [
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [{ name: 'view' }],
        },
      ],
    });
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await mockPage(newTableBlock).goto();
    await mockRecord('general');
    await expect(page.getByLabel('block-item-CardItem-general-table')).toBeVisible();
    await expect(page.getByLabel('action-Action-Delete-destroy-general-table')).not.toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Delete-')).not.toBeVisible();
    await updateRole({
      name: roleData.name,
      resources: [
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [
            {
              name: 'view',
            },
            { name: 'destroy' },
          ],
        },
      ],
    });
    await page.reload();
    await expect(page.getByLabel('action-Action-Delete-destroy-general-table')).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Delete-')).toBeVisible();
  });
});
