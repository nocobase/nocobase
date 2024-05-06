/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { test } from '@nocobase/test/e2e';

test('switch role', async ({ page, mockPage }) => {
  await mockPage().goto();

  await page.getByTestId('user-center-button').hover();
  await page.getByRole('menuitem', { name: 'Switch role' }).click();
  await page.getByRole('option', { name: 'Member' }).click();
});
