/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';

test.describe('defaultValue', () => {
  test('date variables', async ({ page, mockPage }) => {
    await mockPage().goto();

    // 1. First, create a chart filter block and add a custom date field (date range)
    await page.getByLabel('schema-initializer-Grid-page:').hover();
    await page.getByRole('menuitem', { name: 'line-chart Charts' }).click();
    await page.getByLabel('schema-initializer-Grid-charts:addBlock').hover();
    await page.getByRole('menuitem', { name: 'Filter' }).click();
    await page.getByTestId('configure-fields-button-of-chart-filter-item').hover();
    await page.getByRole('menuitem', { name: 'Custom' }).click();
    await page.getByLabel('block-item-Input-Field title').getByRole('textbox').fill('date');
    await page.getByLabel('block-item-Select-Field').getByTestId('select-single').click();
    await page.getByRole('option', { name: 'Date range' }).click();
    await page.getByRole('button', { name: 'OK' }).click();

    // 2. Set a date variable default value for the custom field, after saving, the date input box should display the default value
    await page.getByLabel('block-item-DatePicker.').hover();
    await page.getByLabel('designer-schema-settings-DatePicker.RangePicker-chart:filterForm:item').hover();
    await page.getByRole('menuitem', { name: 'Set default value' }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Date variables right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Last week' }).click();
    await page.getByRole('button', { name: 'OK' }).click();

    await expect(page.getByPlaceholder('Start date')).toHaveValue(/[0-9]{4}-[0-9]{2}-[0-9]{2}/);
    await expect(page.getByPlaceholder('End date')).toHaveValue(/[0-9]{4}-[0-9]{2}-[0-9]{2}/);
  });
});
