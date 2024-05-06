/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  expect,
  expectInitializerMenu,
  oneTableBlockWithAddNewAndViewAndEditAndDatetimeFields,
  test,
} from '@nocobase/test/e2e';

test.describe('form item & create form', () => {
  test('configure fields', async ({ page, mockPage }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndDatetimeFields).waitForInit();
    await nocoPage.goto();

    await expectInitializerMenu({
      page,
      showMenu: async () => {
        await page.getByRole('button', { name: 'Add new' }).click();
        await page.getByLabel('schema-initializer-Grid-form:configureFields-general').hover();
      },
      supportedOptions: ['datetime', 'time'],
    });
  });
});

test.describe('form item & edit form', () => {
  test('configure fields', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndDatetimeFields).waitForInit();
    const record = await mockRecord('general');
    await nocoPage.goto();

    await expectInitializerMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
        await page.getByLabel('schema-initializer-Grid-form:configureFields-general').hover();
      },
      supportedOptions: ['datetime', 'time'],
      expectValue: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.datetime-datetime').getByRole('textbox'),
        ).toHaveValue(new RegExp(record.datetime.slice(0, 2)));
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.time-time').getByRole('textbox'),
        ).toHaveValue(record.time);
      },
    });
  });
});

test.describe('form item & view form', () => {
  test('configure fields', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndDatetimeFields).waitForInit();
    const record = await mockRecord('general');
    await nocoPage.goto();

    await expectInitializerMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();
        await page.getByLabel('schema-initializer-Grid-details:configureFields-general').hover();
      },
      supportedOptions: ['datetime', 'time'],
      expectValue: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.datetime-datetime')
            .getByText(record.datetime.slice(0, 2)),
        ).toBeVisible();
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.time-time').getByText(record.time),
        ).toBeVisible();
      },
    });
  });
});

test.describe('table column & table', () => {
  test('configure columns', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndDatetimeFields).waitForInit();
    const record = await mockRecord('general');
    await nocoPage.goto();

    await expectInitializerMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('schema-initializer-TableV2-').hover();
        await page.getByRole('menuitem', { name: 'datetime' }).click();
        await page.getByRole('menuitem', { name: 'time', exact: true }).click();
      },
      supportedOptions: ['datetime', 'time'],
      expectValue: async () => {
        await expect(page.getByRole('button', { name: record.datetime.slice(0, 2) })).toBeVisible();
        await expect(page.getByRole('button', { name: record.time })).toBeVisible();
      },
    });
  });
});
