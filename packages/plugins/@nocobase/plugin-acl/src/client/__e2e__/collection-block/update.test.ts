import { expect, test, oneEmptyTableBlockWithActions as oneEmptyTable } from '@nocobase/test/client';
import { oneEmptyTableBlockWithActions } from '../utils';

test.afterEach(async ({ page }) => {
  await page.evaluate(() => {
    window.localStorage.setItem('NOCOBASE_ROLE', 'root');
  });
});

test('general permission', async ({ page, mockPage, mockRole }) => {
  await mockPage(oneEmptyTableBlockWithActions).goto();
  //新建角色并切换到新角色
  const roleData = await mockRole({
    snippets: ['pm', 'pm.*', 'ui.*'],
    strategy: {
      actions: ['create', 'destroy', 'view'],
    },
    default: true,
    allowNewMenu: true,
  });
  await mockPage(oneEmptyTableBlockWithActions).goto();
  await page.evaluate((roleData) => {
    window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
  }, roleData);
  await page.reload();
  await page.getByTestId('user-center-button').hover();
  await expect(await page.getByLabel('action-Action.Link-Edit-update-users-table-0')).not.toBeVisible();
});
test('individual collection permission', async ({ page, mockPage, mockRole, mockRecord }) => {
  await mockPage().goto();
  //新建角色并切换到新角色
  const roleData = await mockRole({
    default: true,
    allowNewMenu: true,
    resources: [
      {
        usingActionsConfig: true,
        name: 'users',
        actions: [{ name: 'view' }, { name: 'update' }],
      },
    ],
  });
  await page.evaluate((roleData) => {
    window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
  }, roleData);
  await page.reload();
  await mockPage(oneEmptyTableBlockWithActions).goto();
  await page.getByTestId('user-center-button').hover();
  await expect(await page.getByLabel('action-Action.Link-Edit-update-users-table-0')).toBeVisible();
});
