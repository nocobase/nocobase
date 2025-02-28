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
import { oneFormBlockWithTimeField, oneTableBlockWithTimeField } from './template';

test(' time format in form', async ({ page, mockPage }) => {
  await mockPage(oneFormBlockWithTimeField).goto();

  await expectSettingsMenu({
    page,
    showMenu: async () => {
      await page.getByPlaceholder('Select time').hover();
      await page.getByLabel('block-item-CollectionField').hover();
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
      'Time format',
      'Delete',
    ],
  });
  await page.getByText('Time format').click();
  await page.getByRole('radio', { name: 'hh:mm:ss a' }).check();
  await page.getByRole('button', { name: 'OK' }).click();
  await page.getByPlaceholder('Select time').click();
  await page.getByText('Now').click();
  const value = await page.getByPlaceholder('Select time').inputValue();
  const expectedTime = dayjs().format('hh:mm:ss a'); // 12-hour format
  await expect(value).toBe(expectedTime);
});

test('Time format in table', async ({ page, mockPage, mockRecord }) => {
  await mockPage(oneTableBlockWithTimeField).goto();
  const time = dayjs().format('hh:mm:ss a');
  await mockRecord('general', { time: time });
  await expectSettingsMenu({
    page,
    showMenu: async () => {
      await page.getByLabel('block-item-CardItem-general-table').click();
      await page.getByRole('button', { name: 'time' }).hover();
      await page
        .getByRole('button', { name: 'designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-general' })
        .click();
    },
    supportedOptions: ['Custom column title', 'Column width', 'Sortable', 'Time format', 'Delete'],
  });
  await page.getByText('Time format').click();
  await page.getByRole('radio', { name: 'hh:mm:ss a' }).check();
  await page.getByRole('button', { name: 'OK' }).click();

  await expect(page.getByRole('button', { name: time })).toBeVisible();
});
