/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { T5084 } from './templates';

test.describe('Add new: inherit', () => {
  test('creating block by child collection should work correctly', async ({ page, mockPage }) => {
    await mockPage(T5084).goto();

    // 1. click the "Add new" button, and then create a block, the block's collection should be "parent"
    await page.getByRole('button', { name: 'plus Add new' }).click();
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'Form right' }).hover();
    await page.getByRole('menuitem', { name: 'Current collection' }).click();
    await page.getByLabel('block-item-CardItem-parent-form').hover();
    await expect(page.getByLabel('block-item-CardItem-parent-form').getByText('parent')).toBeVisible();
    // close popup
    await page.getByLabel('drawer-Action.Container-parent-Add record-mask').click();

    // 2. click the "child1" option, and then create a block, the block's collection should be "child1"
    await page.getByRole('button', { name: 'down' }).hover();
    await page.getByRole('menuitem', { name: 'child1' }).click();
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'Form right' }).hover();
    await page.getByRole('menuitem', { name: 'Current collection' }).click();
    await page.getByLabel('block-item-CardItem-child1-').hover();
    await expect(page.getByLabel('block-item-CardItem-child1-').getByText('child1')).toBeVisible();
    // close popup
    await page.getByLabel('drawer-Action.Container-child1-Add record-mask').click();

    // 3. click the "child2" option, and then create a block, the block's collection should be "child2"
    await page.getByRole('button', { name: 'down' }).hover();
    await page.getByRole('menuitem', { name: 'child2' }).click();
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'Form right' }).hover();
    await page.getByRole('menuitem', { name: 'Current collection' }).click();
    await page.getByLabel('block-item-CardItem-child2-').hover();
    await expect(page.getByLabel('block-item-CardItem-child2-').getByText('child2')).toBeVisible();
  });
});
