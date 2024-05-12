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
  oneTableBlockWithAddNewAndViewAndEditAndMediaFields,
  test,
} from '@nocobase/test/e2e';
import { createColumnItem, showSettingsMenu } from '../../utils';

test.describe('form item & view form', () => {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndMediaFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();
        // 这里是为了等弹窗中的内容渲染稳定后，再去 hover，防止错位导致测试报错
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
      supportedOptions: ['Edit field title', 'Display title', 'Delete', 'Edit tooltip', 'Size'],
      unsupportedOptions: ['Set default value'],
    });
  });

  test('size', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndMediaFields).waitForInit();
    const record = await mockRecord('general');
    await nocoPage.goto();

    await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();
    // 这里是为了等弹窗中的内容渲染稳定后，再去 hover，防止错位导致测试报错
    await page.waitForTimeout(1000);

    // 默认尺寸
    // 这里的尺寸不稳定，所以用 try catch 来处理
    const testDefault = async (value) => {
      await expect(
        page
          .getByLabel('block-item-CollectionField-general-form-general.attachment-attachment')
          .getByRole('link', { name: record.attachment.title })
          .first(),
      ).toHaveJSProperty('offsetWidth', value, { timeout: 1000 });
    };
    try {
      await testDefault(94);
    } catch (error) {
      try {
        await testDefault(95);
      } catch (err) {
        await testDefault(96);
      }
    }

    // 改为大尺寸
    const testLarge = async (value) => {
      await expect(
        page
          .getByLabel('block-item-CollectionField-general-form-general.attachment-attachment')
          .getByRole('link', { name: record.attachment.title })
          .first(),
      ).toHaveJSProperty('offsetWidth', value, { timeout: 1000 });
    };
    // 这里是为了等弹窗中的内容渲染稳定后，再去 hover，防止错位导致测试报错
    await page.waitForTimeout(1000);
    await page
      .getByLabel(`block-item-CollectionField-general-form-general.attachment-attachment`, { exact: true })
      .hover();
    await page
      .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.attachment`, {
        exact: true,
      })
      .hover();
    await page.getByRole('menuitem', { name: 'Size' }).click();
    await page.getByRole('option', { name: 'Large' }).click();
    try {
      await testLarge(153);
    } catch (err) {
      try {
        await testLarge(154);
      } catch (err) {
        await testLarge(152);
      }
    }

    // 改为小尺寸
    const testSmall = async (value) => {
      await expect(
        page
          .getByLabel('block-item-CollectionField-general-form-general.attachment-attachment')
          .getByRole('link', { name: record.attachment.title })
          .first(),
      ).toHaveJSProperty('offsetWidth', value, { timeout: 1000 });
    };
    await (async (page: Page, fieldName: string) => {
      // 这里是为了等弹窗中的内容渲染稳定后，再去 hover，防止错位导致测试报错
      await page.waitForTimeout(1000);
      await page
        .getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`, { exact: true })
        .hover();
      await page
        .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`, {
          exact: true,
        })
        .hover();
    })(page, 'attachment');
    await page.getByRole('menuitem', { name: 'Size' }).click();
    await page.getByRole('option', { name: 'Small' }).click();
    try {
      await testSmall(25);
    } catch (err) {
      try {
        await testSmall(26);
      } catch (err) {
        await testSmall(28);
      }
    }
  });
});

test.describe('table column & table', () => {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndMediaFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await createColumnItem(page, 'attachment');
        await showSettingsMenu(page, 'attachment');
      },
      supportedOptions: ['Custom column title', 'Column width', 'Delete'],
      unsupportedOptions: ['Size'],
    });
  });
});
