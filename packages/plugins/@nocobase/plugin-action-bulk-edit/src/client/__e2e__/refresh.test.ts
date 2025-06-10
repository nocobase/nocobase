/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { afterConfiguringTheModalWhenReopeningItTheContentShouldPersist } from './utils';

test.describe('refresh', () => {
  test.skip('After configuring the modal, when reopening it, the content should persist', async ({
    mockPage,
    page,
  }) => {
    await mockPage(afterConfiguringTheModalWhenReopeningItTheContentShouldPersist).goto();

    // 1. 点击 Bulk edit 按钮，打开弹窗
    await page.getByLabel('action-Action-Bulk edit-').click();

    // 2. 新增一个表单区块
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'form Form' }).click();

    // 3. 新增一个名为 Nickname 的字段
    await page.getByLabel('schema-initializer-Grid-bulkEditForm:configureFields-users').hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    // 4. 关闭弹窗，然后再打开，刚才新增的字段应该还在
    await page.getByLabel('drawer-Action.Container-users-Bulk edit-mask').click();
    await page.getByLabel('action-Action-Bulk edit-').click();
    await expect(page.getByLabel('block-item-BulkEditField-').getByText('Nickname')).toBeVisible();
    await page.getByLabel('block-item-BulkEditField-').click();
  });
});
