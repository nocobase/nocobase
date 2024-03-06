import { expect, expectSettingsMenu, test } from '@nocobase/test/e2e';
import dayjs from 'dayjs';
import { oneTableBlockWithDatetimeFields, oneFormBlockWithDatetimeFields } from './utils';

test('Date display format in form', async ({ page, mockPage }) => {
  await mockPage(oneFormBlockWithDatetimeFields).goto();

  await expectSettingsMenu({
    page,
    showMenu: async () => {
      await page.getByPlaceholder('Select date').hover();
      await page.getByLabel('block-item-CollectionField').hover();
      await page.getByLabel('designer-schema-settings-CollectionField-fieldSettings:FormItem-general').hover();
    },
    supportedOptions: [
      'Edit field title',
      'Display title',
      'Edit description',
      'Edit tooltip',
      'Required',
      'Set default value',
      'Pattern',
      'Date display format',
      'Delete',
    ],
  });
  await page.getByText('Date display format').click();
  await page.getByLabel('Show time').check();
  await page.getByRole('button', { name: 'HH:mm:ss', exact: true }).click();
  await page.getByRole('button', { name: 'OK' }).click();
  await page.getByPlaceholder('Select date').click();
  await page.getByText('Now').click();
  const value = await page.getByPlaceholder('Select date').inputValue();
  expect(value).toBe(dayjs(value).format('YYYY-MM-DD HH:mm:ss'));
});

test('Date display format in table', async ({ page, mockPage, mockRecord }) => {
  await mockPage(oneTableBlockWithDatetimeFields).goto();
  const date = new Date().toDateString();
  await mockRecord('general', { datetime: date });
  await expectSettingsMenu({
    page,
    showMenu: async () => {
      await page.getByRole('button', { name: 'datetime' }).hover();
      await page.getByLabel('designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-general').hover();
    },
    supportedOptions: ['Custom column title', 'Column width', 'Sortable', 'Date display format', 'Delete'],
  });
  await page.getByText('Date display format').click();
  await page.getByLabel('Show time').check();
  await page.getByRole('button', { name: 'hh:mm:ss a' }).click();
  await page.getByRole('button', { name: 'OK' }).click();
  await expect(page.getByRole('button', { name: dayjs(date).format('YYYY-MM-DD hh:mm:ss a') })).toBeVisible();
});
