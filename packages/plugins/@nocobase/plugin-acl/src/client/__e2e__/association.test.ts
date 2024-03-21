import { expect, test } from '@nocobase/test/e2e';
import { oneTableBlock } from './utils';

test.describe('view', () => {
  //关系字段有权限，关系目标表无权限
  test('association field accept, target collection denied', async ({ page, mockPage, mockRole, mockRecord }) => {
    await mockPage(oneTableBlock).goto();
    await mockRecord('general');
    //新建角色并切换到新角色
    const roleData = await mockRole({
      allowNewMenu: true,
      resources: [
        {
          usingActionsConfig: true,
          name: 'users',
        },
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [{ name: 'view', fields: ['oneToOneBelongsTo'] }],
        },
      ],
    });
    await mockPage(oneTableBlock).goto();
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await expect(page.getByLabel('block-item-CardItem-general-table')).toBeVisible();
    //关系字段可见
    await expect(page.getByRole('button', { name: 'oneToOneBelongsTo' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'phone' })).not.toBeVisible();
    await page.getByLabel('action-Action.Link-Association block-customize:popup-general-table').click();
    //关系区块不可见
    await expect(page.getByLabel('block-item-CardItem-users-form')).not.toBeVisible();
  });
  //关系字段有权限，关系目标表个别字段有权限
  test('association field accept,  target collection accept with fields', async ({
    page,
    mockPage,
    mockRole,
    mockRecord,
  }) => {
    await mockPage(oneTableBlock).goto();
    await mockRecord('general');
    //新建角色并切换到新角色
    const roleData = await mockRole({
      allowNewMenu: true,
      resources: [
        {
          usingActionsConfig: true,
          name: 'users',
          actions: [{ name: 'view', fields: ['email'] }],
        },
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [{ name: 'view', fields: ['oneToOneBelongsTo'] }],
        },
      ],
    });
    await mockPage(oneTableBlock).goto();
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await expect(page.getByLabel('block-item-CardItem-general-table')).toBeVisible();
    //关系字段可见
    await expect(page.getByRole('button', { name: 'oneToOneBelongsTo' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'phone' })).not.toBeVisible();
    await page.getByLabel('action-Action.Link-Association block-customize:popup-general-table').click();
    //关系区块可见,个别字段可见
    await expect(page.getByLabel('block-item-CardItem-users-form')).toBeVisible();
    await expect(page.getByLabel('block-item-CollectionField-users-form-users.nickname')).not.toBeVisible();
    await expect(page.getByLabel('block-item-CollectionField-users-form-users.email')).toBeVisible();
  });
});

test.describe('update', () => {
  //关系字段有权限，关系目标表无权限
  test('association field accept,target collection denied', async ({ page, mockPage, mockRole, mockRecord }) => {
    await mockPage(oneTableBlock).goto();
    await mockRecord('general');
    //新建角色并切换到新角色
    const roleData = await mockRole({
      allowNewMenu: true,
      resources: [
        {
          usingActionsConfig: true,
          name: 'users',
        },
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [
            { name: 'view', fields: ['oneToOneBelongsTo'] },
            { name: 'update', fields: ['oneToOneBelongsTo'] },
          ],
        },
      ],
    });
    await mockPage(oneTableBlock).goto();
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await expect(page.getByLabel('block-item-CardItem-general-table')).toBeVisible();
    await page.getByLabel('action-Action.Link-Association field-customize:popup-general-table').click();
    //关系字段组件可见，子表单/子表格中字段不可见
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.oneToOneBelongsTo')).toBeVisible();
    await expect(page.getByLabel('block-item-CollectionField-users-form-users.email-Email')).not.toBeVisible();
  });
  //关系字段有权限，关系目标表个别字段有权限
  test('association field accept, target collection accept with fields', async ({
    page,
    mockPage,
    mockRole,
    mockRecord,
  }) => {
    await mockPage(oneTableBlock).goto();
    await mockRecord('general');
    //新建角色并切换到新角色
    const roleData = await mockRole({
      allowNewMenu: true,
      resources: [
        {
          usingActionsConfig: true,
          name: 'users',
          actions: [{ name: 'view' }, { name: 'update', fields: ['email'] }],
        },
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [
            { name: 'view', fields: ['oneToOneBelongsTo'] },
            { name: 'update', fields: ['oneToOneBelongsTo'] },
          ],
        },
      ],
    });
    await mockPage(oneTableBlock).goto();
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await expect(page.getByLabel('block-item-CardItem-general-table')).toBeVisible();
    await page.getByLabel('action-Action.Link-Association field-customize:popup-general-table').click();
    //关系字段组件可见，子表单/子表格中个别字段可见
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.oneToOneBelongsTo')).toBeVisible();
    await expect(page.getByLabel('block-item-CollectionField-users-form-users.email')).toBeVisible();
    await expect(page.getByLabel('block-item-CollectionField-users-form-users.phone')).not.toBeVisible();
  });
});

test.describe('create', () => {
  //关系字段有权限，关系目标表无权限
  test('association field accept,target collection denied', async ({ page, mockPage, mockRole, mockRecord }) => {
    await mockPage(oneTableBlock).goto();
    await mockRecord('general');
    //新建角色并切换到新角色
    const roleData = await mockRole({
      default: true,
      allowNewMenu: true,
      resources: [
        {
          usingActionsConfig: true,
          name: 'users',
        },
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [
            { name: 'view', fields: ['oneToOneBelongsTo'] },
            { name: 'create', fields: ['oneToOneBelongsTo'] },
          ],
        },
      ],
    });
    await mockPage(oneTableBlock).goto();
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await expect(page.getByLabel('block-item-CardItem-general-table')).toBeVisible();
    await page.getByLabel('action-Action-Add new-create').click();
    //关系字段组件可见，子表单/子表格中字段不可见
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.oneToOneBelongsTo')).toBeVisible();
    await expect(page.getByLabel('block-item-CollectionField-users-form-users.email')).not.toBeVisible();
    await expect(page.getByLabel('block-item-CollectionField-users-form-users.phone')).not.toBeVisible();
    await expect(page.getByLabel('block-item-CollectionField-users-form-users.username')).not.toBeVisible();
  });
  //关系字段有权限，关系目标表个别字段有权限
  test('association field accept, target collection accept with fields', async ({
    page,
    mockPage,
    mockRole,
    mockRecord,
  }) => {
    await mockPage(oneTableBlock).goto();
    await mockRecord('general');
    //新建角色并切换到新角色
    const roleData = await mockRole({
      default: true,
      allowNewMenu: true,
      resources: [
        {
          usingActionsConfig: true,
          name: 'users',
          actions: [{ name: 'view' }, { name: 'create', fields: ['email'] }],
        },
        {
          usingActionsConfig: true,
          name: 'general',
          actions: [
            { name: 'view', fields: ['oneToOneBelongsTo'] },
            { name: 'create', fields: ['oneToOneBelongsTo'] },
          ],
        },
      ],
    });
    await mockPage(oneTableBlock).goto();
    await page.evaluate((roleData) => {
      window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
    }, roleData);
    await page.reload();
    await expect(page.getByLabel('block-item-CardItem-general-table')).toBeVisible();
    await page.getByLabel('action-Action-Add new-create').click();
    //关系字段组件可见，子表单/子表格中个别字段可见
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.oneToOneBelongsTo')).toBeVisible();
    await expect(page.getByLabel('block-item-CollectionField-users-form-users.email')).toBeVisible();
    await expect(page.getByLabel('block-item-CollectionField-users-form-users.phone')).not.toBeVisible();
    await expect(page.getByLabel('block-item-CollectionField-users-form-users.username')).not.toBeVisible();
  });
});
