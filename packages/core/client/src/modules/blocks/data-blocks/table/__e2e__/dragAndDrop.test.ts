/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, oneEmptyTableBlockBasedOnUsers, test } from '@nocobase/test/e2e';

// 该测试总是在 CI 环境失败，但是本地运行是正常的，原因未知，现 skip 处理
test.skip('actions', async ({ page, mockPage }) => {
  await mockPage(oneEmptyTableBlockBasedOnUsers).goto();
  await page.getByLabel('schema-initializer-ActionBar-table:configureActions-users').hover();
  //  添加按钮
  await page.getByRole('menuitem', { name: 'Add new' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('menuitem', { name: 'Refresh' }).click();
  // 向右挪动鼠标指针，用以关闭下拉列表
  await page.mouse.move(300, 0);

  await page.getByLabel('action-Action-Add new-create-users-table').hover();
  await page.getByLabel('action-Action-Add new-create-users-table').getByLabel('designer-drag').hover();

  await page
    .getByLabel('action-Action-Add new-create-users-table')
    .getByLabel('designer-drag')
    .dragTo(page.getByLabel('action-Action-Delete-destroy-users-table'));

  await page.getByLabel('action-Action-Add new-create-users-table').hover();
  await page
    .getByLabel('action-Action-Add new-create-users-table')
    .getByLabel('designer-drag')
    .dragTo(page.getByLabel('action-Action-Refresh-refresh-users-table'));

  const addNew = await page.getByLabel('action-Action-Add new-create-users-table').boundingBox();
  const del = await page.getByLabel('action-Action-Delete-destroy-users-table').boundingBox();
  const refresh = await page.getByLabel('action-Action-Refresh-refresh-users-table').boundingBox();

  expect(addNew.x).toBeGreaterThan(refresh.x);
  expect(refresh.x).toBeGreaterThan(del.x);
});

test('fields', async () => {});
