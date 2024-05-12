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

test.describe('create', () => {
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
    await expect(page.getByLabel('block-item-CardItem-general-table')).toBeVisible();
    await expect(page.getByLabel('action-Action-Add new-create-general-table')).not.toBeVisible();
    await updateRole({
      name: roleData.name,
      strategy: {
        actions: ['view', 'create'],
      },
    });
    await page.reload();
    await expect(page.getByLabel('action-Action-Add new-create-general-table')).toBeVisible();
  });
  test('individual collection permission', async ({ page, mockPage, mockRole, updateRole }) => {
    await mockPage(oneTableBlock).goto();
    //新建角色并切换到新角色
    const roleData = await mockRole({
      allowNewMenu: true,
      strategy: {
        actions: ['create'],
      },
      resources: [
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [
            {
              name: 'view',
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
    await expect(page.getByLabel('block-item-CardItem-general-table')).toBeVisible();
    await expect(page.getByLabel('action-Action-Add new-create-general-table')).not.toBeVisible();
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
            { name: 'create' },
          ],
        },
      ],
    });
    await page.reload();
    await expect(page.getByLabel('action-Action-Add new-create-general-table')).toBeVisible();
  });
  test('individual collection permission width fields', async ({ page, mockPage, mockRole }) => {
    await mockPage(oneTableBlock).goto();
    //新建角色并切换到新角色
    const roleData = await mockRole({
      allowNewMenu: true,
      resources: [
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [
            {
              name: 'view',
              fields: ['id', 'singleLineText'],
              scope: null,
            },
            {
              name: 'create',
              fields: ['singleLineText'],
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
    await expect(page.getByLabel('action-Action-Add new-create-general-table')).toBeVisible();
    await page.getByLabel('action-Action-Add new-create-general-table').click();
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.singleLineText')).toBeVisible();
  });
});
