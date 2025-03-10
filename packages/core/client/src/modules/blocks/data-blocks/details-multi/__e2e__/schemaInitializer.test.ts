/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Page, createBlockInPage, expect, oneEmptyDetailsBlock, test } from '@nocobase/test/e2e';
import { oneEmptyTableWithUsers } from './templatesOfBug';

const deleteButton = async (page: Page, name: string) => {
  await page.getByRole('button', { name }).hover();
  await page.getByRole('menuitem', { name: 'Delete' }).waitFor({ state: 'detached' });
  await page.getByRole('button', { name }).getByLabel('designer-schema-settings-').hover();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'OK', exact: true }).click();
};

test.describe('where multi data details block can be added', () => {
  test('page', async ({ page, mockPage }) => {
    await mockPage().goto();
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await createBlockInPage(page, 'Details');
    await expect(page.getByLabel('block-item-CardItem-users-details')).toBeVisible();
  });

  test('popup', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTableWithUsers).goto();

    // 1. 打开弹窗，通过 Associated records 添加一个详情区块
    await page.getByLabel('action-Action.Link-View').click();
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'Associated records right' }).waitFor({ state: 'detached' });
    await page.getByRole('menuitem', { name: 'Details right' }).hover();
    await page.getByRole('menuitem', { name: 'Associated records right' }).hover();
    await page.getByRole('menuitem', { name: 'Roles' }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('schema-initializer-Grid-details:configureFields-roles').hover();
    await page.getByRole('menuitem', { name: 'Role UID' }).click();
    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-').getByText('admin')).toBeVisible();

    // 2. 打开弹窗，通过 Other records 添加一个详情区块
    await page.getByRole('menuitem', { name: 'Details right' }).waitFor({ state: 'detached' });
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'Details right' }).hover();
    await page.getByRole('menuitem', { name: 'Other records right' }).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('schema-initializer-Grid-details:configureFields-users').click();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await page.mouse.move(300, 0);
    await expect(
      page.getByLabel('block-item-CollectionField-users-details-users.nickname-Nickname').getByText('Super Admin'),
    ).toBeVisible();
  });
});

test.describe('configure fields', () => {
  test('display collection fields & display association fields & add text', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneEmptyDetailsBlock).goto();
    await mockRecord('general');

    const formItemInitializer = page.getByLabel('schema-initializer-Grid-details:configureFields-general');

    // add fields
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'Single select', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'Single select', exact: true }).getByRole('switch')).toBeChecked();

    // add association fields
    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(
      page.getByLabel('block-item-CollectionField-general-details-general.singleSelect-Single select'),
    ).toBeVisible();
    await expect(page.getByLabel('block-item-CollectionField-general-details-users.nickname-Nickname')).toBeVisible();

    // delete fields
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'Single select', exact: true }).click();
    await expect(
      page.getByRole('menuitem', { name: 'Single select', exact: true }).getByRole('switch'),
    ).not.toBeChecked();

    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(
      page.getByLabel('block-item-CollectionField-general-details-general.singleSelect-Single select'),
    ).not.toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-general-details-general.manyToOne.nickname'),
    ).not.toBeVisible();

    // add markdown
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'Add Markdown' }).click();
    await expect(page.getByLabel('block-item-Markdown.Void-general-details')).toBeVisible();
  });
});

test.describe('configure actions', () => {
  test('edit & delete & duplicate', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyDetailsBlock).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await page.getByLabel('schema-initializer-ActionBar-detailsWithPaging:configureActions-general').hover();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await page.getByLabel('schema-initializer-ActionBar-detailsWithPaging:configureActions-general').hover();
    await page.getByText('Delete').click();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Edit' })).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();

    // delete buttons
    await deleteButton(page, 'Edit');
    await deleteButton(page, 'Delete');

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Edit' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' })).not.toBeVisible();
  });
});
