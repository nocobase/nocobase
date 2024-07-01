/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { uid } from '@nocobase/utils';
import { CollectionManagerPage } from '../utils';

test.describe('create collection', () => {
  test('basic', async ({ page }) => {
    const collectionDisplayName = uid();
    // 避免以数字开头，会报错
    const collectionName = `t_${uid()}`;
    const description = uid();
    const collectionManagerPage = new CollectionManagerPage(page);
    await collectionManagerPage.goto();

    const collectionSettings = await collectionManagerPage.createCollection('General collection');
    await collectionSettings.change('Collection display name', collectionDisplayName);
    await collectionSettings.change('Collection name', collectionName);
    await collectionSettings.change('Description', description);
    await collectionSettings.submit();

    await expect(page.getByRole('cell', { name: collectionDisplayName, exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: collectionName, exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: description, exact: true })).toBeVisible();

    // Delete --------------------------------------------------------------------------------
    await collectionManagerPage.deleteItem(collectionName);
    await expect(page.getByRole('cell', { name: collectionName, exact: true })).toBeHidden();
  });

  test('inherits', async ({ page }) => {
    const collectionDisplayName = uid();
    // 避免以数字开头，会报错
    const collectionName = `t_${uid()}`;
    const description = uid();
    const collectionManagerPage = new CollectionManagerPage(page);
    await collectionManagerPage.goto();

    const collectionSettings = await collectionManagerPage.createCollection('General collection');
    await collectionSettings.change('Collection display name', collectionDisplayName);
    await collectionSettings.change('Collection name', collectionName);
    await collectionSettings.change('Description', description);
    await collectionSettings.change('Inherits', ['Users']);
    await collectionSettings.submit();

    await expect(page.getByRole('cell', { name: collectionDisplayName, exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: collectionName, exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: description, exact: true })).toBeVisible();

    await collectionManagerPage.deleteItem(collectionName);
  });

  test('categories', async ({ page }) => {
    const categoriesName = uid();
    const collectionDisplayName = uid();
    // 避免以数字开头，会报错
    const collectionName = `t_${uid()}`;
    const description = uid();
    const collectionManagerPage = new CollectionManagerPage(page);
    await collectionManagerPage.goto();
    await collectionManagerPage.addCategory(categoriesName, 'Red');

    const collectionSettings = await collectionManagerPage.createCollection('General collection');
    await collectionSettings.change('Collection display name', collectionDisplayName);
    await collectionSettings.change('Collection name', collectionName);
    await collectionSettings.change('Description', description);
    await collectionSettings.change('Categories', [categoriesName]);
    await collectionSettings.submit();

    await expect(page.getByRole('cell', { name: collectionDisplayName, exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: collectionName, exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: description, exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: categoriesName, exact: true })).toBeVisible();

    await collectionManagerPage.deleteCategory(categoriesName);
    await collectionManagerPage.deleteItem(collectionName);
  });

  test('uncheck presetFields', async ({ page }) => {
    const collectionDisplayName = uid();
    // 避免以数字开头，会报错
    const collectionName = `t_${uid()}`;
    const collectionManagerPage = new CollectionManagerPage(page);
    await collectionManagerPage.goto();

    const collectionSettings = await collectionManagerPage.createCollection('General collection');
    await collectionSettings.change('Collection display name', collectionDisplayName);
    await collectionSettings.change('Collection name', collectionName);
    await collectionSettings.change('Primary key, unique identifier, self growth', false);
    await collectionSettings.change('Store the creation user of each record', false);
    await collectionSettings.change('Store the last update user of each record', false);
    await collectionSettings.change('Store the creation time of each record', false);
    await collectionSettings.change('Store the last update time of each record', false);
    await collectionSettings.submit();

    await expect(page.getByRole('cell', { name: collectionDisplayName })).toBeVisible();
    await expect(page.getByRole('cell', { name: collectionName, exact: true })).toBeVisible();

    await collectionManagerPage.deleteItem(collectionName);
  });
});
