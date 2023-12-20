import { expect, test } from '@nocobase/test/client';
import { oneTableBlock } from './utils';

test('allows to configure interface', async ({ page, mockPage, mockRole }) => {
  await mockPage().goto();
  //新建角色并切换到新角色
  const roleData = await mockRole({
    snippets: ['ui.*'],
  });
  await page.evaluate((roleData) => {
    window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
  }, roleData);
  await page.reload();
  await page.getByTestId('user-center-button').hover();
  await expect(await page.getByTestId('ui-editor-button')).toBeVisible();
  await expect(await page.getByTestId('schema-initializer-Menu-header')).toBeVisible();
});

test('allows to install ,install,disabled plugins ', async ({ page, mockPage, mockRole }) => {
  await mockPage().goto();
  //新建角色并切换到新角色
  const roleData = await mockRole({
    snippets: ['pm'],
  });
  await page.evaluate((roleData) => {
    window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
  }, roleData);
  await page.reload();
  await page.getByTestId('user-center-button').hover();
  await expect(await page.getByTestId('plugin-manager-button')).toBeVisible();
  await page.getByTestId('plugin-manager-button').click();
  await expect(await page.url()).toContain('/pm/list/local');
  await expect(
    await page.locator('.ant-page-header-heading').getByTitle('Plugin manager', { exact: true }),
  ).toBeVisible();
});

test('allows to confgiure plugins ', async ({ page, mockPage, mockRole }) => {
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
  await page.getByTestId('user-center-button').hover();
  await page.getByTestId('plugin-settings-button').click();
  await page.getByLabel('acl').click();
  await page.getByLabel(`action-Action.Link-Configure-roles-${roleData.name}`).click();
  await expect(page.getByRole('tab').getByText('Plugin settings permissions')).toBeVisible();
});

test('allows to clear cache,reboot application ', async ({ page, mockPage, mockRole }) => {
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
  await expect(await page.getByRole('menuitem', { name: 'Clear cache' })).toBeVisible();
  await expect(await page.getByRole('menuitem', { name: 'Restart application' })).toBeVisible();
});

test('new menu items allow to be asscessed by default ', async ({ page, mockPage, mockRole }) => {
  await mockPage().goto();
  //新建角色并切换到新角色
  const roleData = await mockRole({
    allowNewMenu: true,
    snippets: ['ui.*'],
  });
  await page.evaluate((roleData) => {
    window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
  }, roleData);
  await page.reload();
  await mockPage({ ...oneTableBlock, name: 'new page' }).goto();
  await expect(page.getByLabel('new page')).toBeVisible();
});

test('plugin settings permissions', async ({ page, mockPage, mockRole }) => {
  await mockPage().goto();
  //新建角色并切换到新角色
  const roleData = await mockRole({
    default: true,
    snippets: ['pm', 'pm.*', '!pm.auth.authenticators', '!pm.collection-manager', '!pm.collection-manager.collections'],
  });
  await page.evaluate((roleData) => {
    window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
  }, roleData);
  await page.reload();
  await page.getByTestId('plugin-settings-button').hover();
  await expect(await page.getByLabel('acl')).toBeVisible();
  await expect(await page.getByLabel('auth')).not.toBeVisible();
  await expect(await page.getByLabel('collection-manager')).not.toBeVisible();
  await page.getByLabel('acl').click();
  await expect(await page.getByRole('menuitem', { name: 'login Authentication' })).not.toBeVisible();
  await expect(await page.getByRole('menuitem', { name: 'database Collection manager' })).not.toBeVisible();
});
