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
  oneTableBlockWithAddNewAndViewAndEditAndBasicFields,
  test,
} from '@nocobase/test/e2e';
import { testDefaultValue, testPattern, testSetValidationRules } from '../../utils';

test.describe('form item & create form', () => {
  test('supported options', async ({ page, mockPage }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByRole('button', { name: 'Add new' }).click();
        await page.getByLabel(`block-item-CollectionField-general-form-general.singleLineText-singleLineText`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.singleLineText`)
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
        'Set validation rules',
      ],
    });
  });

  test('set default value', async ({ page, mockPage }) => {
    await testDefaultValue({
      page,
      gotoPage: async () => {
        const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
        await nocoPage.goto();
      },
      openDialog: async () => {
        await page.getByRole('button', { name: 'Add new' }).click();
      },
      closeDialog: () => page.getByLabel('drawer-Action.Container-general-Add record-mask').click(),
      showMenu: async () => {
        await page.getByLabel(`block-item-CollectionField-general-form-general.singleLineText-singleLineText`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.singleLineText`)
          .hover();
      },
      supportedVariables: ['Constant', 'Current user', 'Current role', 'API token', 'Date variables', 'Current form'],
      unsupportedVariables: ['Current popup record', 'Parent popup record'],
      constantValue: 'test single line text',
      variableValue: ['Current user', 'Email'], // 值为 admin@nocobase.com
      expectConstantValue: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
            .getByRole('textbox'),
        ).toHaveValue('test single line text');
      },
      expectVariableValue: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
            .getByRole('textbox'),
        ).toHaveValue('admin@nocobase.com');
      },
    });
  });

  test('pattern', async ({ page, mockPage }) => {
    await testPattern({
      page,
      gotoPage: () =>
        (async (mockPage) => {
          const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
          await nocoPage.goto();
        })(mockPage),
      openDialog: () =>
        (async (page: Page) => {
          await page.getByRole('button', { name: 'Add new' }).click();
        })(page),
      showMenu: () =>
        (async (page: Page, fieldName: string) => {
          await page.getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`).hover();
          await page
            .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`)
            .hover();
        })(page, 'singleLineText'),
      expectEditable: async () => {
        // 默认情况下可以编辑
        await page
          .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
          .getByRole('textbox')
          .click();
        await page
          .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
          .getByRole('textbox')
          .fill('test single line text');
      },
      expectReadonly: async () => {
        // 只读模式下，输入框会被禁用
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
            .getByRole('textbox'),
        ).toBeDisabled();
      },
      expectEasyReading: async () => {
        // 输入框会消失，只剩下值
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
            .getByRole('textbox'),
        ).not.toBeVisible();
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText'),
        ).toHaveText('singleLineText:test single line text');
      },
    });
  });

  test('Set validation rules', async ({ page, mockPage }) => {
    await testSetValidationRules({
      page,
      gotoPage: () =>
        (async (mockPage) => {
          const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
          await nocoPage.goto();
        })(mockPage),
      openDialog: () =>
        (async (page: Page) => {
          await page.getByRole('button', { name: 'Add new' }).click();
        })(page),
      showMenu: () =>
        (async (page: Page, fieldName: string) => {
          await page.getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`).hover();
          await page
            .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`)
            .hover();
        })(page, 'singleLineText'),
    });
  });
});
