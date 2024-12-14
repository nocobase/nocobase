/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, expectSettingsMenu, test } from '@nocobase/test/e2e';
import dayjs from 'dayjs';
import { oneFormBlockWithDatetimeFields, oneTableBlockWithDatetimeFields } from './utils';

test('Date display format in form', async ({ page, mockPage }) => {
  await mockPage(oneFormBlockWithDatetimeFields).goto();

  await expectSettingsMenu({
    page,
    showMenu: async () => {
      await page.getByPlaceholder('Select date').hover();
      await page.getByLabel('block-item-CollectionField').hover();
      // hover 方法有时会失效，所以用 click 替代，原因未知
      await page.getByLabel('designer-schema-settings-CollectionField-fieldSettings:FormItem-general').click();
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
  await page.getByRole('button', { name: 'OK', exact: true }).click();
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
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(page.getByRole('button', { name: dayjs(date).format('YYYY-MM-DD hh:mm:ss a') })).toBeVisible();
});
