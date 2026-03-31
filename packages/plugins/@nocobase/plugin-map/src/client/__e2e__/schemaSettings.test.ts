/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, expectSettingsMenu, test } from '@nocobase/test/e2e';
import { oneMapUsedToTestSettings } from './templates';

test.beforeEach(async ({ page }) => {
  await page.goto('/admin/settings/map');
  await page.waitForLoadState('load');
  await page.waitForTimeout(1000);
  if (await page.getByRole('button', { name: 'Edit' }).first().isVisible()) {
    await page.getByRole('button', { name: 'Edit' }).first().click();
  }
  await page.waitForTimeout(1000);
  await page.getByLabel('Access key').fill('9717a70e44273882bcf5489f72b4e261');
  await page.getByLabel('securityJsCode or serviceHost').fill('6876ed2d3a6168b75c4fba852e16c99c');
  await page.getByRole('button', { name: 'Save' }).first().click();
  await expect(page.locator('.ant-message-notice').getByText('Saved successfully')).toBeVisible();
});

test.afterEach(async ({ page }) => {
  await page.goto('/admin/settings/map');
  await page.waitForLoadState('load');
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Edit' }).first().click();
  await page.getByLabel('Access key').clear();
  await page.getByLabel('securityJsCode or serviceHost').clear();
  await page.getByRole('button', { name: 'Save' }).first().click();
  await expect(page.locator('.ant-message-notice').getByText('Saved successfully')).toBeVisible();
});

test.describe('schema settings', () => {
  // TODO: 不稳定，待优化
  test.skip('what settings can be used in map block', async ({ page, mockPage }) => {
    await mockPage(oneMapUsedToTestSettings).goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('block-item-CardItem-map-map').hover();
        await page.getByLabel('designer-schema-settings-CardItem-blockSettings:map-map').hover();
      },
      supportedOptions: [
        'Edit block title',
        'Fix block',
        'Map field',
        'Marker field',
        'Concatenation order field',
        'Set data loading mode',
        'The default zoom level of the map',
        'Set the data scope',
        'Connect data blocks',
        // 'Save as template',
        'Delete',
      ],
    });
  });
});
