/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { commonFormViewPage, expect, test } from '@nocobase/test/e2e';

test.describe('field schema settings', () => {
  test('linkage style color', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(commonFormViewPage).waitForInit();
    await mockRecord('general', { singleLineText: 'asdfcedg' });
    await nocoPage.goto();
    await page.getByText('asdfcedg', { exact: true }).hover();
    await page.getByLabel('block-item-CollectionField-general-details-general.singleLineText-singleLineText').hover();

    await page
      .getByLabel('designer-schema-settings-CollectionField-fieldSettings:FormItem-general-general.singleLineText', {
        exact: true,
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
    const cell = await page
      .getByLabel('block-item-CollectionField-general-details-general.singleLineText-singleLineText')
      .locator('div.ant-formily-item-control-content-component');
    await expect(cell).toHaveCSS('color', 'rgb(163, 79, 204)');
  });
  test('linkage style background color', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(commonFormViewPage).waitForInit();
    await mockRecord('general', { singleLineText: 'asdfcedg' });
    await nocoPage.goto();
    await page.getByText('asdfcedg', { exact: true }).hover();
    await page.getByLabel('block-item-CollectionField-general-details-general.singleLineText-singleLineText').hover();

    await page
      .getByLabel('designer-schema-settings-CollectionField-fieldSettings:FormItem-general-general.singleLineText', {
        exact: true,
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
    const cell = await page
      .getByLabel('block-item-CollectionField-general-details-general.singleLineText-singleLineText')
      .locator('div.ant-formily-item-control-content-component');
    await expect(cell).toHaveCSS('background-color', 'rgb(163, 79, 204)');
  });

  test('text align', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(commonFormViewPage).waitForInit();
    await mockRecord('general', { singleLineText: 'asdfcedg' });
    await nocoPage.goto();
    await page.getByText('asdfcedg', { exact: true }).hover();
    await page.getByLabel('block-item-CollectionField-general-details-general.singleLineText-singleLineText').hover();

    await page
      .getByLabel('designer-schema-settings-CollectionField-fieldSettings:FormItem-general-general.singleLineText', {
        exact: true,
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

    const cell = page
      .getByLabel('block-item-CollectionField-general-details-general.singleLineText-singleLineText')
      .locator('div.ant-formily-item-control-content-component');

    await expect(cell).toHaveCSS('text-align', 'right');
  });
});
