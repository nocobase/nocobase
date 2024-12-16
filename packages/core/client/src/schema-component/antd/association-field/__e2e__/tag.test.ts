/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { shouldRefreshBlockImmediatelyAfterDataChanges } from './template';

test.describe('tag in details block', () => {
  test('should refresh block immediately after data changes', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(shouldRefreshBlockImmediatelyAfterDataChanges).waitForInit();
    await mockRecord('test', { manyToOne: 'admin' });
    await nocoPage.goto();

    // 1. 一开始字段值显示的是 ‘admin’
    await expect(page.getByLabel('block-item-CollectionField-').getByText('admin')).toBeVisible();

    // 2. 修改数据后，字段值应立即刷新
    await page.getByLabel('action-Action-Edit-update-').click();
    await page.getByTestId('select-object-single').click();
    await page.getByRole('option', { name: 'member' }).click();
    await page.getByLabel('action-Action-Submit-submit-').click();

    await page.waitForTimeout(1000);
    await expect(page.getByLabel('block-item-CollectionField-').getByText('member')).toBeVisible();
  });
});
