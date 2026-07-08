/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Page, createBlockInPage, expect, oneEmptyGridCardBlock, test } from '@nocobase/test/e2e';

const deleteButton = async (page: Page, name: string) => {
  await page.getByRole('button', { name }).hover();
  await page.getByRole('menuitem', { name: 'Delete' }).waitFor({ state: 'detached' });
  await page.getByRole('button', { name }).getByLabel('designer-schema-settings-').hover();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'OK', exact: true }).click();
};

test.describe('grid card block initializer', () => {
  test('create grid card block on a page', async ({ page, mockPage }) => {
    await mockPage().goto();

    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await createBlockInPage(page, 'Grid Card');

    await expect(page.getByLabel('block-item-BlockItem-users-grid-card')).toBeVisible();
  });
});

test.describe('grid card actions initializer', () => {
  test('configure grid card collection actions', async ({ page, mockPage }) => {
    await mockPage(oneEmptyGridCardBlock).goto();

    await page.getByLabel('schema-initializer-ActionBar-gridCard:configureActions-general').hover();
    await page.getByRole('menuitem', { name: 'Filter' }).click();
    await page.getByLabel('schema-initializer-ActionBar-gridCard:configureActions-general').hover();
    await page.getByRole('menuitem', { name: 'Add new' }).click();
    await page.getByLabel('schema-initializer-ActionBar-gridCard:configureActions-general').hover();
    await page.getByRole('menuitem', { name: 'Refresh' }).click();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Filter' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add new' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible();

    await deleteButton(page, 'Filter');
    await deleteButton(page, 'Add new');
    await deleteButton(page, 'Refresh');

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Filter' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Add new' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Refresh' })).not.toBeVisible();
  });

  test('configure grid card record actions', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyGridCardBlock).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await page.getByLabel('schema-initializer-ActionBar-gridCard:configureItemActions-general').first().hover();
    await page.getByRole('menuitem', { name: 'View' }).click();
    await page.getByLabel('schema-initializer-ActionBar-gridCard:configureItemActions-general').first().hover();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await page.getByLabel('schema-initializer-ActionBar-gridCard:configureItemActions-general').first().hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-View-view-general-grid-card').first()).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Edit-update-general-grid-card').first()).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Delete-destroy-general-grid-card').first()).toBeVisible();

    await deleteButton(page, 'View');
    await deleteButton(page, 'Edit');
    await deleteButton(page, 'Delete');

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-View-view-general-grid-card').first()).not.toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Edit-update-general-grid-card').first()).not.toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Delete-destroy-general-grid-card').first()).not.toBeVisible();
  });

  test('configure grid card custom record actions', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyGridCardBlock).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await page.getByLabel('schema-initializer-ActionBar-gridCard:configureItemActions-general').first().hover();
    await page.getByRole('menuitem', { name: 'Popup' }).click();
    await page.getByLabel('schema-initializer-ActionBar-gridCard:configureItemActions-general').first().hover();
    await page.getByRole('menuitem', { name: 'Update record' }).click();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-Popup-customize:popup-general-grid-card').first()).toBeVisible();
    await expect(
      page.getByLabel('action-Action.Link-Update record-customize:update-general-grid-card').first(),
    ).toBeVisible();
  });
});

test.describe('grid card fields initializer', () => {
  test('configure grid card fields and markdown content', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyGridCardBlock).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    const formItemInitializer = page.getByLabel('schema-initializer-Grid-details:configureFields-general').first();

    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch')).toBeChecked();

    await page.mouse.wheel(0, 300);
    await page.getByRole('menuitem', { name: 'Many to one right' }).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    await page.getByRole('menuitem', { name: 'Many to one right' }).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-grid-card-general.id-ID').first()).toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-general-grid-card-users.nickname-Nickname').first(),
    ).toBeVisible();

    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).first().click();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch').first()).not.toBeChecked();

    await page.mouse.wheel(0, 300);
    await page.getByRole('menuitem', { name: 'Many to one right' }).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    await page.getByRole('menuitem', { name: 'Many to one right' }).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-grid-card-general.id-ID').first()).not.toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-general-grid-card-general.manyToOne.nickname').first(),
    ).not.toBeVisible();

    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).first().hover();
    await page.mouse.wheel(0, 300);
    await page.getByRole('menuitem', { name: 'Add Markdown' }).click();

    await expect(page.getByLabel('block-item-Markdown.Void-general-grid-card').first()).toBeVisible();
  });
});
