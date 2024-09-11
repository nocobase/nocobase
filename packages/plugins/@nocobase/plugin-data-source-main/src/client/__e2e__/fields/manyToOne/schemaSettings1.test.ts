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
  expectSupportedVariables,
  mockUserRecordsWithoutDepartments,
  oneTableBlockWithAddNewAndViewAndEditAndAssociationFields,
  test,
} from '@nocobase/test/e2e';
import { testDefaultValue, testPattern } from '../../utils';

test.describe('form item & create form', () => {
  test('supported options', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).waitForInit();
    await mockUserRecordsWithoutDepartments(mockRecords, 3);
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByRole('button', { name: 'Add new' }).click();
        await page.getByLabel(`block-item-CollectionField-general-form-general.manyToOne-manyToOne`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.manyToOne`)
          .hover();
      },
      supportedOptions: [
        'Edit field title',
        'Display title',
        'Edit description',
        'Required',
        'Set default value',
        'Set the data scope',
        'Set default sorting rules',
        'Field component',
        'Quick create',
        'Pattern',
        'Title field',
        'Delete',
      ],
    });
  });

  test('set default value', async ({ page, mockPage, mockRecords }) => {
    let records;
    await testDefaultValue({
      page,
      gotoPage: async () => {
        records = await (async (mockPage, mockRecords) => {
          const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).waitForInit();
          const recordsOfUser = await mockUserRecordsWithoutDepartments(mockRecords, 3);
          await nocoPage.goto();

          return recordsOfUser;
        })(mockPage, mockRecords);
      },
      openDialog: () =>
        (async (page: Page) => {
          await page.getByRole('button', { name: 'Add new' }).click();
        })(page),
      closeDialog: () => page.getByLabel('drawer-Action.Container-general-Add record-mask').click(),
      showMenu: () =>
        (async (page: Page, fieldName: string) => {
          await page.getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`).hover();
          await page
            .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`)
            .hover();
        })(page, 'manyToOne'),
      supportedVariables: ['Constant', 'Current user', 'Current role', 'API token', 'Date variables', 'Current form'],
      unsupportedVariables: ['Current popup record', 'Parent popup record'],
      inputConstantValue: async () => {
        await page
          .getByLabel('block-item-VariableInput-')
          .getByTestId(/select-object/)
          .click();
        await page.getByRole('option', { name: String(records[0].id), exact: true }).click();
        await page
          .getByLabel('block-item-VariableInput-')
          .getByTestId(/select-object/)
          .click();
        await page.getByRole('option', { name: String(records[1].id), exact: true }).click();
        await page
          .getByLabel('block-item-VariableInput-')
          .getByTestId(/select-object/)
          .click();
        await page.getByRole('option', { name: String(records[2].id), exact: true }).click();
      },
      expectConstantValue: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.manyToOne-manyToOne')
            .getByTestId(/select-object/),
        ).toHaveText(String(records[2].id));
      },
    });
  });

  test('pattern', async ({ page, mockPage, mockRecords }) => {
    let records;
    await testPattern({
      page,
      gotoPage: async () => {
        records = await (async (mockPage, mockRecords) => {
          const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).waitForInit();
          const recordsOfUser = await mockUserRecordsWithoutDepartments(mockRecords, 3);
          await nocoPage.goto();

          return recordsOfUser;
        })(mockPage, mockRecords);
      },
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
        })(page, 'manyToOne'),
      expectEditable: async () => {
        await page
          .getByLabel('block-item-CollectionField-general-form-general.manyToOne-manyToOne')
          .getByTestId(/select-object/)
          .click();
        await page.getByRole('option', { name: String(records[0].id), exact: true }).click();
      },
      expectReadonly: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.manyToOne-manyToOne')
            .getByTestId(/select-object/),
        ).toHaveClass(/ant-select-disabled/);
        // 在这里等待一下，防止因闪烁导致下面的断言失败
        await page.waitForTimeout(100);
      },
      expectEasyReading: async () => {
        await expect(page.getByLabel('block-item-CollectionField-general-form-general.manyToOne-manyToOne')).toHaveText(
          `manyToOne:${String(records[0].id)}`,
        );
      },
    });
  });

  test('Set the data scope', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).waitForInit();
    const records = await mockUserRecordsWithoutDepartments(mockRecords, 3);
    await nocoPage.goto();

    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel(`block-item-CollectionField-general-form-general.manyToOne-manyToOne`).hover();
    await page
      .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.manyToOne`)
      .hover();
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
    await page.getByRole('spinbutton').click();
    await page.getByRole('spinbutton').fill(String(records[0].id));

    // 测试下可选择的变量有哪些
    await page.getByLabel('variable-button').click();
    await expectSupportedVariables(page, [
      'Constant',
      'Current user',
      'Current role',
      'API token',
      'Date variables',
      'Current form',
    ]);
    await page.getByLabel('variable-button').click();

    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 再次打开弹窗，设置的值应该还在
    await page.getByLabel(`block-item-CollectionField-general-form-general.manyToOne-manyToOne`).hover();
    await page
      .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.manyToOne`)
      .hover();
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await expect(page.getByTestId('select-filter-field')).toHaveText('ID');
    await expect(page.getByRole('spinbutton')).toHaveValue(String(records[0].id));
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();

    // 数据应该被过滤了
    await page
      .getByLabel('block-item-CollectionField-general-form-general.manyToOne-manyToOne')
      .getByTestId('select-object-single')
      .click();
    await expect(page.getByRole('option', { name: String(records[0].id), exact: true })).toBeVisible();
    await expect(page.getByRole('option')).toHaveCount(1);
  });

  test('field component', async ({ page, mockPage, mockRecords }) => {
    await (async (mockPage, mockRecords) => {
      const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).waitForInit();
      const recordsOfUser = await mockUserRecordsWithoutDepartments(mockRecords, 3);
      await nocoPage.goto();

      return recordsOfUser;
    })(mockPage, mockRecords);
    await (async (page: Page) => {
      await page.getByRole('button', { name: 'Add new' }).click();
    })(page);
    await (async (page: Page, fieldName: string) => {
      await page.getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`).hover();
      await page
        .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`)
        .hover();
    })(page, 'manyToOne');
    await page.getByRole('menuitem', { name: 'Field component' }).click();

    // 断言支持的选项
    await expect(page.getByRole('option', { name: 'Select', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Record picker', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Sub-form', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Sub-form(Popover)', exact: true })).toBeVisible();
  });

  test('quick create', async ({ page, mockPage, mockRecords }) => {
    await (async (mockPage, mockRecords) => {
      const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).waitForInit();
      const recordsOfUser = await mockUserRecordsWithoutDepartments(mockRecords, 3);
      await nocoPage.goto();

      return recordsOfUser;
    })(mockPage, mockRecords);
    await (async (page: Page) => {
      await page.getByRole('button', { name: 'Add new' }).click();
    })(page);
    await (async (page: Page, fieldName: string) => {
      await page.getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`).hover();
      await page
        .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`)
        .hover();
    })(page, 'manyToOne');

    await expect(page.getByRole('menuitem', { name: 'Quick create' })).toBeVisible();
  });

  test('title field', async ({ page, mockPage, mockRecords }) => {
    await (async (mockPage, mockRecords) => {
      const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).waitForInit();
      const recordsOfUser = await mockUserRecordsWithoutDepartments(mockRecords, 3);
      await nocoPage.goto();

      return recordsOfUser;
    })(mockPage, mockRecords);
    await (async (page: Page) => {
      await page.getByRole('button', { name: 'Add new' }).click();
    })(page);
    await (async (page: Page, fieldName: string) => {
      await page.getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`).hover();
      await page
        .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`)
        .hover();
    })(page, 'manyToOne');
    await expect(page.getByRole('menuitem', { name: 'Title field' })).toBeVisible();
  });
});
