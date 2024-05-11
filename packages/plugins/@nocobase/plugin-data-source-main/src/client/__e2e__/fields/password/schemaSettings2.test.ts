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
import { testPattern, testSetValidationRules } from '../../utils';

test.describe('form item & edit form', () => {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
        await page.getByLabel(`block-item-CollectionField-general-form-general.password-password`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.password`)
          .hover();
      },
      supportedOptions: [
        'Edit field title',
        'Display title',
        'Edit description',
        'Required',
        'Set validation rules',
        'Pattern',
        'Delete',
      ],
    });
  });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    let record: any = null;
    await testPattern({
      page,
      gotoPage: async () => {
        const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
        record = await mockRecord('general');
        await nocoPage.goto();
      },
      openDialog: async () => {
        await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
      },
      showMenu: async () => {
        await page.getByLabel(`block-item-CollectionField-general-form-general.password-password`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.password`)
          .hover();
      },
      expectEditable: async () => {
        // 默认情况下可以编辑
        await page
          .getByLabel('block-item-CollectionField-general-form-general.password-password')
          .getByRole('textbox')
          .click();
        await page
          .getByLabel('block-item-CollectionField-general-form-general.password-password')
          .getByRole('textbox')
          .fill('test112233password');
      },
      expectReadonly: async () => {
        // 只读模式下，输入框会被禁用
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.password-password').getByRole('textbox'),
        ).toBeDisabled();
      },
      expectEasyReading: async () => {
        // 输入框会消失，只剩下值
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.password-password').getByRole('textbox'),
        ).not.toBeVisible();
        await expect(page.getByLabel('block-item-CollectionField-general-form-general.password-password')).toHaveText(
          'password:********',
        );
      },
    });
  });

  test('set validation rules', async ({ page, mockPage, mockRecord }) => {
    await testSetValidationRules({
      page,
      gotoPage: () =>
        (async (mockPage, mockRecord) => {
          const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
          const record = await mockRecord('general');
          await nocoPage.goto();

          return record;
        })(mockPage, mockRecord),
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
        })(page, 'password'),
    });
  });
});
