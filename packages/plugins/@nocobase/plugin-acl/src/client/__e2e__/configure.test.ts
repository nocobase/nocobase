import { expect, test } from '@nocobase/test/e2e';
import { oneTableBlock } from './utils';

test('allows to configure interface', async ({ page, mockPage, mockRole, updateRole }) => {
  await mockPage().goto();
  //新建角色并切换到新角色
  const roleData = await mockRole({
    snippets: ['ui.*'],
  });
  await page.evaluate((roleData) => {
    window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
  }, roleData);
  await page.reload();
  await expect(page.getByTestId('ui-editor-button')).toBeVisible();
  await expect(page.getByTestId('schema-initializer-Menu-header')).toBeVisible();
  //更新权限,无ui配置权限
  await updateRole({
    name: roleData.name,
    snippets: ['!ui.*'],
  });
  await page.reload();
  await expect(page.getByTestId('ui-editor-button')).not.toBeVisible();
  await expect(page.getByTestId('schema-initializer-Menu-header')).not.toBeVisible();
});

test('allows to install ,install,disabled plugins ', async ({ page, mockPage, mockRole, updateRole }) => {
  await mockPage().goto();
  //新建角色并切换到新角色
  const roleData = await mockRole({
    snippets: ['pm'],
  });
  await page.evaluate((roleData) => {
    window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
  }, roleData);
  await page.reload();
  await expect(page.getByTestId('plugin-manager-button')).toBeVisible();
  await page.getByTestId('plugin-manager-button').click();
  expect(page.url()).toContain('/pm/list/local');
  await expect(page.locator('.ant-page-header-heading').getByTitle('Plugin manager', { exact: true })).toBeVisible();
  //无插件管理权限时访问直接路由访问时404
  await updateRole({
    name: roleData.name,
    snippets: ['!pm'],
  });
  await page.reload();
  await expect(page.getByTestId('plugin-manager-button')).not.toBeVisible();
  await page.goto('/pm/list/local');
  await expect(page.getByText('Sorry, the page you visited')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Back Home' })).toBeVisible();
});

test('allows to confgiure plugins ', async ({ page, mockPage, mockRole, updateRole }) => {
  await mockPage().goto();
  //新建角色并切换到新角色
  const roleData = await mockRole({
    snippets: ['pm.*'],
    strategy: {
      actions: ['view', 'update'],
    },
  });
  await page.evaluate((roleData) => {
    window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
  }, roleData);
  await page.reload();
  await page.getByTestId('plugin-settings-button').click();
  await page.getByRole('link', { name: 'Users & Permissions' }).click();
  await page.getByText('Roles & Permissions').click();
  await page
    .getByRole('menuitem', { name: `${roleData.name}` })
    .locator('span')
    .nth(1)
    .click();
  await expect(page.getByText('Plugin settings')).toBeVisible();
  await updateRole({
    name: roleData.name,
    snippets: ['!pm.*'],
  });
  await page.reload();
  await expect(page.getByTestId('plugin-settings-button')).not.toBeVisible();
});

test('allows to clear cache,reboot application ', async ({ page, mockPage, mockRole, updateRole }) => {
  await mockPage().goto();
  //新建角色并切换到新角色
  const roleData = await mockRole({
    snippets: ['app'],
  });
  await page.evaluate((roleData) => {
    window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
  }, roleData);
  await page.reload();
  await page.getByTestId('user-center-button').hover();
  await expect(page.getByRole('menuitem', { name: 'Clear cache' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Restart application' })).toBeVisible();
  await updateRole({
    name: roleData.name,
    snippets: ['!app'],
  });
  await page.reload();
  await page.getByTestId('user-center-button').hover();
  await expect(page.getByRole('menuitem', { name: 'Clear cache' })).not.toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Restart application' })).not.toBeVisible();
});

test('new menu items allow to be asscessed by default ', async ({ page, mockPage, mockRole, updateRole }) => {
  await mockPage().goto();
  //新建角色并切换到新角色
  const roleData = await mockRole({
    snippets: ['ui.*'],
  });
  await page.evaluate((roleData) => {
    window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
  }, roleData);
  await page.reload();
  await mockPage({ ...oneTableBlock, name: 'new page' }).goto();
  await expect(page.getByLabel('new page')).not.toBeVisible();
  await updateRole({
    name: roleData.name,
    allowNewMenu: true,
  });
  await mockPage({ ...oneTableBlock, name: 'new page' }).goto();
  await expect(page.getByLabel('new page')).toBeVisible();
});

test('plugin settings permissions', async ({ page, mockPage, mockRole, updateRole }) => {
  await mockPage().goto();
  //新建角色并切换到新角色
  const roleData = await mockRole({
    snippets: ['pm', 'pm.*', '!pm.auth.authenticators', '!pm.collection-manager', '!pm.collection-manager.collections'],
  });
  await page.evaluate((roleData) => {
    window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
  }, roleData);
  await page.reload();
  await page.getByTestId('plugin-settings-button').hover();
  await expect(page.getByRole('link', { name: 'Users & Permissions' })).toBeVisible();
  await expect(page.getByLabel('auth')).not.toBeVisible();
  await expect(page.getByLabel('collection-manager')).not.toBeVisible();
  await page.getByRole('link', { name: 'Users & Permissions' }).click();
  await expect(page.getByRole('menuitem', { name: 'login Authentication' })).not.toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'database Collection manager' })).not.toBeVisible();
  await updateRole({
    name: roleData.name,
    snippets: ['pm', 'pm.*', 'pm.auth.authenticators'],
  });
  await page.reload();
  await page.getByTestId('plugin-settings-button').hover();
  await expect(page.getByRole('link', { name: 'Users & Permissions' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Authentication' })).toBeVisible();
  await page.getByRole('link', { name: 'Users & Permissions' }).click();
  await expect(page.getByRole('menuitem', { name: 'login Authentication' })).toBeVisible();
});
