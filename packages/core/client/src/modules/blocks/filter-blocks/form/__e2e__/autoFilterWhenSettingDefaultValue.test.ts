/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { oneFilterFormAndTable } from './templates';

test.describe('filter form', () => {
  test('When the filter form field is set with a default value, it should trigger a filtering action on the first page load', async ({
    page,
    mockPage,
    mockRecord,
  }) => {
    // 页面中筛选表单的 Nickname 字段已经设置了默认值，且 Nickname 字段的筛选操作符为 "is not"
    const nocoPage = await mockPage(oneFilterFormAndTable).waitForInit();
    await mockRecord('users', { nickname: 'test name' });
    await nocoPage.goto();

    // 1. 首次加载，应该已经触发过一次筛选的动作
    await expect(
      page.getByLabel('block-item-CardItem-users-table').getByRole('button', { name: 'test name' }),
    ).toBeVisible();
    await expect(
      page.getByLabel('block-item-CardItem-users-table').getByRole('button', { name: 'Super Admin' }),
    ).not.toBeVisible();

    // 2. 点击重置按钮后，会显示出全部数据
    await page.getByLabel('action-Action-Reset-users-').click({
      position: {
        x: 10,
        y: 10,
      },
    });
    await expect(
      page.getByLabel('block-item-CardItem-users-table').getByRole('button', { name: 'Super Admin' }),
    ).toBeVisible();
    await expect(
      page.getByLabel('block-item-CardItem-users-table').getByRole('button', { name: 'test name' }),
    ).toBeVisible();

    // 3. 再次点击筛选按钮，应该只显示出符合条件的数据
    await page.getByLabel('action-Action-Filter-submit-').click({
      position: {
        x: 10,
        y: 10,
      },
    });
    await expect(
      page.getByLabel('block-item-CardItem-users-table').getByRole('button', { name: 'Super Admin' }),
    ).not.toBeVisible();
    await expect(
      page.getByLabel('block-item-CardItem-users-table').getByRole('button', { name: 'test name' }),
    ).toBeVisible();
  });
});
