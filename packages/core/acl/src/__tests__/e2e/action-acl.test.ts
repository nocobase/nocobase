import { expect, test, oneEmptyTableBlockWithActions } from '@nocobase/test/client';
import { oneEmptyTableBlockWithExportAndImportAction } from './utils';

test.describe('action acl check for view', () => {
  test('global action permission for view ', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTableBlockWithActions).goto();
    await page.getByTestId('user-center-button').hover();
    await page.getByRole('button', { name: 'switch-role' }).click();
    await page.getByRole('option', { name: 'Admin' }).click();
    await expect(page.getByLabel('block-item-CardItem-general-table')).toBeVisible();

    await page.getByTestId('plugin-settings-button').hover();
    await page.getByLabel('acl').click();
    await page.getByLabel('action-Action.Link-Configure-roles-admin').click();

    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('api/roles:update')),
      page.getByLabel('view_checkbox').uncheck(),
    ]);
    const postData = request.postDataJSON();
    expect(postData.strategy.actions).not.toContainEqual('view');
    await page.goBack();
    await page.reload();
    await expect(page.getByLabel('block-item-CardItem-general-table')).not.toBeVisible();
    await page.getByTestId('user-center-button').hover();
    await page.getByRole('button', { name: 'switch-role' }).click();
    await page.getByRole('option', { name: 'Root' }).click();
    await page.getByTestId('plugin-settings-button').hover();
    await page.getByLabel('acl').click();
    await page.getByLabel('action-Action.Link-Configure-roles-admin').click();
    await page.getByLabel('view_checkbox').check();
  });
});

test.describe('action acl check for edit', () => {
  test('global action permission for edit', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();
    await expect(await page.getByLabel('action-Action.Link-Edit-update-general-table-0')).toBeVisible();
    await page.getByTestId('plugin-settings-button').hover();
    await page.getByLabel('acl').click();
    await page.getByLabel('action-Action.Link-Configure-roles-admin').click();
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('api/roles:update')),
      page.getByLabel('update_checkbox').uncheck(),
    ]);
    const postData = request.postDataJSON();
    expect(postData.strategy.actions).not.toContainEqual('update');
    await page.getByLabel('drawer-Action.Drawer-roles-Configure permissions-mask').click();
    await page.goBack();
    await page.getByTestId('user-center-button').hover();
    await page.getByRole('button', { name: 'switch-role' }).click();
    await page.getByRole('option', { name: 'Admin' }).click();
    await expect(await page.getByLabel('action-Action.Link-Edit-update-general-table-0')).not.toBeVisible();
    await page.getByTestId('user-center-button').hover();
    await page.getByRole('button', { name: 'switch-role' }).click();
    await page.getByRole('option', { name: 'Root' }).click();
    await page.getByTestId('plugin-settings-button').hover();
    await page.getByLabel('acl').click();
    await page.getByLabel('action-Action.Link-Configure-roles-admin').click();
    await page.getByLabel('update_checkbox').check();
  });
});

test.describe('action acl check for add', () => {
  test('global action permission for add', async ({ page, mockPage }) => {
    const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
    await nocoPage.goto();
    await expect(await page.getByLabel('action-Action-Add new-create-general-table')).toBeVisible();
    await page.getByTestId('plugin-settings-button').hover();
    await page.getByLabel('acl').click();
    await page.getByLabel('action-Action.Link-Configure-roles-admin').click();
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('api/roles:update')),
      page.getByLabel('create_checkbox').uncheck(),
    ]);
    const postData = request.postDataJSON();
    expect(postData.strategy.actions).not.toContainEqual('create');
    await page.getByLabel('drawer-Action.Drawer-roles-Configure permissions-mask').click();
    await page.goBack();
    await page.getByTestId('user-center-button').hover();
    await page.getByRole('button', { name: 'switch-role' }).click();
    await page.getByRole('option', { name: 'Admin' }).click();
    await expect(await page.getByLabel('action-Action-Add new-create-general-table')).not.toBeVisible();
    await page.getByTestId('user-center-button').hover();
    await page.getByRole('button', { name: 'switch-role' }).click();
    await page.getByRole('option', { name: 'Root' }).click();
    await page.getByTestId('plugin-settings-button').hover();
    await page.getByLabel('acl').click();
    await page.getByLabel('action-Action.Link-Configure-roles-admin').click();
    await page.getByLabel('create_checkbox').check();
  });
});

test.describe('action acl check for delete', () => {
  test('global action permission for delete', async ({ page, mockPage }) => {
    const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
    await nocoPage.goto();
    await expect(await page.getByLabel('action-Action-Delete-destroy-general-table')).toBeVisible();
    await page.getByTestId('plugin-settings-button').hover();
    await page.getByLabel('acl').click();
    await page.getByLabel('action-Action.Link-Configure-roles-admin').click();
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('api/roles:update')),
      page.getByLabel('destroy_checkbox').uncheck(),
    ]);
    const postData = request.postDataJSON();
    expect(postData.strategy.actions).not.toContainEqual('destroy');
    await page.getByLabel('drawer-Action.Drawer-roles-Configure permissions-mask').click();
    await page.goBack();
    await page.getByTestId('user-center-button').hover();
    await page.getByRole('button', { name: 'switch-role' }).click();
    await page.getByRole('option', { name: 'Admin' }).click();
    await expect(await page.getByLabel('action-Action-Delete-destroy-general-table')).not.toBeVisible();
    await page.getByTestId('user-center-button').hover();
    await page.getByRole('button', { name: 'switch-role' }).click();
    await page.getByRole('option', { name: 'Root' }).click();
    await page.getByTestId('plugin-settings-button').hover();
    await page.getByLabel('acl').click();
    await page.getByLabel('action-Action.Link-Configure-roles-admin').click();
    await page.getByLabel('destroy_checkbox').check();
  });
});

test.describe('action acl check for export', () => {
  test('global action permission for export', async ({ page, mockPage }) => {
    const nocoPage = await mockPage(oneEmptyTableBlockWithExportAndImportAction).waitForInit();
    await nocoPage.goto();
    await page.getByTestId('user-center-button').hover();
    await page.getByRole('button', { name: 'switch-role' }).click();
    await page.getByRole('option', { name: 'Admin' }).click();
    //默认admin 不开启export权限
    await expect(await page.getByLabel('action-Action-Export-export-general-table')).not.toBeVisible();
    await page.getByTestId('plugin-settings-button').hover();
    await page.getByLabel('acl').click();
    await page.getByLabel('action-Action.Link-Configure-roles-admin').click();
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('api/roles:update')),
      page.getByLabel('export_checkbox').check(),
    ]);
    const postData = request.postDataJSON();
    expect(postData.strategy.actions).toContainEqual('export');
    await page.getByLabel('drawer-Action.Drawer-roles-Configure permissions-mask').click();
    await page.goBack();
    await page.reload();
    await expect(await page.getByLabel('action-Action-Export-export-general-table')).toBeVisible();
    await page.getByTestId('user-center-button').hover();
    await page.getByRole('button', { name: 'switch-role' }).click();
    await page.getByRole('option', { name: 'Root' }).click();
    await page.getByTestId('plugin-settings-button').hover();
    await page.getByLabel('acl').click();
    await page.getByLabel('action-Action.Link-Configure-roles-admin').click();
    await page.getByLabel('export_checkbox').uncheck();
  });
});

test.describe('action acl check for import', () => {
  test('global action permission for import', async ({ page, mockPage }) => {
    const nocoPage = await mockPage(oneEmptyTableBlockWithExportAndImportAction).waitForInit();
    await nocoPage.goto();
    await page.getByTestId('user-center-button').hover();
    await page.getByRole('button', { name: 'switch-role' }).click();
    await page.getByRole('option', { name: 'Admin' }).click();
    //默认admin角色不开启import权限
    await expect(await page.getByLabel('action-Action-Import-importXlsx-general-table')).not.toBeVisible();
    await page.getByTestId('plugin-settings-button').hover();
    await page.getByLabel('acl').click();
    await page.getByLabel('action-Action.Link-Configure-roles-admin').click();
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('api/roles:update')),
      page.getByLabel('importXlsx_checkbox').check(),
    ]);
    const postData = request.postDataJSON();
    expect(postData.strategy.actions).toContainEqual('importXlsx');
    await page.getByLabel('drawer-Action.Drawer-roles-Configure permissions-mask').click();
    await page.goBack();
    await page.reload();
    await expect(await page.getByLabel('action-Action-Import-importXlsx-general-table')).toBeVisible();
    await page.getByTestId('user-center-button').hover();
    await page.getByRole('button', { name: 'switch-role' }).click();
    await page.getByRole('option', { name: 'Root' }).click();
    await page.getByTestId('plugin-settings-button').hover();
    await page.getByLabel('acl').click();
    await page.getByLabel('action-Action.Link-Configure-roles-admin').click();
    await page.getByLabel('importXlsx_checkbox').uncheck();
  });
});
