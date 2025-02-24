/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';

test.skip('save as template', () => {
  test.skip('save as template, then delete it', async ({ page, mockPage, clearBlockTemplates }) => {
    // 1. 创建一个区块，然后保存为模板
    await mockPage().goto();
    await page.getByLabel('schema-initializer-Grid-page:').hover();
    await page.getByRole('menuitem', { name: 'Table right' }).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();
    await page.getByLabel('block-item-CardItem-users-').hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:table-users').hover();
    await page.getByRole('menuitem', { name: 'Save as template' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 2. 删除模板
    await clearBlockTemplates({ immediate: true });

    // 3. 再次回到页面，应该显示“模板已删除字样”
    await page.reload();
    await expect(page.getByText('The block template "')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
  });
});
