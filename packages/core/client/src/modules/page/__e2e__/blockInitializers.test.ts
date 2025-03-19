/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { test, expect } from '@nocobase/test/e2e';

test.describe('page:addBlock', () => {
  test('当搜索不到数据时显示空状态', async ({ page, mockPage }) => {
    await mockPage().goto();
    await page.getByLabel('schema-initializer-Grid-').hover();
    await page.getByRole('menuitem', { name: 'Table right' }).hover();
    await page.getByRole('textbox', { name: 'Search and select collection' }).fill('no match');

    await expect(page.getByRole('menuitem', { name: 'No data' })).toBeVisible();
  });
});
