import { expect, test } from '@nocobase/test/e2e';
import { oneTableBlock, newTableBlock } from './utils';

test.describe('view', () => {
  test('general permission', async ({ page, mockPage, mockRole, updateRole }) => {
    await mockPage(oneTableBlock).goto();
    //新建角色并切换到新角色
    const roleData = await mockRole({
      allowNewMenu: true,
    });
    await mockPage(oneTableBlock).goto();
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await expect(page.getByLabel('block-item-CardItem-general-table')).not.toBeVisible();
    await updateRole({
      name: roleData.name,
      strategy: {
        actions: ['view'],
      },
    });
    await page.reload();
    await expect(page.getByLabel('block-item-CardItem-general-table')).toBeVisible();
  });
  test('individual collection permission', async ({ page, mockPage, mockRole, mockRecord, updateRole }) => {
    await mockPage(oneTableBlock).goto();
    await mockRecord('general');
    //新建角色并切换到新角色
    const roleData = await mockRole({
      allowNewMenu: true,
      strategy: {
        actions: ['view'],
      },
      resources: [
        {
          usingActionsConfig: true,
          name: 'general',
        },
      ],
    });
    await mockPage(oneTableBlock).goto();
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await expect(page.getByLabel('block-item-CardItem-general-table')).not.toBeVisible();
    await updateRole({
      name: roleData.name,
      resources: [
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [{ name: 'view', fields: [] }],
        },
      ],
    });
    await page.reload();
    await expect(page.getByLabel('block-item-CardItem-general-table')).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-View')).toBeVisible();
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
  test('general permission', async ({ page, mockPage, mockRole, updateRole }) => {
    await mockPage(oneTableBlock).goto();
    //新建角色并切换到新角色
    const roleData = await mockRole({
      strategy: {
        actions: ['view'],
      },
      allowNewMenu: true,
    });
    await mockPage(oneTableBlock).goto();
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await expect(page.getByLabel('block-item-CardItem-general-table')).toBeVisible();
    await expect(page.getByLabel('action-Action-Add new-create-general-table')).not.toBeVisible();
    await updateRole({
      name: roleData.name,
      strategy: {
        actions: ['view', 'create'],
      },
    });
    await page.reload();
    await expect(page.getByLabel('action-Action-Add new-create-general-table')).toBeVisible();
  });
  test('individual collection permission', async ({ page, mockPage, mockRole, updateRole }) => {
    await mockPage(oneTableBlock).goto();
    //新建角色并切换到新角色
    const roleData = await mockRole({
      allowNewMenu: true,
      strategy: {
        actions: ['create'],
      },
      resources: [
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [
            {
              name: 'view',
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
    await expect(page.getByLabel('block-item-CardItem-general-table')).toBeVisible();
    await expect(page.getByLabel('action-Action-Add new-create-general-table')).not.toBeVisible();
    await updateRole({
      name: roleData.name,
      resources: [
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [
            {
              name: 'view',
            },
            { name: 'create' },
          ],
        },
      ],
    });
    await page.reload();
    await expect(page.getByLabel('action-Action-Add new-create-general-table')).toBeVisible();
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
    await expect(page.getByLabel('action-Action-Add new-create-general-table')).toBeVisible();
    await page.getByLabel('action-Action-Add new-create-general-table').click();
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.singleLineText')).toBeVisible();
  });
});

test.describe('update', () => {
  test('general permission', async ({ page, mockPage, mockRole, mockRecord, updateRole }) => {
    await mockPage(oneTableBlock).goto();
    await mockRecord('general');
    //新建角色并切换到新角色
    const roleData = await mockRole({
      strategy: {
        actions: ['view'],
      },
      allowNewMenu: true,
    });
    await mockPage(oneTableBlock).goto();
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await expect(page.getByLabel('action-Action.Link-Edit')).not.toBeVisible();
    await updateRole({
      name: roleData.name,
      strategy: {
        actions: ['view', 'update'],
      },
    });
    await page.reload();
    await expect(page.getByLabel('action-Action.Link-Edit')).toBeVisible();
  });
  test('individual collection permission', async ({ page, mockPage, mockRole, mockRecord, updateRole }) => {
    await mockPage(oneTableBlock).goto();
    await mockRecord('general');
    //新建角色并切换到新角色
    const roleData = await mockRole({
      allowNewMenu: true,
      strategy: {
        actions: ['update'],
      },
      resources: [
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [{ name: 'view' }],
        },
      ],
    });
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await mockPage(oneTableBlock).goto();
    await expect(page.getByLabel('block-item-CardItem-general-table')).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Edit')).not.toBeVisible();
    await updateRole({
      name: roleData.name,
      resources: [
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [
            {
              name: 'view',
            },
            { name: 'update' },
          ],
        },
      ],
    });
    await page.reload();
    await expect(page.getByLabel('action-Action.Link-Edit')).toBeVisible();
  });
  test('individual collection permission support new data block', async ({
    page,
    mockPage,
    mockRole,
    mockRecord,
    updateRole,
  }) => {
    await mockPage(newTableBlock).goto();
    await mockRecord('general');
    //新建角色并切换到新角色
    const roleData = await mockRole({
      allowNewMenu: true,
      strategy: {
        actions: ['update'],
      },
      resources: [
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [{ name: 'view' }],
        },
      ],
    });
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await mockPage(newTableBlock).goto();
    await expect(page.getByLabel('block-item-CardItem-general-table')).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Edit')).not.toBeVisible();
    await updateRole({
      name: roleData.name,
      resources: [
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [
            {
              name: 'view',
            },
            { name: 'update' },
          ],
        },
      ],
    });
    await page.reload();
    await expect(page.getByLabel('action-Action.Link-Edit')).toBeVisible();
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
    await expect(page.getByLabel('action-Action.Link-Edit')).toBeVisible();
    await page.getByLabel('action-Action.Link-Edit').click();
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.singleLineText')).toBeVisible();
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.phone')).toBeVisible();
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.email')).toBeVisible();
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.number')).not.toBeVisible();
  });
});

test.describe('destroy', () => {
  test('general permission', async ({ page, mockPage, mockRole, updateRole }) => {
    await mockPage(oneTableBlock).goto();
    //新建角色并切换到新角色
    const roleData = await mockRole({
      strategy: {
        actions: ['view'],
      },
      allowNewMenu: true,
    });
    await mockPage(oneTableBlock).goto();
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await expect(page.getByLabel('action-Action-Delete-destroy-general-table')).not.toBeVisible();
    await updateRole({
      name: roleData.name,
      strategy: {
        actions: ['view', 'destroy'],
      },
    });
    await page.reload();
    await expect(page.getByLabel('action-Action-Delete-destroy-general-table')).toBeVisible();
  });
  test('individual collection permission', async ({ page, mockPage, mockRole, mockRecord, updateRole }) => {
    await mockPage().goto();
    //新建角色并切换到新角色
    const roleData = await mockRole({
      allowNewMenu: true,
      strategy: {
        actions: ['destroy'],
      },
      resources: [
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [{ name: 'view' }],
        },
      ],
    });
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await mockPage(oneTableBlock).goto();
    await mockRecord('general');
    await expect(page.getByLabel('block-item-CardItem-general-table')).toBeVisible();
    await expect(page.getByLabel('action-Action-Delete-destroy-general-table')).not.toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Delete')).not.toBeVisible();

    await updateRole({
      name: roleData.name,
      resources: [
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [
            {
              name: 'view',
            },
            { name: 'destroy' },
          ],
        },
      ],
    });
    await page.reload();
    await expect(page.getByLabel('action-Action-Delete-destroy-general-table')).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Delete')).toBeVisible();
  });
  test('individual collection permission support new data block', async ({
    page,
    mockPage,
    mockRole,
    mockRecord,
    updateRole,
  }) => {
    await mockPage().goto();
    //新建角色并切换到新角色
    const roleData = await mockRole({
      allowNewMenu: true,
      strategy: {
        actions: ['destroy'],
      },
      resources: [
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [{ name: 'view' }],
        },
      ],
    });
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await mockPage(newTableBlock).goto();
    await mockRecord('general');
    await expect(page.getByLabel('block-item-CardItem-general-table')).toBeVisible();
    await expect(page.getByLabel('action-Action-Delete-destroy-general-table')).not.toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Delete-')).not.toBeVisible();
    await updateRole({
      name: roleData.name,
      resources: [
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [
            {
              name: 'view',
            },
            { name: 'destroy' },
          ],
        },
      ],
    });
    await page.reload();
    await expect(page.getByLabel('action-Action-Delete-destroy-general-table')).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Delete-')).toBeVisible();
  });
});

test.describe('export', () => {
  test('general permission', async ({ page, mockPage, mockRole, updateRole }) => {
    await mockPage(oneTableBlock).goto();
    //新建角色并切换到新角色
    const roleData = await mockRole({
      strategy: {
        actions: ['view'],
      },
      allowNewMenu: true,
    });
    await mockPage(oneTableBlock).goto();
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await expect(page.getByLabel('action-Action-Export')).not.toBeVisible();
    await updateRole({
      name: roleData.name,
      strategy: {
        actions: ['view', 'export'],
      },
    });
    await page.reload();
    await expect(page.getByLabel('action-Action-Export')).toBeVisible();
  });
  test('individual collection permission', async ({ page, mockPage, mockRole }) => {
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
              name: 'export',
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
    await expect(page.getByLabel('action-Action-Export')).toBeVisible();
  });
});

test.describe('import', () => {
  test('general permission', async ({ page, mockPage, mockRole, updateRole }) => {
    await mockPage().goto();
    //新建角色并切换到新角色
    const roleData = await mockRole({
      strategy: {
        actions: ['view'],
      },
      allowNewMenu: true,
    });
    await mockPage(oneTableBlock).goto();
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await expect(page.getByLabel('action-Action-Import')).not.toBeVisible();
    await updateRole({
      name: roleData.name,
      strategy: {
        actions: ['view', 'importXlsx'],
      },
    });
    await page.reload();
    await expect(page.getByLabel('action-Action-Import')).toBeVisible();
  });
  test('individual collection permission', async ({ page, mockPage, mockRole }) => {
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
              name: 'importXlsx',
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
    await expect(page.getByLabel('action-Action-Import')).toBeVisible();
  });
});
