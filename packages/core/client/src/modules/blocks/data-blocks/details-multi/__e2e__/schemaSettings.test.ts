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
  oneDetailBlockWithM2oFieldToGeneral,
  oneEmptyDetailsBlock,
  test,
} from '@nocobase/test/e2e';
import { detailBlockWithLinkageRule, detailsBlockWithLinkageRule } from './templatesOfBug';

test.describe('multi data details block schema settings', () => {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneDetailBlockWithM2oFieldToGeneral).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('block-item-CardItem-targetToGeneral-details').hover();
        await page.getByLabel('designer-schema-settings-CardItem-DetailsDesigner-targetToGeneral').hover();
      },
      supportedOptions: [
        'Edit block title',
        'Linkage rules',
        'Set the data scope',
        'Set default sorting rules',
        // 'Save as template',
        'Delete',
      ],
    });
  });
  test('support linkage rule', async ({ page, mockPage }) => {
    const nocoPage = await mockPage(detailBlockWithLinkageRule).waitForInit();
    await nocoPage.goto();
    await expect(page.getByLabel('block-item-CollectionField-users-details-users.email-Email')).not.toBeVisible();
    // 禁用规则，联动规则失效
    await page.getByLabel('block-item-CardItem-users-').hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:detailsWithPagination-users').hover();
    await page.getByText('Field Linkage rules').click();
    await page.getByRole('switch', { name: 'On Off' }).click();
    await page.getByRole('button', { name: 'OK' }).click();
    await page.reload();
    await expect(page.getByLabel('block-item-CollectionField-users-details-users.email-Email')).toBeVisible();
  });
  test('multi detail block support linkage rule', async ({ page, mockPage }) => {
    const nocoPage = await mockPage(detailsBlockWithLinkageRule).waitForInit();
    await nocoPage.goto();
    await expect(page.getByLabel('block-item-CollectionField-roles-details-roles.title')).not.toBeVisible();
    await page.getByRole('button', { name: 'right' }).click();
    await expect(page.getByLabel('block-item-CollectionField-roles-details-roles.title')).toBeVisible();
  });
});

test.describe('actions schema settings', () => {
  test('edit & delete & duplicate', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneEmptyDetailsBlock).goto();
    await mockRecord('general');

    // 创建 Edit & Delete 两个按钮
    await page.getByLabel('schema-initializer-ActionBar-detailsWithPaging:configureActions-general').hover();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await page.getByLabel('schema-initializer-ActionBar-detailsWithPaging:configureActions-general').hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.mouse.move(0, 300);

    // Edit button settings ---------------------------------------------------------------
    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await expect(page.getByRole('button', { name: 'Edit' })).toHaveCount(1);
        await page.getByRole('button', { name: 'Edit' }).hover();
        await page.getByRole('button', { name: 'designer-schema-settings-Action' }).hover();
      },
      supportedOptions: ['Edit button', 'Linkage rules', 'Open mode', 'Popup size', 'Delete'],
    });

    // Delete settings -------------------------------------------------------------------
    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByRole('button', { name: 'Delete' }).hover();
        await page.getByRole('button', { name: 'designer-schema-settings-Action' }).hover();
      },
      supportedOptions: ['Edit button', 'Linkage rules', 'Delete'],
    });
  });
});
