/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { hideColumnBasic } from './templatesOfBug';

test.describe('hide column', () => {
  test('basic', async ({ page, mockPage }) => {
    await mockPage(hideColumnBasic).goto();

    // 1. Normal table: hide column
    await page.getByRole('button', { name: 'Nickname' }).hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-users' })
      .hover();
    await page.getByRole('menuitem', { name: 'Hide column question-circle' }).click();
    await page.mouse.move(500, 0);
    await page.getByLabel('block-item-CardItem-users-form').click();

    // 2. Sub table: hide column
    await page.getByRole('button', { name: 'Role name' }).hover();
    await page.getByRole('menuitem', { name: 'Hide column question-circle' }).waitFor({ state: 'detached' });
    await page
      .getByRole('button', { name: 'designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-roles' })
      .hover();
    await page.getByRole('menuitem', { name: 'Hide column question-circle' }).click();
    await page.mouse.move(500, 0);

    // Assert: In configuration mode, the entire column becomes transparent
    await expect(page.locator('th', { hasText: 'Nickname' })).toHaveCSS('opacity', '0.3');
    await expect(page.locator('th', { hasText: 'Role name' })).toHaveCSS('opacity', '0.3');

    // Assert: In non-configuration mode, the entire column will be hidden
    await page.getByTestId('ui-editor-button').click();
    await expect(page.locator('th', { hasText: 'Nickname' })).not.toBeVisible();
    await expect(page.locator('th', { hasText: 'Role name' })).not.toBeVisible();
  });
});
