/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Page, createBlockInPage, expect, oneEmptyGridCardBlock, test } from '@nocobase/test/e2e';
import { oneEmptyTableWithUsers } from '../../details-multi/__e2e__/templatesOfBug';
import { oneGridCardWithInheritFields } from './templatesOfBug';

const deleteButton = async (page: Page, name: string) => {
  await page.getByRole('button', { name }).hover();
  await page.getByRole('menuitem', { name: 'Delete' }).waitFor({ state: 'detached' });
  await page.getByRole('button', { name }).getByLabel('designer-schema-settings-').hover();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'OK', exact: true }).click();
};

test.describe('where grid card block can be added', () => {
  test('page', async ({ page, mockPage }) => {
    await mockPage().goto();

    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await createBlockInPage(page, 'Grid Card');
    await expect(page.getByLabel('block-item-BlockItem-users-grid-card')).toBeVisible();
  });

  test.skip('popup', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTableWithUsers).goto();

    // 1. 打开弹窗，通过 Associated records 创建一个列表区块
    await page.getByLabel('action-Action.Link-View').click();
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'Grid Card right' }).hover();
    await page.getByRole('menuitem', { name: 'Associated records right' }).hover();
    await page.getByRole('menuitem', { name: 'Roles' }).click();
    await page.mouse.move(300, 0);
    await page.waitForTimeout(100);
    await page.getByLabel('schema-initializer-Grid-').nth(1).hover();
    await page.getByRole('menuitem', { name: 'Role name' }).click();
    await page.mouse.move(300, 0);
    await page.reload();
    await expect(page.getByText('Root')).toBeVisible();
    await expect(page.getByText('Admin')).toBeVisible();
    await expect(page.getByText('Member')).toBeVisible();

    // 2. 通过 Other records 创建一个列表区块
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'Other records right' }).waitFor({ state: 'detached' });
    await page.getByRole('menuitem', { name: 'Grid Card right' }).hover();
    await page.getByRole('menuitem', { name: 'Other records right' }).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('schema-initializer-Grid-details:configureFields-users').hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await page.mouse.move(300, 0);
    await expect(
      page.getByLabel('block-item-CollectionField-users-grid-card-users.nickname-Nickname').getByText('Super Admin'),
    ).toBeVisible();
  });

  test('data selector popup', async ({ page, mockPage }) => {});
});

test.describe('configure global actions', () => {
  test('filter & add new & refresh', async ({ page, mockPage }) => {
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

    // delete buttons
    await deleteButton(page, 'Filter');
    await deleteButton(page, 'Add new');
    await deleteButton(page, 'Refresh');

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Filter' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Add new' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Refresh' })).not.toBeVisible();
  });
});

test.describe('configure item actions', () => {
  test('view & edit & delete', async ({ page, mockPage, mockRecord }) => {
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

    // delete buttons
    await deleteButton(page, 'View');
    await deleteButton(page, 'Edit');
    await deleteButton(page, 'Delete');

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-View-view-general-grid-card').first()).not.toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Edit-update-general-grid-card').first()).not.toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Delete-destroy-general-grid-card').first()).not.toBeVisible();
  });

  test('customize: popup & update record', async ({ page, mockPage, mockRecord }) => {
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

test.describe('configure fields', () => {
  test('display collection fields & display association fields & add text', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyGridCardBlock).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    const formItemInitializer = page.getByLabel('schema-initializer-Grid-details:configureFields-general').first();

    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch')).toBeChecked();

    // add association fields
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

    // delete fields
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).first().click();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch').first()).not.toBeChecked();

    await page.mouse.wheel(0, 300);
    await page.getByRole('menuitem', { name: 'Many to one right' }).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    await page.getByRole('menuitem', { name: 'Many to one right' }).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(
      page.getByLabel('block-item-CollectionField-general-grid-card-general.id-ID').first(),
    ).not.toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-general-grid-card-general.manyToOne.nickname').first(),
    ).not.toBeVisible();

    // add markdown
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).first().hover();
    await page.mouse.wheel(0, 300);
    await page.getByRole('menuitem', { name: 'Add Markdown' }).click();

    await expect(page.getByLabel('block-item-Markdown.Void-general-grid-card').first()).toBeVisible();
  });

  test.pgOnly('display inherit fields', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneGridCardWithInheritFields).waitForInit();
    const record = await mockRecord('child');
    await nocoPage.goto();

    // 选择继承的字段
    await page.getByLabel('schema-initializer-Grid-details:configureFields-child').hover();
    await page.getByRole('menuitem', { name: 'parentField1' }).click();
    await page.getByRole('menuitem', { name: 'parentField2' }).click();
    await page.mouse.move(300, 0);
    await expect(
      page
        .getByLabel('block-item-CollectionField-child-grid-card-child.parentField1-parentField1')
        .getByText(record.parentField1),
    ).toBeVisible();
    await expect(
      page
        .getByLabel('block-item-CollectionField-child-grid-card-child.parentField2-parentField2')
        .getByText(record.parentField2),
    ).toBeVisible();
  });
});
