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

    const collectionSettings = await collectionManagerPage.createCollection('File collection');
    await collectionSettings.change('Collection display name', collectionDisplayName);
    await collectionSettings.change('Collection name', collectionName);
    await collectionSettings.change('Description', description);
    await collectionSettings.change('File storage', 'Local storage');
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

    const collectionSettings = await collectionManagerPage.createCollection('File collection');
    await collectionSettings.change('Collection display name', collectionDisplayName);
    await collectionSettings.change('Collection name', collectionName);
    await collectionSettings.change('Description', description);
    await collectionSettings.change('Inherits', ['Users']);
    await collectionSettings.change('File storage', 'Local storage');
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

    const collectionSettings = await collectionManagerPage.createCollection('File collection');
    await collectionSettings.change('Collection display name', collectionDisplayName);
    await collectionSettings.change('Collection name', collectionName);
    await collectionSettings.change('Description', description);
    await collectionSettings.change('Categories', [categoriesName]);
    await collectionSettings.change('File storage', 'Local storage');
    await collectionSettings.submit();

    await expect(page.getByRole('cell', { name: collectionDisplayName, exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: collectionName, exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: description, exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: categoriesName, exact: true })).toBeVisible();

    await collectionManagerPage.deleteCategory(categoriesName);
    await collectionManagerPage.deleteItem(collectionName);
  });
});

test.describe('configure fields', () => {});

test.describe('edit', () => {});
