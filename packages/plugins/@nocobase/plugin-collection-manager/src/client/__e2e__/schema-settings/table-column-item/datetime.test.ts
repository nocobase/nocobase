import { expect, oneTableBlockWithAddNewAndViewAndEditAndDatetimeFields, test } from '@nocobase/test/client';
import dayjs from 'dayjs';
import { createColumnItem, showSettingsMenu, testSupportedOptions } from './utils';

test.describe('datetime', () => {
  testSupportedOptions({
    name: 'datetime',
    options: ['Custom column title', 'Column width', 'Sortable', 'Date display format', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndDatetimeFields,
  });

  test('date display format', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndDatetimeFields).waitForInit();
    const records = await mockRecords('general', 1);
    await nocoPage.goto();

    await createColumnItem(page, 'datetime');
    await showSettingsMenu(page, 'datetime');
    await page.getByRole('menuitem', { name: 'Date display format' }).click();
    await page.getByLabel('MM/DD/YY').click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(
      page.getByRole('cell', { name: dayjs(records[0].datetime).format('MM/DD/YY'), exact: true }),
    ).toBeVisible();
  });
});

test.describe('time', () => {
  testSupportedOptions({
    name: 'time',
    options: ['Custom column title', 'Column width', 'Sortable', 'Delete'],
    template: oneTableBlockWithAddNewAndViewAndEditAndDatetimeFields,
  });
});
