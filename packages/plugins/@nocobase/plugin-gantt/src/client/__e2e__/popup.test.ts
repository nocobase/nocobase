/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { afterClosingThePopupItShouldRemainAtThePositionInTheSubpage } from './utils';

test.describe('popup', () => {
  test('after closing the popup, it should remain at the position in the subpage', async ({ page, mockPage }) => {
    await mockPage(afterClosingThePopupItShouldRemainAtThePositionInTheSubpage).goto();

    // 1. open subpage, and click event to open a drawer
    await page.getByLabel('action-Action.Link-open').click();
    await page.locator('.bar', { hasText: 'Super Admin' }).click({
      position: {
        x: 5,
        y: 5,
      },
    });
    await expect(page.getByLabel('block-item-CollectionField-')).toHaveText('Nickname:Super Admin');

    // 2. close drawer, should keep in subpage
    await page.getByLabel('drawer-Action.Drawer-users-View record-mask').click();
    await expect(page.locator('.bar', { hasText: 'Super Admin' })).toBeVisible();
  });
});
