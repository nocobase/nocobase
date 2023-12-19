import { expect, test } from '@nocobase/test/client';
import { oneEmptyTableBlockWithActions } from './utils';

test.afterEach(async ({ page }) => {
  await page.evaluate(() => {
    window.localStorage.setItem('NOCOBASE_ROLE', 'root');
  });
});
test.describe('view', () => {
  test('general permission', async ({ page, mockPage, mockRole }) => {
    await mockPage(oneEmptyTableBlockWithActions).goto();
    //新建角色并切换到新角色
    const roleData = await mockRole({
      snippets: ['pm', 'pm.*', 'ui.*'],
      default: true,
      allowNewMenu: true,
    });
    await mockPage(oneEmptyTableBlockWithActions).goto();
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await page.getByTestId('user-center-button').hover();
    await expect(page.getByLabel('block-item-CardItem-users-table')).not.toBeVisible();
  });
  test('individual collection permission', async ({ page, mockPage, mockRole, mockRecord }) => {
    await mockPage(oneEmptyTableBlockWithActions).goto();
    //新建角色并切换到新角色
    const roleData = await mockRole({
      default: true,
      allowNewMenu: true,
      resources: [
        {
          usingActionsConfig: true,
          name: 'users',
          actions: [{ name: 'view', fields: [] }],
        },
      ],
    });
    await mockPage(oneEmptyTableBlockWithActions).goto();
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await page.getByTestId('user-center-button').hover();
    await expect(page.getByLabel('block-item-CardItem-users-table')).toBeVisible();
  });
});

test.describe('create', () => {
  test('general permission', async ({ page, mockPage, mockRole }) => {
    await mockPage(oneEmptyTableBlockWithActions).goto();
    //新建角色并切换到新角色
    const roleData = await mockRole({
      snippets: ['pm', 'pm.*', 'ui.*'],
      strategy: {
        actions: ['update', 'destroy', 'view'],
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
    await expect(await page.getByLabel('action-Action-Add new-create-users-table')).not.toBeVisible();
  });
  test('individual collection permission', async ({ page, mockPage, mockRole, mockRecord }) => {
    await mockPage(oneEmptyTableBlockWithActions).goto();
    //新建角色并切换到新角色
    const roleData = await mockRole({
      default: true,
      allowNewMenu: true,
      resources: [
        {
          usingActionsConfig: true,
          name: 'users',
          actions: [
            {
              name: 'view',
              fields: ['id'],
              scope: null,
            },
            {
              name: 'create',
              fields: ['id'],
              scope: null,
            },
          ],
        },
      ],
    });
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await mockPage(oneEmptyTableBlockWithActions).goto();
    await page.reload();
    await expect(await page.getByLabel('action-Action-Add new-create-users-table')).toBeVisible();
  });
});

test.describe('update', () => {
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
});

test.describe('destroy', () => {
  test('general permission', async ({ page, mockPage, mockRole }) => {
    await mockPage(oneEmptyTableBlockWithActions).goto();
    //新建角色并切换到新角色
    const roleData = await mockRole({
      snippets: ['pm', 'pm.*', 'ui.*'],
      strategy: {
        actions: ['create', 'update', 'view'],
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
    await expect(await page.getByLabel('action-Action-Delete-destroy-users-table')).not.toBeVisible();
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
          actions: [
            { name: 'view' },
            {
              name: 'destroy',
              fields: ['id'],
              scope: null,
            },
          ],
        },
      ],
    });
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await mockPage(oneEmptyTableBlockWithActions).goto();
    await page.reload();
    await expect(await page.getByLabel('action-Action-Delete-destroy-users-table')).not.toBeVisible();
  });
});
