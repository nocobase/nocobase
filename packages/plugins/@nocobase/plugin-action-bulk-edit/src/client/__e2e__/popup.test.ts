/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { theAddBlockButtonInDrawerShouldBeVisible } from './utils';

test.describe('popup of bulk edit', () => {
  test('the Add block button in drawer should be visible', async ({ page, mockPage }) => {
    await mockPage(theAddBlockButtonInDrawerShouldBeVisible).goto();

    // open subpage, anb then open the bulk edit drawer, the Add block in drawer should be visible
    await page.getByLabel('action-Action.Link-open').click();
    await page.getByLabel('action-Action-Bulk edit 1-').click();
    await expect(
      page.getByTestId('drawer-Action.Container-users-Bulk edit').getByLabel('schema-initializer-Grid-popup'),
    ).toBeVisible();
    await page.getByLabel('drawer-Action.Container-users-Bulk edit-mask').click();

    // click other tab, then open the bulk edit drawer, the Add block in drawer should be visible
    await page.getByText('new tab').click();
    await page.getByLabel('action-Action-Bulk edit 2-').click();
    await expect(
      page.getByTestId('drawer-Action.Container-users-Bulk edit').getByLabel('schema-initializer-Grid-popup'),
    ).toBeVisible();
  });
});
