/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';

test('create Attachment (URL) field', async ({ page }) => {
  await page.goto('/admin/settings/data-source-manager/main/collections?type=main');
  await page.getByLabel('action-Action.Link-Configure fields-collections-users', { exact: true }).click();
  await page.getByRole('button', { name: 'plus Add field' }).click();
  await page.getByRole('menuitem', { name: 'Attachment (URL)' }).click();
  const displayName = `a${Math.random().toString(36).substring(7)}`;
  const name = `a${Math.random().toString(36).substring(7)}`;
  await page.getByLabel('block-item-Input-fields-Field display name').getByRole('textbox').fill(displayName);
  await page.getByLabel('block-item-Input-fields-Field name').getByRole('textbox').fill(name);
  await expect(page.getByLabel('block-item-RemoteSelect-')).toBeVisible();
  await page.getByLabel('action-Action-Submit-fields-').click();
  await expect(page.getByText(name)).toBeVisible();

  // 删除
  await page.getByLabel(`action-CollectionFields-Delete-fields-${name}`).click();
  await page.getByRole('button', { name: 'OK', exact: true }).click();
});
