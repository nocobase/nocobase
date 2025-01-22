/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, oneTableBlockWithIntegerAndIDColumn, test } from '@nocobase/test/e2e';

test.describe('view', () => {
  test('linkage style color', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithIntegerAndIDColumn).waitForInit();
    await mockRecord('general', { integer: '423' });
    await nocoPage.goto();

    await page.getByText('integer', { exact: true }).hover();
    await page
      .getByRole('button', {
        name: 'designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-general',
      })
      .click();
    await page.getByRole('menuitem', { name: 'Style' }).click();
    await page.getByRole('button', { name: 'plus Add linkage rule' }).click();
    await page.getByText('Add property').click();
    await page.getByTestId('select-linkage-properties').click();
    await page.getByText('Color', { exact: true }).click();
    await page.getByLabel('color-picker-normal').click();
    await page.locator('input[type="text"]').fill('A34FCC');
    await page.getByRole('button', { name: 'OK' }).click();
    const cell = page.getByRole('button', { name: '423' });
    const color = await cell.evaluate((el) => getComputedStyle(el).color);
    expect(color).toContain('163, 79, 204');
  });

  test('linkage style background color', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithIntegerAndIDColumn).waitForInit();
    await mockRecord('general', { integer: '423' });
    await nocoPage.goto();
    await page.getByText('integer', { exact: true }).hover();

    await page
      .getByRole('button', {
        name: 'designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-general',
      })
      .click();
    await page.getByRole('menuitem', { name: 'Style' }).click();
    await page.getByRole('button', { name: 'plus Add linkage rule' }).click();
    await page.getByText('Add property').click();
    await page.getByTestId('select-linkage-properties').click();
    await page.getByText('Background Color', { exact: true }).click();
    await page.getByLabel('color-picker-normal').click();
    await page.locator('input[type="text"]').fill('A34FCC');
    await page.getByRole('button', { name: 'OK' }).click();
    const cell = page.getByRole('button', { name: '423' });
    const bgColor = await cell.evaluate((el) => getComputedStyle(el.parentElement).backgroundColor);
    expect(bgColor).toContain('163, 79, 204');
  });

  test('text align', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithIntegerAndIDColumn).waitForInit();
    await mockRecord('general', { integer: '423' });
    await nocoPage.goto();
    await page.getByText('integer', { exact: true }).hover();

    await page
      .getByRole('button', {
        name: 'designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-general',
      })
      .click();
    await page.getByRole('menuitem', { name: 'Style' }).click();
    await page.getByRole('button', { name: 'plus Add linkage rule' }).click();
    await page.getByText('Add property').click();
    await page.getByTestId('select-linkage-properties').click();
    await page.getByText('Text Align', { exact: true }).click();
    await page.getByTestId('select-single').click();
    await page.getByRole('option', { name: 'right' }).click();
    await page.getByRole('button', { name: 'OK' }).click();

    const cell = page.getByRole('button', { name: '423' });
    const textAlign = await cell.evaluate((el) => getComputedStyle(el.parentElement).textAlign);
    expect(textAlign).toContain('right');
  });
});
