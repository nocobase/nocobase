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
  expectInitializerMenu,
  oneTableBlockWithAddNewAndViewAndEditAndSystemInfoFields,
  test,
} from '@nocobase/test/e2e';

test.describe('form item & create form', () => {
  test('configure fields', async ({ page, mockPage }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndSystemInfoFields).waitForInit();
    await nocoPage.goto();

    await expectInitializerMenu({
      page,
      showMenu: async () => {
        await page.getByRole('button', { name: 'Add new' }).click();
        await page.getByLabel('schema-initializer-Grid-form:configureFields-general').hover();
      },
      supportedOptions: ['Created at', 'Last updated at', 'Created by', 'Last updated by', 'ID', 'Table OID'],
    });
  });
});

test.describe('form item & edit form', () => {
  test('configure fields', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndSystemInfoFields).waitForInit();
    const record = await mockRecord('general');
    await nocoPage.goto();

    await expectInitializerMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
        await page.getByLabel('schema-initializer-Grid-form:configureFields-general').hover();
      },
      supportedOptions: ['Created at', 'Last updated at', 'Created by', 'Last updated by', 'ID', 'Table OID'],
      expectValue: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.createdAt-Created at')
            .getByText(record.createdAt.slice(0, 2)),
        ).toBeVisible();
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.updatedAt-Last updated at')
            .getByText(record.updatedAt.slice(0, 2)),
        ).toBeVisible();
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.id-ID').getByText(record.id),
        ).toBeVisible();
      },
    });
  });
});

test.describe('form item & filter form', () => {
  test('should be editable', async ({ page, mockPage, mockRecord }) => {
    await mockPage().goto();

    // 1. 添加一个 filter form 区块
    await page.getByLabel('schema-initializer-Grid-page:').hover();
    await page.getByRole('menuitem', { name: 'Form right' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();

    // 2. 为 filter form 添加一个 createdAt 字段
    await page.getByLabel('schema-initializer-Grid-filterForm:configureFields-users').hover();
    await page.getByRole('menuitem', { name: 'Created at' }).first().click();
    await page.mouse.move(300, 0);

    // 3. createdAt 字段字段应该是可编辑的
    await expect(page.getByPlaceholder('Select date')).toBeVisible();
  });
});

test.describe('form item & view form', () => {
  test('configure fields', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndSystemInfoFields).waitForInit();
    const record = await mockRecord('general');
    await nocoPage.goto();

    await expectInitializerMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('action-Action.Link-View').click();
        await page.getByLabel('schema-initializer-Grid-details:configureFields-general').hover();
      },
      supportedOptions: ['Created at', 'Last updated at', 'Created by', 'Last updated by', 'ID', 'Table OID'],
      expectValue: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.createdAt-Created at')
            .getByText(record.createdAt.slice(0, 2)),
        ).toBeVisible();
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.updatedAt-Last updated at')
            .getByText(record.updatedAt.slice(0, 2)),
        ).toBeVisible();
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.id-ID').getByText(record.id),
        ).toBeVisible();
      },
    });
  });
});

test.describe('table column & table', () => {
  test('configure columns', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndSystemInfoFields).waitForInit();
    const record = await mockRecord('general');
    await nocoPage.goto();

    await expectInitializerMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('schema-initializer-TableV2-').hover();
        await page.getByRole('menuitem', { name: 'Created at' }).click();
        await page.getByRole('menuitem', { name: 'Last updated at' }).click();
        await page.getByRole('menuitem', { name: 'Created by' }).click();
        await page.getByRole('menuitem', { name: 'Last updated by' }).click();
        await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
        await page.getByRole('menuitem', { name: 'Table OID' }).click();
      },
      supportedOptions: ['Created at', 'Last updated at', 'Created by', 'Last updated by', 'ID', 'Table OID'],
      expectValue: async () => {
        await expect(page.getByRole('button', { name: record.createdAt.slice(0, 2) }).nth(0)).toBeVisible();
        await expect(page.getByRole('button', { name: record.updatedAt.slice(0, 2) }).nth(1)).toBeVisible();
        await expect(page.getByRole('button', { name: record.id })).toBeVisible();
      },
    });
  });
});
