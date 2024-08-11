/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { T4942 } from './templatesOfBug';

test.describe('Configure columns - Display association fields', () => {
  // https://nocobase.height.app/T-4942/description
  test('should not error when open a popup by clicking a multi-level field', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(T4942).waitForInit();

    const record = await mockRecord('collection1', 2);

    await nocoPage.goto();

    await page.getByRole('button', { name: record.manyToOne1.manyToOne2.id, exact: true }).locator('a').click();
    await expect(page.getByLabel('block-item-CollectionField-')).toHaveText(
      `field1:${record.manyToOne1.manyToOne2.field1}`,
    );
  });
});
