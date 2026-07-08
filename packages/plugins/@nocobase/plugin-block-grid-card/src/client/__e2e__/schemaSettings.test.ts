/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, expectSettingsMenu, oneEmptyGridCardBlock, test } from '@nocobase/test/e2e';

test.describe('grid card block schema settings', () => {
  test('show grid card block settings options', async ({ page, mockPage }) => {
    await mockPage(oneEmptyGridCardBlock).goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('block-item-BlockItem-general-grid-card').hover();
        await page.waitForTimeout(1000);
        await page.getByLabel('designer-schema-settings-BlockItem-GridCard.Designer-general').hover();
      },
      supportedOptions: [
        'Set the count of columns displayed in a row',
        'Set the data scope',
        'Set default sorting rules',
        'Records per page',
        'Delete',
      ],
    });
  });

  test('set grid card desktop column count', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneEmptyGridCardBlock).waitForInit();
    await mockRecords('general', 10);
    await nocoPage.goto();

    let boxSize = await page.getByLabel('grid-card-item').first().boundingBox();
    expect(boxSize.width).toBeGreaterThan(390);
    expect(boxSize.width).toBeLessThan(410);

    await page.getByLabel('block-item-BlockItem-general-grid-card').hover();
    await page.getByLabel('designer-schema-settings-BlockItem-GridCard.Designer-general').hover();
    await page.getByRole('menuitem', { name: 'Set the count of columns displayed in a row' }).click();
    await page.getByLabel('block-item-Slider-general-grid-card-Desktop device').getByText('2', { exact: true }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await page.reload();

    boxSize = await page.getByLabel('grid-card-item').first().boundingBox();
    expect(boxSize.width).toBeGreaterThan(600);
    expect(boxSize.width).toBeLessThan(620);
  });
});
