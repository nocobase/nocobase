import { expect, test } from '@nocobase/test/client';
import { oneEmptyTableBlockWithActions } from './utils';

test.afterEach(async ({ page }) => {
  await page.evaluate(() => {
    window.localStorage.setItem('NOCOBASE_ROLE', 'root');
  });
});
test('allows to configure interface', async ({ page, mockPage, mockRole }) => {
  await mockPage().goto();
  //新建角色并切换到新角色
  const roleData = await mockRole({
    snippets: ['ui.*'],
    default: true,
    allowNewMenu: true,
  });
  await page.evaluate((roleData) => {
    window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
  }, roleData);
  await page.reload();
  await page.getByTestId('user-center-button').hover();
  await expect(await page.getByTestId('ui-editor-button')).toBeVisible();
});

test('allows to install ,install,disabled plugins ', async ({ page, mockPage, mockRole }) => {
  await mockPage().goto();
  //新建角色并切换到新角色
  const roleData = await mockRole({
    snippets: ['pm'],
    default: true,
    allowNewMenu: true,
  });
  await page.evaluate((roleData) => {
    window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
  }, roleData);
  await page.reload();
  await page.getByTestId('user-center-button').hover();
  await expect(await page.getByTestId('plugin-manager-button')).toBeVisible();
});

test('allows to confgiure plugins ', async ({ page, mockPage, mockRole }) => {
  await mockPage().goto();
  //新建角色并切换到新角色
  const roleData = await mockRole({
    snippets: ['pm.*'],
    strategy: {
      actions: ['update', 'destroy', 'view'],
    },
    default: true,
    allowNewMenu: true,
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
    default: true,
    allowNewMenu: true,
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
    snippets: ['ui.*'],
    default: true,
    allowNewMenu: true,
  });
  await page.evaluate((roleData) => {
    window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
  }, roleData);
  await page.reload();
  await mockPage({ ...oneEmptyTableBlockWithActions, name: 'new page' }).goto();
  await expect(page.getByLabel('new page')).toBeVisible();
});
