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
  oneTableBlockWithAddNewAndViewAndEditAndAssociationFields,
  test,
} from '@nocobase/test/e2e';

test.describe('form item & view form', () => {
  test('supported options', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).waitForInit();
    await mockRecords('general', 1);
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();
        await page.getByLabel(`block-item-CollectionField-general-form-general.manyToMany-manyToMany`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.manyToMany`)
          .hover();
      },
      supportedOptions: [
        'Edit field title',
        'Display title',
        'Edit tooltip',
        'Field component',
        'Enable link',
        'Title field',
        'Delete',
      ],
      unsupportedOptions: ['Set default value'],
    });
  });

  test('field component', async ({ page, mockPage, mockRecords }) => {
    await (async (mockPage, mockRecords) => {
      const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).waitForInit();
      const record = (await mockRecords('general', 1))[0];
      await nocoPage.goto();

      return record;
    })(mockPage, mockRecords);
    await (async (page: Page) => {
      await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();
    })(page);
    await (async (page: Page, fieldName: string) => {
      await page.getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`).hover();
      await page
        .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`)
        .hover();
    })(page, 'manyToMany');
    await page.getByRole('menuitem', { name: 'Field component' }).click();

    // 断言支持的选项
    await expect(page.getByRole('option', { name: 'Title', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Tag', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Sub-details', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Sub-table', exact: true })).toBeVisible();

    // 切换到 Sub-details，应该显示 Initializer 按钮
    await page.getByRole('option', { name: 'Sub-details', exact: true }).click();
    await page.mouse.move(300, 0);
    await expect(
      page
        .getByLabel('block-item-CollectionField-general-form-general.manyToMany-manyToMany')
        .getByLabel('schema-initializer-Grid-form:')
        .first(),
    ).toBeVisible();
  });

  test('title field', async ({ page, mockPage, mockRecords }) => {
    await (async (mockPage, mockRecords) => {
      const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).waitForInit();
      const record = (await mockRecords('general', 1))[0];
      await nocoPage.goto();

      return record;
    })(mockPage, mockRecords);
    await (async (page: Page) => {
      await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();
    })(page);
    await (async (page: Page, fieldName: string) => {
      await page.getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`).hover();
      await page
        .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`)
        .hover();
    })(page, 'manyToMany');
    await expect(page.getByRole('menuitem', { name: 'Title field' })).toBeVisible();
  });

  test('enable link', async ({ page, mockPage, mockRecords }) => {
    // test.fail();
    const record = await (async (mockPage, mockRecords) => {
      const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).waitForInit();
      const record = (await mockRecords('general', 1))[0];
      await nocoPage.goto();

      return record;
    })(mockPage, mockRecords);
    await (async (page: Page) => {
      await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();
    })(page);

    // 初始状态是一个可点击的链接
    await expect(
      page
        .getByLabel('block-item-CollectionField-general-form-general.manyToMany-manyToMany')
        .locator('a')
        .filter({ hasText: record.manyToMany[0].id }),
    ).toBeVisible();

    await (async (page: Page, fieldName: string) => {
      await page.getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`).hover();
      await page
        .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`)
        .hover();
    })(page, 'manyToMany');

    // 默认情况下是开启状态
    await expect(page.getByRole('menuitem', { name: 'Enable link' }).getByRole('switch')).toBeChecked();
    await page.getByRole('menuitem', { name: 'Enable link' }).click();
    await expect(page.getByRole('menuitem', { name: 'Enable link' }).getByRole('switch')).not.toBeChecked();

    // 应变为非链接状态
    await expect(
      page
        .getByLabel('block-item-CollectionField-general-form-general.manyToMany-manyToMany')
        .locator('a')
        .filter({ hasText: record.manyToMany[0].id }),
    ).not.toBeVisible();

    // 再次开启链接状态
    await page.getByRole('menuitem', { name: 'Enable link' }).click();
    await expect(page.getByRole('menuitem', { name: 'Enable link' }).getByRole('switch')).toBeChecked();
    await expect(
      page
        .getByLabel('block-item-CollectionField-general-form-general.manyToMany-manyToMany')
        .locator('a')
        .filter({ hasText: record.manyToMany[0].id }),
    ).toBeVisible();
  });
});
