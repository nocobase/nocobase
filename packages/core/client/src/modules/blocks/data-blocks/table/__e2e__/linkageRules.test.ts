/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { subTableLinkageRules } from './templatesOfBug';

test('linkage rules', async ({ page, mockPage }) => {
  // Linkage rules have been set in the sub-table, the rule is: disable the singleLineText field
  await mockPage(subTableLinkageRules).goto();

  // Open the data selector popup, in the form within the dialog, the singleLineText field should not be disabled
  await page.getByText('Add new').click();
  await page.getByTestId('select-data-picker').click();
  await expect(
    page.getByTestId('drawer-AssociationField.Selector-collection3-Select record').getByRole('textbox'),
  ).not.toBeDisabled();
});
