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

    // open popup, then can see the iframe
    await page.getByLabel('action-Action.Link-View-view-').click();
    await expect(page.getByLabel('block-item-Iframe-users-iframe')).toBeVisible();

    // close popup
    await page.getByLabel('drawer-Action.Container-users-View record-mask').click();
    await expect(page.getByLabel('block-item-Iframe-users-iframe')).not.toBeVisible();

    // then open popup again, that should work
    await page.getByLabel('action-Action.Link-View-view-').click();
    await expect(page.getByLabel('block-item-Iframe-users-iframe')).toBeVisible();
  });
});
