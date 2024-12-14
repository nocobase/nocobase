/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';

test.describe('pagination', () => {
  test('basic', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage({
      collections: [
        {
          name: 'collectionName',
        },
      ],
    }).waitForInit();
    await mockRecords('collectionName', 60);
    await nocoPage.goto();

    // 1. 创建一个 Table
    await page.getByLabel('schema-initializer-Grid-page:').hover();
    await page.getByRole('menuitem', { name: 'Table right' }).hover();
    await page.getByRole('menuitem', { name: 'collectionName' }).click();
    // 显示出 ID
    await page.getByLabel('schema-initializer-TableV2-').hover();
    await page.getByRole('menuitem', { name: 'ID' }).click();
    // 初始状态下，会显示 20 条数据，所以会包含 ID 为 11 的数据
    await expect(page.getByRole('button', { name: '11', exact: true })).toBeVisible();

    // 2. 应该显示成类似这个样子：Total 60 items < 1 2 3 > 20/page
    await expect(page.getByText('Total 60 items12320 / page')).toBeVisible();

    // 3. 切换页面
    await page.getByRole('listitem', { name: '2' }).locator('a').click();
    // 分页器的文案保持不变
    await expect(page.getByText('Total 60 items12320 / page')).toBeVisible();
    // 因为切换到了第二页，所以会显示 ID 为 31 的数据
    await expect(page.getByRole('button', { name: '31', exact: true })).toBeVisible();
  });
});
