/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Page, createBlockInPage, expect, oneEmptyListBlock, test } from '@nocobase/test/e2e';
import { oneEmptyTableWithUsers } from '../../details-multi/__e2e__/templatesOfBug';

const deleteButton = async (page: Page, name: string) => {
  await page.getByRole('button', { name }).hover();
  await page.getByRole('menuitem', { name: 'Delete' }).waitFor({ state: 'detached' });
  await page.getByRole('button', { name }).getByLabel('designer-schema-settings-').hover();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'OK', exact: true }).click();
};

test.describe('where list block can be added', () => {
  test('page', async ({ page, mockPage }) => {
    await mockPage().goto();

    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await createBlockInPage(page, 'List');
    await expect(page.getByLabel('block-item-CardItem-users-list')).toBeVisible();
  });

  test('popup', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTableWithUsers).goto();

    // 1. 打开弹窗，通过 Associated records 创建一个列表区块
    await page.getByLabel('action-Action.Link-View').click();
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'List right' }).hover();
    await page.getByRole('menuitem', { name: 'Associated records right' }).hover();
    await page.getByRole('menuitem', { name: 'Roles' }).click();
    await page.mouse.move(300, 0);
    await page.waitForTimeout(300);
    await page.getByLabel('schema-initializer-Grid-').nth(1).hover();
    await page.getByRole('menuitem', { name: 'Role name' }).click();
    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-').getByText('Root')).toBeVisible();
    await expect(page.getByLabel('block-item-CollectionField-').getByText('Admin')).toBeVisible();
    await expect(page.getByLabel('block-item-CollectionField-').getByText('Member')).toBeVisible();

    // 2. 通过 Other records 创建一个列表区块
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'List right' }).hover();
    await page.getByRole('menuitem', { name: 'Other records right' }).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('schema-initializer-Grid-details:configureFields-users').hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await page.mouse.move(300, 0);
    await expect(
      page.getByLabel('block-item-CollectionField-users-list-users.nickname-Nickname').getByText('Super Admin'),
    ).toBeVisible();
  });
});

test.describe('configure global actions', () => {
  test('filter & add new & refresh', async ({ page, mockPage }) => {
    await mockPage(oneEmptyListBlock).goto();

    await page.getByLabel('schema-initializer-ActionBar-list:configureActions-general').hover();
    await page.getByRole('menuitem', { name: 'Filter' }).click();
    await page.getByLabel('schema-initializer-ActionBar-list:configureActions-general').hover();
    await page.getByRole('menuitem', { name: 'Add new' }).click();
    await page.getByLabel('schema-initializer-ActionBar-list:configureActions-general').hover();
    await page.getByRole('menuitem', { name: 'Refresh' }).click();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Filter' })).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Add new' })).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Refresh' })).toHaveCount(1);
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
    const nocoPage = await mockPage(oneEmptyListBlock).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await page.getByLabel('schema-initializer-ActionBar-list:configureItemActions-general').first().hover();
    await page.getByRole('menuitem', { name: 'View' }).click();
    await page.getByLabel('schema-initializer-ActionBar-list:configureItemActions-general').first().hover();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await page.getByLabel('schema-initializer-ActionBar-list:configureItemActions-general').first().hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-View-view-general-list').first()).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Edit-update-general-list').first()).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Delete-destroy-general-list').first()).toBeVisible();

    // delete buttons
    await deleteButton(page, 'View');
    await deleteButton(page, 'Edit');
    await deleteButton(page, 'Delete');

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-View-view-general-list').first()).not.toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Edit-update-general-list').first()).not.toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Delete-destroy-general-list').first()).not.toBeVisible();
  });

  test('customize: popup & update record', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyListBlock).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await page.getByLabel('schema-initializer-ActionBar-list:configureItemActions-general').first().hover();
    await page.getByRole('menuitem', { name: 'Popup' }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('schema-initializer-ActionBar-list:configureItemActions-general').first().hover();
    await page.getByRole('menuitem', { name: 'Update record' }).click();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-Popup-customize:popup-general-list').first()).toBeVisible();
    await expect(
      page.getByLabel('action-Action.Link-Update record-customize:update-general-list').first(),
    ).toBeVisible();
  });
});

test.describe('configure fields', () => {
  test('display collection fields & display association fields & add text', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyListBlock).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    const formItemInitializer = page.getByLabel('schema-initializer-Grid-details:configureFields-general').first();

    // add fields
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch')).toBeChecked();

    // add association fields
    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    // TODO: 二级菜单点击后，不应该被关闭；只有在鼠标移出下拉列表的时候，才应该被关闭
    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-list-general.id-ID').first()).toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-general-list-users.nickname-Nickname').first(),
    ).toBeVisible();

    // delete fields
    await formItemInitializer.hover();
    await page.getByRole('tooltip').getByText('Display association fields').hover();
    await page.mouse.wheel(0, -300);
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch')).not.toBeChecked();

    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-list-general.id-ID').first()).not.toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-general-list-general.manyToOne.nickname').first(),
    ).not.toBeVisible();

    // add markdown
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'Add Markdown' }).click();
    await expect(page.getByLabel('block-item-Markdown.Void-general-list').first()).toBeVisible();
  });
});
