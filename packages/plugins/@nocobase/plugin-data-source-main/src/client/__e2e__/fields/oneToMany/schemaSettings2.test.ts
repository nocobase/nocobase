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
import { testPattern } from '../../utils';

test.describe('form item & edit form', () => {
  test('supported options', async ({ page, mockRecords, mockPage }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).waitForInit();
    await mockUserRecordsWithoutDepartments(mockRecords, 3);
    await mockRecords('general', 1);
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
        await page.getByLabel(`block-item-CollectionField-general-form-general.oneToMany-oneToMany`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.oneToMany`)
          .hover();
      },
      supportedOptions: [
        'Edit field title',
        'Display title',
        'Edit description',
        'Required',
        'Set the data scope',
        'Set default sorting rules',
        'Field component',
        'Quick create',
        'Allow multiple',
        'Pattern',
        'Title field',
        'Delete',
      ],
      unsupportedOptions: ['Set default value'],
    });
  });

  test('pattern', async ({ page, mockPage, mockRecords }) => {
    let record;
    await testPattern({
      page,
      gotoPage: async () => {
        record = (
          await (async (mockPage, mockRecords) => {
            const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).waitForInit();
            const recordsOfUser = await mockUserRecordsWithoutDepartments(mockRecords, 3);
            const record = (await mockRecords('general', 1))[0];
            await nocoPage.goto();

            return { record, recordsOfUser };
          })(mockPage, mockRecords)
        ).record;
      },
      openDialog: () =>
        (async (page: Page) => {
          await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
        })(page),
      showMenu: () =>
        (async (page: Page, fieldName: string) => {
          await page.getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`).hover();
          await page
            .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`)
            .hover();
        })(page, 'oneToMany'),
      expectEditable: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.oneToMany-oneToMany')
            .getByTestId('select-object-multiple'),
        ).toContainText(`${record.oneToMany.map((item) => item.id).join('')}`);
      },
      expectReadonly: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.oneToMany-oneToMany')
            .getByTestId('select-object-multiple'),
        ).toHaveClass(/ant-select-disabled/);
        // 在这里等待一下，防止因闪烁导致下面的断言失败
        // await page.waitForTimeout(100);
      },
      expectEasyReading: async () => {
        await expect(page.getByLabel('block-item-CollectionField-general-form-general.oneToMany-oneToMany')).toHaveText(
          `oneToMany:${record.oneToMany.map((item) => item.id).join(',')}`,
        );
      },
    });
  });

  test('Set the data scope', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).waitForInit();
    await mockUserRecordsWithoutDepartments(mockRecords, 3);
    const record = (await mockRecords('general', 1))[0];
    await nocoPage.goto();

    await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
    await page.getByLabel(`block-item-CollectionField-general-form-general.oneToMany-oneToMany`).hover();
    await page
      .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.oneToMany`)
      .hover();
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
    await page.getByRole('spinbutton').click();
    await page.getByRole('spinbutton').fill('1');

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
    await page.getByLabel(`block-item-CollectionField-general-form-general.oneToMany-oneToMany`).hover();
    await page
      .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.oneToMany`)
      .hover();
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await expect(page.getByTestId('select-filter-field')).toHaveText('ID');
    await expect(page.getByRole('spinbutton')).toHaveValue('1');
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();

    // 数据应该被过滤了
    await page
      .getByLabel('block-item-CollectionField-general-form-general.oneToMany-oneToMany')
      .getByTestId('select-object-multiple')
      .click();
    // 但是在编辑模式下，本身已经有数据，所以需要加上已有数据的个数
    await expect(page.getByRole('option')).toHaveCount(1 + record.oneToMany.length);
  });

  test('field component', async ({ page, mockPage, mockRecords }) => {
    await (async (mockPage, mockRecords) => {
      const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).waitForInit();
      const recordsOfUser = await mockUserRecordsWithoutDepartments(mockRecords, 3);
      const record = (await mockRecords('general', 1))[0];
      await nocoPage.goto();

      return { record, recordsOfUser };
    })(mockPage, mockRecords);
    await (async (page: Page) => {
      await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
    })(page);
    await (async (page: Page, fieldName: string) => {
      await page.getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`).hover();
      await page
        .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`)
        .hover();
    })(page, 'oneToMany');
    await page.getByRole('menuitem', { name: 'Field component' }).click();

    // 断言支持的选项
    await expect(page.getByRole('option', { name: 'Select', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Record picker', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Sub-table', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Sub-form', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Sub-form(Popover)', exact: true })).toBeVisible();
  });

  test('quick create', async ({ page, mockPage, mockRecords }) => {
    await (async (mockPage, mockRecords) => {
      const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).waitForInit();
      const recordsOfUser = await mockUserRecordsWithoutDepartments(mockRecords, 3);
      const record = (await mockRecords('general', 1))[0];
      await nocoPage.goto();

      return { record, recordsOfUser };
    })(mockPage, mockRecords);
    await (async (page: Page) => {
      await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
    })(page);
    await (async (page: Page, fieldName: string) => {
      await page.getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`).hover();
      await page
        .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`)
        .hover();
    })(page, 'oneToMany');

    await expect(page.getByRole('menuitem', { name: 'Quick create' })).toBeVisible();
  });

  test('allow multiple', async ({ page, mockPage, mockRecords }) => {
    await (async (mockPage, mockRecords) => {
      const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).waitForInit();
      const recordsOfUser = await mockUserRecordsWithoutDepartments(mockRecords, 3);
      const record = (await mockRecords('general', 1))[0];
      await nocoPage.goto();

      return { record, recordsOfUser };
    })(mockPage, mockRecords);
    await (async (page: Page) => {
      await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
    })(page);
    await (async (page: Page, fieldName: string) => {
      await page.getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`).hover();
      await page
        .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`)
        .hover();
    })(page, 'oneToMany');
    await expect(page.getByRole('menuitem', { name: 'Allow multiple' })).toBeVisible();
  });

  test('title field', async ({ page, mockPage, mockRecords }) => {
    await (async (mockPage, mockRecords) => {
      const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).waitForInit();
      const recordsOfUser = await mockUserRecordsWithoutDepartments(mockRecords, 3);
      const record = (await mockRecords('general', 1))[0];
      await nocoPage.goto();

      return { record, recordsOfUser };
    })(mockPage, mockRecords);
    await (async (page: Page) => {
      await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
    })(page);
    await (async (page: Page, fieldName: string) => {
      await page.getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`).hover();
      await page
        .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`)
        .hover();
    })(page, 'oneToMany');
    await expect(page.getByRole('menuitem', { name: 'Title field' })).toBeVisible();
  });
});
