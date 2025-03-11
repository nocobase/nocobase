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
  expectSettingsMenu,
  oneTableBlockWithAddNewAndViewAndEditAndBasicFields,
  oneTableBlockWithAddNewAndViewAndEditAndBasicFieldsAndSubTable,
  oneTableBlockWithEditAndSubForm,
  test,
} from '@nocobase/test/e2e';
import { testDefaultValue } from '../../utils';

test.describe('form item & sub form', () => {
  test('set default value', async ({ page, mockPage, mockRecord }) => {
    let record;
    await testDefaultValue({
      page,
      async gotoPage() {
        const nocoPage = await mockPage(oneTableBlockWithEditAndSubForm).waitForInit();
        record = await mockRecord('subform');
        await nocoPage.goto();
      },
      async openDialog() {
        await page.getByLabel('action-Action.Link-Edit record-update-subform-table-0').click();
      },
      async closeDialog() {
        await page.getByLabel('drawer-Action.Container-subform-Edit record-mask').click();
      },
      async showMenu() {
        await page.getByLabel('block-item-CollectionField-').nth(1).hover();
        await page
          .getByRole('button', {
            name: 'designer-schema-settings-CollectionField-fieldSettings:FormItem-general-general',
          })
          .hover();
      },
      supportedVariables: [
        'Constant',
        'Current user',
        'Current role',
        'API token',
        'Date variables',
        'Current form',
        'Current object',
        'Current popup record',
      ],
      unsupportedVariables: ['Parent popup record'],
      variableValue: ['Current user', 'Nickname'],
      expectVariableValue: async () => {
        await page.locator('.nb-sub-form-addNew').first().click();

        // 在最下面增加一条数据
        await expect(page.getByLabel('block-item-CollectionField-').last().getByRole('textbox')).toHaveValue(
          'Super Admin',
        );
      },
    });
  });
});

test.describe('form item & view form', () => {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();
        await page.getByLabel(`block-item-CollectionField-general-form-general.singleLineText-singleLineText`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.singleLineText`)
          .hover();
      },
      supportedOptions: ['Edit field title', 'Display title', 'Delete', 'Edit tooltip'],
      unsupportedOptions: ['Set default value'],
    });
  });
});

test.describe('table column & sub-table in edit form', () => {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFieldsAndSubTable).waitForInit();
    await mockRecord('subTable');
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('action-Action.Link-Edit record-update-subTable-table-0').click();
        await page.getByRole('button', { name: 'singleLineText', exact: true }).hover();
        await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.Column.Designer-general').hover();
      },
      supportedOptions: ['Custom column title', 'Column width', 'Required', 'Pattern', 'Set default value', 'Delete'],
    });
  });

  test('set default value', async ({ page, mockPage, mockRecord }) => {
    let record;
    await testDefaultValue({
      page,
      gotoPage: async () => {
        const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFieldsAndSubTable).waitForInit();
        record = await mockRecord('subTable');
        await nocoPage.goto();
      },
      openDialog: async () => {
        await page.getByLabel('action-Action.Link-Edit record-update-subTable-table-0').click();
      },
      closeDialog: async () => {
        await page.getByLabel('drawer-Action.Container-subTable-Edit record-mask').click();
      },
      showMenu: async () => {
        await page.getByRole('button', { name: 'singleLineText', exact: true }).hover();
        await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.Column.Designer-general').hover();
      },
      supportedVariables: [
        'Constant',
        'Current user',
        'Current role',
        'API token',
        'Current form',
        'Current object',
        'Current popup record',
      ],
      unsupportedVariables: ['Parent popup record'],
      variableValue: ['Current user', 'Nickname'],
      expectVariableValue: async () => {
        await page.locator('.nb-sub-table-addNew').click();
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
            .nth(0)
            .getByRole('textbox'),
        ).toHaveValue(record.manyToMany[0].singleLineText);

        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
            .nth(record.manyToMany.length) // 最后一行
            .getByRole('textbox'),
        ).toHaveValue('Super Admin');
      },
    });
  });
});
