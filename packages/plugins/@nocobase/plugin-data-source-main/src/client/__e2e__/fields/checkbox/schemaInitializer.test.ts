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
  oneTableBlockWithAddNewAndViewAndEditAndChoicesFields,
  test,
} from '@nocobase/test/e2e';

test.describe('form item & create form', () => {
  test('configure fields', async ({ page, mockPage }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndChoicesFields).waitForInit();
    await nocoPage.goto();

    await expectInitializerMenu({
      page,
      showMenu: async () => {
        await page.getByRole('button', { name: 'Add new' }).click();
        await page.getByLabel('schema-initializer-Grid-form:configureFields-general').hover();
      },
      supportedOptions: ['checkbox', 'chinaRegion', 'multipleSelect', 'radioGroup', 'singleSelect', 'checkboxGroup'],
    });
  });
});

test.describe('form item & edit form', () => {
  test('configure fields', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndChoicesFields).waitForInit();
    const record = await mockRecord('general');
    await nocoPage.goto();

    await expectInitializerMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
        await page.getByLabel('schema-initializer-Grid-form:configureFields-general').hover();
      },
      supportedOptions: ['checkbox', 'chinaRegion', 'multipleSelect', 'radioGroup', 'singleSelect', 'checkboxGroup'],
      expectValue: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.checkbox-checkbox').getByRole('checkbox'),
        ).toBeChecked({ checked: record.checkbox });
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.multipleSelect-multipleSelect')
            .getByText(record.multipleSelect.map((item: any) => item).join('')),
        ).toBeVisible();
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.singleSelect-singleSelect')
            .getByText(record.singleSelect),
        ).toBeVisible();
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.checkboxGroup-checkboxGroup')
            .getByRole('checkbox', { name: 'Option1' }),
        ).toBeChecked({ checked: record.checkboxGroup.includes('option1') });
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.checkboxGroup-checkboxGroup')
            .getByRole('checkbox', { name: 'Option2' }),
        ).toBeChecked({ checked: record.checkboxGroup.includes('option2') });
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.checkboxGroup-checkboxGroup')
            .getByRole('checkbox', { name: 'Option3' }),
        ).toBeChecked({ checked: record.checkboxGroup.includes('option3') });
      },
    });
  });
});

test.describe('form item & view form', () => {
  test('configure fields', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndChoicesFields).waitForInit();
    const record = await mockRecord('general');
    await nocoPage.goto();

    await expectInitializerMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();
        await page.getByLabel('schema-initializer-Grid-details:configureFields-general').hover();
      },
      supportedOptions: ['checkbox', 'chinaRegion', 'multipleSelect', 'radioGroup', 'singleSelect', 'checkboxGroup'],
      expectValue: async () => {
        if (record.checkbox) {
          await expect(
            page
              .getByLabel('block-item-CollectionField-general-form-general.checkbox-checkbox')
              .getByLabel('check', { exact: true }),
          ).toBeVisible();
        } else {
          await expect(
            page
              .getByLabel('block-item-CollectionField-general-form-general.checkbox-checkbox')
              .getByLabel('check', { exact: true }),
          ).toBeHidden();
        }
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.multipleSelect-multipleSelect')
            .getByText(record.multipleSelect.join('')),
        ).toBeVisible();
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.singleSelect-singleSelect')
            .getByText(record.singleSelect),
        ).toBeVisible();
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.checkboxGroup-checkboxGroup')
            .getByText(record.checkboxGroup.join('')),
        ).toBeVisible();
      },
    });
  });
});

test.describe('table column & table', () => {
  test('configure columns', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndChoicesFields).waitForInit();
    const record = await mockRecord('general');
    await nocoPage.goto();

    await expectInitializerMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('schema-initializer-TableV2-').hover();
        await page.getByRole('menuitem', { name: 'checkbox', exact: true }).click();
        await page.getByRole('menuitem', { name: 'chinaRegion' }).click();
        await page.getByRole('menuitem', { name: 'multipleSelect' }).click();
        await page.getByRole('menuitem', { name: 'radioGroup' }).click();
        await page.getByRole('menuitem', { name: 'singleSelect' }).click();
        await page.getByRole('menuitem', { name: 'checkboxGroup' }).click();
      },
      supportedOptions: ['checkbox', 'chinaRegion', 'multipleSelect', 'radioGroup', 'singleSelect', 'checkboxGroup'],
      expectValue: async () => {
        if (record.checkbox) {
          await expect(page.getByRole('menuitem', { name: 'checkbox', exact: true })).toBeVisible();
        } else {
          await expect(page.getByRole('menuitem', { name: 'checkbox', exact: true })).not.toBeVisible();
        }
        await expect(page.getByRole('button', { name: record.multipleSelect.join(' ') }).first()).toBeVisible();
        await expect(page.getByRole('button', { name: record.radioGroup }).first()).toBeVisible();
        await expect(page.getByRole('button', { name: record.singleSelect }).first()).toBeVisible();
        await expect(page.getByRole('button', { name: record.checkboxGroup.join(' ') }).first()).toBeVisible();
      },
    });
  });
});
