/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { backgroundColorFieldBasic } from './templates';

test.describe('Color field', () => {
  test('basic', async ({ mockPage, mockRecords, page }) => {
    const nocoPage = await mockPage(backgroundColorFieldBasic).waitForInit();
    await mockRecords('calendar', 3);
    await nocoPage.goto();

    // 1. The default option is Not selected
    await page.getByLabel('block-item-CardItem-calendar-').hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:calendar-calendar').hover();
    await page.getByRole('menuitem', { name: 'Color field Not selected' }).click();

    // 2. Switch to the single select option
    await page.getByRole('option', { name: 'Single select' }).click();
    await page.getByLabel('block-item-CardItem-calendar-').hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:calendar-calendar').hover();
    await expect(page.getByRole('menuitem', { name: 'Color field Single select' })).toBeVisible();
    await page.mouse.move(-300, 0);

    // 3. Switch to the radio group option
    await page.getByLabel('block-item-CardItem-calendar-').hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:calendar-calendar').hover();
    await page.getByRole('menuitem', { name: 'Color field Single select' }).click();
    await page.getByRole('option', { name: 'Radio group' }).click();
    await page.getByLabel('block-item-CardItem-calendar-').hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:calendar-calendar').hover();
    await expect(page.getByRole('menuitem', { name: 'Color field Radio group' })).toBeVisible();
  });
});
