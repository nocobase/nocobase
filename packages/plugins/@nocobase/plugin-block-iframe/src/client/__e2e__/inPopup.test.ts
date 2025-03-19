/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { T4940 } from './templates';

test.describe('iframe in popup', () => {
  test('open popup, then close it, that should work', async ({ page, mockPage }) => {
    await mockPage(T4940).goto();

    // 1. Open popup and verify iframe is visible
    await page.getByLabel('action-Action.Link-View-view-').click();
    await expect(page.getByLabel('block-item-Iframe-users-iframe')).toBeVisible();

    // 2. Close popup and verify iframe is hidden
    await page.getByLabel('drawer-Action.Container-users-View record-mask').click();
    await expect(page.getByLabel('block-item-Iframe-users-iframe')).not.toBeVisible();

    // 3. Reopen popup and verify iframe is visible again
    await page.getByLabel('action-Action.Link-View-view-').click();
    await expect(page.getByLabel('block-item-Iframe-users-iframe')).toBeVisible();
  });
});
