/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';

test.describe('SchemaToolbar', () => {
  test('initializer: block should be immediately visible after being added', async ({ page, mockPage }) => {
    await mockPage().goto();

    // 1. 添加一个区块
    await page.getByLabel('schema-initializer-Grid-page:').hover();
    await page.getByRole('menuitem', { name: 'Table right' }).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();

    // 2. 通过区块右上角的 initializer 按钮，添加另一个区块，区块应该立即显示在页面中
    await page.getByLabel('block-item-CardItem-users-').hover();
    await page.getByLabel('designer-schema-initializer-CardItem-blockSettings:table-users').hover();
    await page.getByRole('menuitem', { name: 'Markdown' }).click();
    await expect(page.getByLabel('block-item-Markdown.Void-')).toBeVisible();
  });
});
