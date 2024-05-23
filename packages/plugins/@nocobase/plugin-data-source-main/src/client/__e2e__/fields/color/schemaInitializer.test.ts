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
  oneTableBlockWithAddNewAndViewAndEditAndBasicFields,
  test,
} from '@nocobase/test/e2e';

test.describe('form item & create form', () => {
  test('configure fields', async ({ page, mockPage }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await nocoPage.goto();

    await expectInitializerMenu({
      page,
      showMenu: async () => {
        await page.getByRole('button', { name: 'Add new' }).click();
        await page.getByLabel('schema-initializer-Grid-form:configureFields-general').hover();
      },
      supportedOptions: [
        'color',
        'email',
        'icon',
        'singleLineText',
        'integer',
        'number',
        'password',
        'percent',
        'phone',
        'longText',
        'url',
      ],
    });
  });
});

test.describe('form item & edit form', () => {
  test('configure fields', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    const record = await mockRecord('general');
    await nocoPage.goto();

    await expectInitializerMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
        await page.getByLabel('schema-initializer-Grid-form:configureFields-general').hover();
      },
      supportedOptions: [
        'color',
        'email',
        'icon',
        'singleLineText',
        'integer',
        'number',
        'password',
        'percent',
        'phone',
        'longText',
        'url',
      ],
      expectValue: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.email-email').getByRole('textbox'),
        ).toHaveValue(record.email);
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
            .getByRole('textbox'),
        ).toHaveValue(record.singleLineText);
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.integer-integer').getByRole('spinbutton'),
        ).toHaveValue(String(record.integer));
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.number-number').getByRole('spinbutton'),
        ).toHaveValue(String(record.number));
        // await expect(
        //   page.getByLabel('block-item-CollectionField-general-form-general.percent-percent').getByRole('spinbutton'),
        // ).toHaveValue(String(record.percent * 100));
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.longText-longText').getByRole('textbox'),
        ).toHaveValue(record.longText);
      },
    });
  });
});

test.describe('form item & view form', () => {
  test('configure fields', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    const record = await mockRecord('general');
    await nocoPage.goto();

    await expectInitializerMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();
        await page.getByLabel('schema-initializer-Grid-details:configureFields-general').hover();
      },
      supportedOptions: [
        'color',
        'email',
        'icon',
        'singleLineText',
        'integer',
        'number',
        'password',
        'percent',
        'phone',
        'longText',
        'url',
      ],
      expectValue: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.email-email').getByText(record.email),
        ).toBeVisible();
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
            .getByText(record.singleLineText),
        ).toBeVisible();
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
            .getByText(record.singleLineText),
        ).toBeVisible();
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.integer-integer')
            .getByText(record.integer.toLocaleString()),
        ).toBeVisible();
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.number-number')
            .getByText(record.number.toFixed(0)),
        ).toBeVisible();
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.percent-percent')
            .getByText(`${Math.round(record.percent * 100).toLocaleString()}%`),
        ).toBeVisible();
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.longText-longText')
            .getByText(record.longText.slice(0, 10)),
        ).toBeVisible();
      },
    });
  });
});

test.describe('table column & table', () => {
  test('configure columns', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    const record = await mockRecord('general');
    await nocoPage.goto();

    await expectInitializerMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('schema-initializer-TableV2-').hover();
        await page.getByRole('menuitem', { name: 'color' }).first().click();
        await page.getByRole('menuitem', { name: 'email' }).first().click();
        await page.getByRole('menuitem', { name: 'icon' }).first().click();
        await page.getByRole('menuitem', { name: 'singleLineText' }).first().click();
        await page.getByRole('menuitem', { name: 'integer' }).first().click();
        await page.getByRole('menuitem', { name: 'number' }).first().click();
        await page.getByRole('menuitem', { name: 'password' }).first().click();
        await page.getByRole('menuitem', { name: 'percent' }).first().click();
        await page.getByRole('menuitem', { name: 'phone' }).first().click();
        await page.getByRole('menuitem', { name: 'longText' }).first().click();
        await page.getByRole('menuitem', { name: 'url' }).first().click();
      },
      supportedOptions: [
        'color',
        'email',
        'icon',
        'singleLineText',
        'integer',
        'number',
        'password',
        'percent',
        'phone',
        'longText',
        'url',
      ],
      expectValue: async () => {
        await expect(page.getByRole('button', { name: record.email })).toBeVisible();
        await expect(page.getByRole('button', { name: record.singleLineText })).toBeVisible();
        await expect(page.getByRole('button', { name: record.integer.toLocaleString() })).toBeVisible();
        await expect(page.getByRole('button', { name: record.number.toFixed(0) })).toBeVisible();
        await expect(
          page.getByRole('button', { name: `${Math.round(record.percent * 100).toLocaleString()}%` }),
        ).toBeVisible();
        await expect(page.getByRole('button', { name: record.longText.slice(0, 10) })).toBeVisible();
      },
    });
  });
});
