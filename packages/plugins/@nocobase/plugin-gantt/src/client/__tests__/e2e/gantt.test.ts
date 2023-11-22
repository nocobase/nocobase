import { expect, test } from '@nocobase/test/client';

import { generalWithDatetimeFields } from './utils';
test.describe('add gantt block to page', () => {
  test('add gantt block,then delete', async ({ page, mockPage, mockCollections }) => {
    await mockCollections(generalWithDatetimeFields);
    await mockPage().goto();
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').click();
    await page.getByRole('menuitem', { name: 'form Gantt right' }).click();
    await page.getByRole('menuitem', { name: 'General' }).click();
    await page.getByLabel('block-item-Select-Title field').getByLabel('Search').click();
    await page.getByLabel('block-item-Select-Start date field').click();
    await page.getByRole('option', { name: 'Start date time' }).click();
    await page.getByLabel('block-item-Select-End date field').click();
    await page.getByRole('option', { name: 'End date time' }).click();
    await page.getByLabel('block-item-Select-Progress field').click();
    await page.getByRole('option', { name: 'Percent' }).click();
    await page.getByLabel('block-item-Select-Time scale').click();
    await page.getByRole('option', { name: 'Percent' }).click();
    await page.getByLabel('block-item-Select-Time scale').click();
    await page.getByRole('option', { name: 'Day' }).click();

    await page.getByRole('button', { name: 'OK' }).click();
  });
});
