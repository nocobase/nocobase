/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, oneTableBlockWithAddNewAndViewAndEditAndBasicFields, test } from '@nocobase/test/e2e';
import {
  clickDeleteAndOk,
  testDisplayTitle,
  testEditDescription,
  testEditFieldTitle,
  testPattern,
  testRequired,
} from '../../utils';

test.describe('form item & create form', () => {
  test('set default value', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel(`block-item-CollectionField-general-form-general.color-color`).hover();
    await page.getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.color`).hover();
    // 简单测试下是否有选项，值的话无法选中，暂时测不了
    await expect(page.getByRole('menuitem', { name: 'Set default value' })).toBeVisible();
  });

  test('pattern', async ({ page, mockPage }) => {
    await testPattern({
      page,
      gotoPage: async () => {
        const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
        await nocoPage.goto();
      },
      openDialog: async () => {
        await page.getByRole('button', { name: 'Add new' }).click();
      },
      showMenu: async () => {
        await page.getByLabel(`block-item-CollectionField-general-form-general.color-color`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.color`)
          .hover();
      },
      expectEditable: async () => {
        // 默认情况下显示颜色选择框
        await page.getByLabel('color-picker-normal').hover();
        await expect(page.getByRole('button', { name: 'expanded Recommended', exact: true })).toBeVisible();
      },
      expectReadonly: async () => {
        // 只读模式下，不会显示颜色弹窗
        await page.getByLabel('color-picker-normal').hover();
        await expect(page.getByRole('button', { name: 'expanded Recommended', exact: true })).not.toBeVisible();
      },
      expectEasyReading: async () => {
        await expect(page.getByLabel('color-picker-read-pretty')).toBeVisible();
      },
    });
  });

  test('edit field title', async ({ page, mockPage, mockRecord, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel(`block-item-CollectionField-general-form-general.color-color`).hover();
    await page.getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.color`).hover();

    await testEditFieldTitle(page);
  });

  test('display title', async ({ page, mockPage, mockRecord, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel(`block-item-CollectionField-general-form-general.color-color`).hover();
    await page.getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.color`).hover();

    await testDisplayTitle(page, 'color');
  });

  test('delete', async ({ page, mockPage, mockRecord, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel(`block-item-CollectionField-general-form-general.color-color`).hover();
    await page.getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.color`).hover();

    await clickDeleteAndOk(page);
    await expect(page.getByText(`color:`)).not.toBeVisible();
  });

  test('edit description', async ({ page, mockPage, mockRecord, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel(`block-item-CollectionField-general-form-general.color-color`).hover();
    await page.getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.color`).hover();

    await testEditDescription(page);
  });

  test('required', async ({ page, mockPage, mockRecord, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel(`block-item-CollectionField-general-form-general.color-color`).hover();
    await page.getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.color`).hover();

    await testRequired(page);
  });
});
