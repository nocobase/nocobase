/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';

test.describe('data scope in action permission', () => {
  // TODO: 本地可以跑通，但是在 github actions 里面跑不通，先 skip 掉
  test.skip('should no Current form and Current popup variables', async ({ page }) => {
    await page.goto('/admin/settings/users-permissions/roles');

    await page.getByRole('tab', { name: 'Data sources' }).click();
    await page.getByLabel('action-Action.Link-Configure-').click();
    await page
      .getByTestId('drawer-Action.Drawer-dataSources-Configure permissions')
      .getByText('Action permissions', { exact: true })
      .click();
    await page.getByLabel('action-Action.Link-Configure-dataSourcesCollections-users', { exact: true }).click();
    await page.getByLabel('Individual').check();
    await page
      .getByTestId('drawer-Action.Drawer-dataSourcesCollections-Configure permission')
      .locator('.ant-table-row', { hasText: 'View' })
      .locator('.ant-select-selector')
      .click();
    await page
      .getByLabel(
        'action-Action.Link-Edit-update-dataSources/main/rolesResourcesScopes-table-selector-{{t("Own records")}}',
        { exact: true },
      )
      .click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByLabel('variable-button').click();

    await expect(page.getByRole('menuitemcheckbox', { name: 'Current role' })).toBeVisible();
    await expect(page.getByRole('menuitemcheckbox', { name: 'Current form' })).not.toBeVisible();
    await expect(page.getByRole('menuitemcheckbox', { name: 'Current popup record' })).not.toBeVisible();
    await expect(page.getByRole('menuitemcheckbox', { name: 'Parent popup record' })).not.toBeVisible();
  });
});
