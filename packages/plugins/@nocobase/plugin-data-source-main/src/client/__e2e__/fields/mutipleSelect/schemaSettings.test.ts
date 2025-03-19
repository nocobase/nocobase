/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  Page,
  expect,
  expectSettingsMenu,
  oneTableBlockWithAddNewAndViewAndEditAndChoicesFields,
  test,
} from '@nocobase/test/e2e';
import { createColumnItem, showSettingsMenu, testDefaultValue, testPattern } from '../../utils';

test.describe('form item & create form', () => {
  test('supported options', async ({ page, mockPage }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndChoicesFields).waitForInit();
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByRole('button', { name: 'Add new' }).click();
        await page.getByLabel(`block-item-CollectionField-general-form-general.multipleSelect-multipleSelect`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.multipleSelect`)
          .hover();
      },
      supportedOptions: [
        'Edit field title',
        'Display title',
        'Edit description',
        'Pattern',
        'Delete',
        'required',
        'Set default value',
      ],
    });
  });

  test('set default value', async ({ page, mockPage }) => {
    await testDefaultValue({
      page,
      gotoPage: () =>
        (async (mockPage) => {
          const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndChoicesFields).waitForInit();
          await nocoPage.goto();
        })(mockPage),
      openDialog: () =>
        (async (page: Page) => {
          await page.getByRole('button', { name: 'Add new' }).click();
        })(page),
      closeDialog: () => page.getByLabel('drawer-Action.Container-general-Add record-mask').click(),
      showMenu: () =>
        (async (page: Page, fieldName: string) => {
          await page
            .getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`, { exact: true })
            .hover();
          await page
            .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`, {
              exact: true,
            })
            .hover();
        })(page, 'multipleSelect'),
      supportedVariables: ['Constant', 'Current user', 'Current role', 'API token', 'Date variables', 'Current form'],
      unsupportedVariables: ['Current popup record', 'Parent popup record'],
      inputConstantValue: async () => {
        await page.getByLabel('block-item-VariableInput-').getByTestId('select-multiple').click();
        await page.getByRole('option', { name: 'Option1' }).click();
        await page.getByRole('option', { name: 'Option2' }).click();
        await page.getByRole('option', { name: 'Option3' }).click();
      },
      expectConstantValue: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.multipleSelect-multipleSelect'),
        ).toContainText('multipleSelect:Option1Option2Option3');
      },
    });
  });

  test('pattern', async ({ page, mockPage }) => {
    await testPattern({
      page,
      gotoPage: () =>
        (async (mockPage) => {
          const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndChoicesFields).waitForInit();
          await nocoPage.goto();
        })(mockPage),
      openDialog: () =>
        (async (page: Page) => {
          await page.getByRole('button', { name: 'Add new' }).click();
        })(page),
      showMenu: () =>
        (async (page: Page, fieldName: string) => {
          await page
            .getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`, { exact: true })
            .hover();
          await page
            .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`, {
              exact: true,
            })
            .hover();
        })(page, 'multipleSelect'),
      expectEditable: async () => {
        await page
          .getByLabel('block-item-CollectionField-general-form-general.multipleSelect-multipleSelect')
          .getByTestId('select-multiple')
          .click();
        await page.getByRole('option', { name: 'Option1' }).click();
        await page.getByRole('option', { name: 'Option2' }).click();
        await page.getByRole('option', { name: 'Option3' }).click();
      },
      expectReadonly: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.multipleSelect-multipleSelect')
            .getByTestId('select-multiple'),
        ).toHaveClass(/ant-select-disabled/);
      },
      expectEasyReading: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.multipleSelect-multipleSelect')
            .getByTestId('select-multiple'),
        ).not.toBeVisible();
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.multipleSelect-multipleSelect'),
        ).toHaveText('multipleSelect:Option1Option2Option3');
      },
    });
  });
});

test.describe('form item & edit form', () => {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndChoicesFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
        await page
          .getByLabel(`block-item-CollectionField-general-form-general.multipleSelect-multipleSelect`, { exact: true })
          .hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.multipleSelect`, {
            exact: true,
          })
          .hover();
      },
      supportedOptions: ['Edit field title', 'Display title', 'Edit description', 'Required', 'Pattern', 'Delete'],
    });
  });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    let record = null;
    await testPattern({
      page,
      gotoPage: async () => {
        record = await (async (mockPage, mockRecord) => {
          const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndChoicesFields).waitForInit();
          const record = await mockRecord('general');
          await nocoPage.goto();

          return record;
        })(mockPage, mockRecord);
      },
      openDialog: () =>
        (async (page: Page) => {
          await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
        })(page),
      showMenu: () =>
        (async (page: Page, fieldName: string) => {
          await page
            .getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`, { exact: true })
            .hover();
          await page
            .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`, {
              exact: true,
            })
            .hover();
        })(page, 'multipleSelect'),
      expectEditable: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.multipleSelect-multipleSelect')
            .getByTestId('select-multiple'),
        ).toContainText(`${record.multipleSelect.join('')}`, { ignoreCase: true });
      },
      expectReadonly: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.multipleSelect-multipleSelect')
            .getByTestId('select-multiple'),
        ).toHaveClass(/ant-select-disabled/);
      },
      expectEasyReading: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.multipleSelect-multipleSelect')
            .getByTestId('select-multiple'),
        ).not.toBeVisible();
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.multipleSelect-multipleSelect'),
        ).toHaveText(`multipleSelect:${record.multipleSelect.join('')}`, { ignoreCase: true });
      },
    });
  });
});

test.describe('form item & view form', () => {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndChoicesFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();
        await page.getByLabel(`block-item-CollectionField-general-form-general.multipleSelect-multipleSelect`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.multipleSelect`)
          .hover();
      },
      supportedOptions: ['Edit field title', 'Display title', 'Delete', 'Edit tooltip'],
      unsupportedOptions: ['Set default value'],
    });
  });
});

test.describe('table column & table', () => {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndChoicesFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await createColumnItem(page, 'multipleSelect');
        await showSettingsMenu(page, 'multipleSelect');
      },
      supportedOptions: ['Custom column title', 'Column width', 'Delete'],
    });
  });
});
