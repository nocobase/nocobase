/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, oneEmptyTableBlockWithCustomizeActions, test } from '@nocobase/test/e2e';

test.describe('TableActionColumnInitializers & DetailsActionInitializers & ReadPrettyFormActionInitializers should add duplication action', () => {
  test('duplication action in TableActionColumnInitializers', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneEmptyTableBlockWithCustomizeActions).waitForInit();
    await mockRecords('general', 3);
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Actions', exact: true }).hover();
    await page.getByLabel('designer-schema-initializer-TableV2.Column-TableV2.ActionColumnDesigner-general').hover();
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();
    await expect(page.getByLabel('action-Action.Link-Duplicate-duplicate-general-table-0')).toBeVisible();
  });
});
