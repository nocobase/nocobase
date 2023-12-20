import { expect, test } from '@nocobase/test/client';
import { oneTableBlock } from './utils';

test.describe('view', () => {
  test('general permission', async ({ page, mockPage, mockRole }) => {
    await mockPage(oneTableBlock).goto();
    //新建角色并切换到新角色
    const roleData = await mockRole({
      allowNewMenu: true,
      strategy: {
        actions: ['view'],
      },
    });
    await mockPage(oneTableBlock).goto();
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await expect(page.getByLabel('block-item-CardItem-general-table')).toBeVisible();
  });
  test('individual collection permission', async ({ page, mockPage, mockRole }) => {
    await mockPage(oneTableBlock).goto();
    //新建角色并切换到新角色
    const roleData = await mockRole({
      allowNewMenu: true,
      resources: [
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [{ name: 'view', fields: [] }],
        },
      ],
    });
    await mockPage(oneTableBlock).goto();
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await expect(page.getByLabel('block-item-CardItem-general-table')).toBeVisible();
    await expect(page.getByRole('button', { name: 'singleLineText' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'phone' })).not.toBeVisible();
  });
  test('individual collection permission with fields', async ({ page, mockPage, mockRole }) => {
    await mockPage(oneTableBlock).goto();
    //新建角色并切换到新角色
    const roleData = await mockRole({
      allowNewMenu: true,
      resources: [
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [{ name: 'view', fields: ['singleLineText'] }],
        },
      ],
    });
    await mockPage(oneTableBlock).goto();
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    //特定字段有权限
    await expect(page.getByLabel('block-item-CardItem-general-table')).toBeVisible();
    await expect(page.getByRole('button', { name: 'singleLineText' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'phone' })).not.toBeVisible();
  });
});

test.describe('create', () => {
  test('general permission', async ({ page, mockPage, mockRole }) => {
    await mockPage(oneTableBlock).goto();
    //新建角色并切换到新角色
    const roleData = await mockRole({
      strategy: {
        actions: ['view', 'create'],
      },
      allowNewMenu: true,
    });
    await mockPage(oneTableBlock).goto();
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await expect(await page.getByLabel('action-Action-Add new-create-general-table')).toBeVisible();
  });
  test('individual collection permission', async ({ page, mockPage, mockRole }) => {
    await mockPage(oneTableBlock).goto();
    //新建角色并切换到新角色
    const roleData = await mockRole({
      allowNewMenu: true,
      resources: [
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [
            {
              name: 'view',
            },
            {
              name: 'create',
            },
          ],
        },
      ],
    });
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await mockPage(oneTableBlock).goto();
    await expect(await page.getByLabel('action-Action-Add new-create-general-table')).toBeVisible();
  });
  test('individual collection permission width fields', async ({ page, mockPage, mockRole }) => {
    await mockPage(oneTableBlock).goto();
    //新建角色并切换到新角色
    const roleData = await mockRole({
      allowNewMenu: true,
      resources: [
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [
            {
              name: 'view',
              fields: ['id', 'singleLineText'],
              scope: null,
            },
            {
              name: 'create',
              fields: ['singleLineText'],
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
    await mockPage(oneTableBlock).goto();
    await expect(await page.getByLabel('action-Action-Add new-create-general-table')).toBeVisible();
    await await page.getByLabel('action-Action-Add new-create-general-table').click();
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.singleLineText')).toBeVisible();
  });
});

test.describe('update', () => {
  test('general permission', async ({ page, mockPage, mockRole, mockRecord }) => {
    await mockPage(oneTableBlock).goto();
    await mockRecord('general');
    //新建角色并切换到新角色
    const roleData = await mockRole({
      strategy: {
        actions: ['update', 'view'],
      },
      allowNewMenu: true,
    });
    await mockPage(oneTableBlock).goto();
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await expect(await page.getByLabel('action-Action.Link-Edit')).toBeVisible();
  });
  test('individual collection permission', async ({ page, mockPage, mockRole, mockRecord }) => {
    await mockPage(oneTableBlock).goto();
    await mockRecord('general');
    //新建角色并切换到新角色
    const roleData = await mockRole({
      allowNewMenu: true,
      resources: [
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [{ name: 'view' }, { name: 'update' }],
        },
      ],
    });
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await mockPage(oneTableBlock).goto();
    await expect(await page.getByLabel('action-Action.Link-Edit')).toBeVisible();
  });
  test('individual collection permission with fields', async ({ page, mockPage, mockRole, mockRecord }) => {
    await mockPage(oneTableBlock).goto();
    await mockRecord('general');
    //新建角色并切换到新角色
    const roleData = await mockRole({
      allowNewMenu: true,
      resources: [
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [{ name: 'view' }, { name: 'update', fields: ['singleLineText', 'phone', 'email'] }],
        },
      ],
    });
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await mockPage(oneTableBlock).goto();
    await expect(await page.getByLabel('action-Action.Link-Edit')).toBeVisible();
    await page.getByLabel('action-Action.Link-Edit').click();
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.singleLineText')).toBeVisible();
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.phone')).toBeVisible();
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.email')).toBeVisible();
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.number')).not.toBeVisible();
  });
});

test.describe('destroy', () => {
  test('general permission', async ({ page, mockPage, mockRole }) => {
    await mockPage(oneTableBlock).goto();
    //新建角色并切换到新角色
    const roleData = await mockRole({
      strategy: {
        actions: ['destroy', 'view'],
      },
      allowNewMenu: true,
    });
    await mockPage(oneTableBlock).goto();
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await expect(await page.getByLabel('action-Action-Delete-destroy-general-table')).toBeVisible();
  });
  test('individual collection permission', async ({ page, mockPage, mockRole, mockRecord }) => {
    await mockPage().goto();
    //新建角色并切换到新角色
    const roleData = await mockRole({
      allowNewMenu: true,
      resources: [
        {
          usingActionsConfig: true,
          name: 'general',
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
    await mockPage(oneTableBlock).goto();
    await expect(await page.getByLabel('action-Action-Delete-destroy-general-table')).toBeVisible();
  });
});
