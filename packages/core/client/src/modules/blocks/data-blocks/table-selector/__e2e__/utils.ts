/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { NocoPage, Page, PageConfig, oneFormBlockWithAllAssociationFieldsAndSelectorMode } from '@nocobase/test/e2e';

export async function createTable({
  page,
  mockPage,
  fieldName,
}: {
  fieldName: string;
  page: Page;
  mockPage: (config?: PageConfig) => NocoPage;
}) {
  await mockPage(oneFormBlockWithAllAssociationFieldsAndSelectorMode).goto();

  // open dialog
  await page
    .getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`)
    .getByTestId('select-data-picker')
    .click();

  // create a table block
  await page.getByLabel('schema-initializer-Grid-popup:tableSelector:addBlock-users').hover();
  await page.getByRole('menuitem', { name: 'form Table' }).click();
  await page.mouse.move(300, 0);
}
