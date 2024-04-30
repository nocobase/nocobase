/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, tabPageEmpty, test } from '@nocobase/test/e2e';

test('add tab', async ({ page, mockPage }) => {
  await mockPage(tabPageEmpty).goto();

  // add tab page
  await page.getByLabel('schema-initializer-Page-tabs').click();
  await page.getByRole('textbox').click();
  await page.getByRole('textbox').fill('tab1');
  await page.getByRole('button', { name: 'OK', exact: true }).click();

  await expect(page.getByText('tab1', { exact: true })).toBeVisible();
});
