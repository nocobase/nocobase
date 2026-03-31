/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { theAddBlockButtonInDrawerShouldBeVisible } from './templates';

test.describe('popup of duplicate', () => {
  test('the Add block button in drawer should be visible', async ({ page, mockPage }) => {
    await mockPage(theAddBlockButtonInDrawerShouldBeVisible).goto();

    // open subpage, anb then open the duplicate drawer, the Add block in drawer should be visible
    await page.getByLabel('action-Action.Link-open').click();
    await page.getByLabel('action-Action.Link-Duplicate').click();
    await expect(page.getByLabel('block-item-Markdown.Void-').getByText('Duplicate markdown 1.')).toBeVisible();
    await page.getByLabel('drawer-Action.Container-users-Duplicate-mask').click();

    // click other tab, then open the bulk edit drawer, the Add block in drawer should be visible
    await page.getByText('new tab').last().click();
    await page.getByLabel('action-Action.Link-Duplicate').click();
    await expect(page.getByLabel('block-item-Markdown.Void-').getByText('Duplicate markdown 2.')).toBeVisible();
  });
});
