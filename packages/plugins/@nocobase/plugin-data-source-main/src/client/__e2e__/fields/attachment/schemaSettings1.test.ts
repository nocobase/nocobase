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
  oneTableBlockWithAddNewAndViewAndEditAndMediaFields,
  test,
} from '@nocobase/test/e2e';
import { testPattern } from '../../utils';

test.describe('form item & create form', () => {
  test('supported options', async ({ page, mockPage }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndMediaFields).waitForInit();
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByRole('button', { name: 'Add new' }).click();
        await page.getByLabel(`block-item-CollectionField-general-form-general.attachment-attachment`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.attachment`)
          .hover();
      },
      supportedOptions: ['Edit field title', 'Display title', 'Edit description', 'Required', 'Pattern', 'Delete'],
    });
  });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    await testPattern({
      page,
      gotoPage: async () => {
        await mockPage(oneTableBlockWithAddNewAndViewAndEditAndMediaFields).goto();
      },
      openDialog: async () => {
        await page.getByRole('button', { name: 'Add new' }).click();
      },
      showMenu: async () => {
        await page
          .getByLabel(`block-item-CollectionField-general-form-general.attachment-attachment`, { exact: true })
          .hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.attachment`, {
            exact: true,
          })
          .hover();
      },
      expectEditable: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.attachment-attachment')
            .locator('.ant-upload-select'),
        ).toBeVisible();
      },
      expectReadonly: async () => {
        await expect(page.getByRole('button', { name: 'plus Upload' })).not.toBeVisible();
      },
      expectEasyReading: async () => {
        await expect(page.getByRole('button', { name: 'plus Upload' })).not.toBeVisible();
      },
    });
  });
});
test.describe('form item & edit form', () => {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndMediaFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
        // 等待弹窗内容渲染完成
        await page.waitForTimeout(1000);
        await page
          .getByLabel(`block-item-CollectionField-general-form-general.attachment-attachment`, { exact: true })
          .hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.attachment`, {
            exact: true,
          })
          .hover();
      },
      supportedOptions: ['Edit field title', 'Display title', 'Edit description', 'Required', 'Pattern', 'Delete'],
      unsupportedOptions: ['Set default value'],
    });
  });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    let record: any = null;
    await testPattern({
      page,
      gotoPage: async () => {
        const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndMediaFields).waitForInit();
        record = await mockRecord('general');
        await nocoPage.goto();
      },
      openDialog: async () => {
        await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
        // 等待弹窗内容渲染完成
        await page.waitForTimeout(1000);
      },
      showMenu: async () => {
        await page
          .getByLabel(`block-item-CollectionField-general-form-general.attachment-attachment`, { exact: true })
          .hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.attachment`, {
            exact: true,
          })
          .hover();
      },
      expectEditable: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.attachment-attachment')
            .getByRole('link', { name: record.attachment.title })
            .first(),
        ).toBeVisible();
      },
      expectReadonly: async () => {
        await page
          .getByLabel('block-item-CollectionField-general-form-general.attachment-attachment')
          .getByRole('link', { name: record.attachment.title })
          .first()
          .hover();
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.attachment-attachment')
            .getByRole('button', { name: 'delete' }),
        ).not.toBeVisible();
      },
      expectEasyReading: async () => {
        await page
          .getByLabel('block-item-CollectionField-general-form-general.attachment-attachment')
          .getByRole('link', { name: record.attachment.title })
          .first()
          .hover();
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.attachment-attachment')
            .getByRole('button', { name: 'delete' }),
        ).not.toBeVisible();
      },
    });
  });
});
