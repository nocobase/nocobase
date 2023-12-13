import { expect, test } from '@nocobase/test/client';
import { oneEmptyTableBlockWithFields } from './utils';

test.describe('field acl check for view', () => {
  test('collection field permission for view ', async ({ page, mockPage }) => {
    const nocoPage = await mockPage(oneEmptyTableBlockWithFields).waitForInit();
    await nocoPage.goto();
    await expect(await page.getByRole('button', { name: 'singleLineText' })).toBeVisible();
    await expect(await page.getByRole('button', { name: 'phone' })).toBeVisible();
    await expect(await page.getByRole('button', { name: 'percent' })).toBeVisible();
    await page.getByTestId('plugin-settings-button').hover();
    await page.getByLabel('acl').click();
    await page.getByLabel('action-Action.Link-Configure-roles-admin').click();
    await page.getByRole('tab', { name: 'Action permissions' }).click();
    await page.getByLabel('action-Action.Link-Configure-collections-general').click();
    await page.getByLabel('Individual').check();
    await page.getByRole('row', { name: 'phone' }).getByLabel('view_checkbox').check();

    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('api/roles/admin/resources:create')),
      page.getByLabel('action-Action-Submit-collections-general').click(),
    ]);
    const postData = request.postDataJSON();
    expect(postData.actions).toStrictEqual([{ name: 'view', fields: ['phone'], scope: null }]);
    expect(postData.name).toBe('general');
    await page.getByLabel('drawer-Action.Drawer-roles-Configure permissions-mask').click();
    await page.goBack();
    await page.getByTestId('user-center-button').hover();
    await page.getByRole('button', { name: 'switch-role' }).click();
    await page.getByRole('option', { name: 'Admin' }).click();
    await page.reload();
    await expect(await page.getByRole('button', { name: 'singleLineText' })).not.toBeVisible();
    await expect(await page.getByRole('button', { name: 'phone' })).toBeVisible();
    await expect(await page.getByRole('button', { name: 'percent' })).not.toBeVisible();
  });
});

test.describe('field acl check for edit', () => {
  test('view ', async ({ page, mockPage }) => {
    await mockPage().goto();
  });
});

test.describe('field acl check for add', () => {
  test('view ', async ({ page, mockPage }) => {
    await mockPage().goto();
  });
});

test.describe('field acl check for export', () => {
  test('view ', async ({ page, mockPage }) => {
    await mockPage().goto();
  });
});

test.describe('field acl check for import', () => {
  test('view ', async ({ page, mockPage }) => {
    await mockPage().goto();
  });
});
