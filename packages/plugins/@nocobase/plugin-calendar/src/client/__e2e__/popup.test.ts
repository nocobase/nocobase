/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { clickingAndClosingNestedPopups } from './templates';

test.describe('Calendar popup', () => {
  test('clicking and closing nested popups', async ({ page, mockPage }) => {
    await mockPage(clickingAndClosingNestedPopups).goto();

    // 1. 打开第一层弹窗
    await page.getByLabel('action-Action.Link-View-view-').click();

    // 2. 打开第二层弹窗
    await page.getByLabel('block-item-CardItem-users-calendar').getByText('Super Admin').click();
    await expect(page.getByLabel('block-item-Markdown.Void-').getByText('Calendar popup.')).toBeVisible();

    // 3. 关闭第二层弹窗后，第一层弹窗应仍然存在
    await page.getByLabel('drawer-Action.Container-users').nth(2).click();
    await expect(page.getByLabel('block-item-CardItem-users-calendar').getByText('Super Admin')).toBeVisible();
  });
});
