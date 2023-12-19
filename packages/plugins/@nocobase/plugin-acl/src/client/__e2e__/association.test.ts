import { expect, test } from '@nocobase/test/client';
import { oneTableBlock } from './utils';

// test.afterEach(async ({ page }) => {
//   await page.evaluate(() => {
//     window.localStorage.setItem('NOCOBASE_ROLE', 'root');
//   });
// });
test.describe('view', () => {
  //关系字段有权限，关系目标表无权限
  test('association field asscess, association target collectio denied', async ({
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
    await page.getByTestId('user-center-button').hover();
    await expect(page.getByLabel('block-item-CardItem-general-table')).toBeVisible();
    //关系字段可见
    await expect(page.getByRole('button', { name: 'oneToOneBelongsTo' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'phone' })).not.toBeVisible();
    await page.getByLabel('action-Action.Link-Association block-customize:popup-general-table').click();
    //关系区块不可见
    await expect(await page.getByLabel('block-item-CardItem-users-form')).not.toBeVisible();
  });
  //关系字段有权限，关系目标表个别字段有权限
  test('association field asscess, association target collectio access with fields', async ({
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
    await page.getByTestId('user-center-button').hover();
    await expect(page.getByLabel('block-item-CardItem-general-table')).toBeVisible();
    //关系字段可见
    await expect(page.getByRole('button', { name: 'oneToOneBelongsTo' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'phone' })).not.toBeVisible();
    await page.getByLabel('action-Action.Link-Association block-customize:popup-general-table').click();
    //关系区块可见,个别字段可见
    await expect(await page.getByLabel('block-item-CardItem-users-form')).toBeVisible();
    await expect(await page.getByLabel('block-item-CollectionField-users-form-users.nickname')).not.toBeVisible();
    await expect(await page.getByLabel('block-item-CollectionField-users-form-users.email')).toBeVisible();
  });
});

test.describe('update', () => {
  //关系字段有权限，关系目标表无权限
  test('association field assces, association target collection denied', async ({
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
    await page.getByTestId('user-center-button').hover();
    await expect(page.getByLabel('block-item-CardItem-general-table')).toBeVisible();
    await page.getByLabel('action-Action.Link-Association field-customize:popup-general-table').click();
    //关系字段组件可见，子表单/子表格中字段不可见
    await expect(
      await page.getByLabel('block-item-CollectionField-general-form-general.oneToOneBelongsTo'),
    ).toBeVisible();
    await expect(await page.getByLabel('block-item-CollectionField-users-form-users.email-Email')).not.toBeVisible();
  });
  //关系字段有权限，关系目标表个别字段有权限
  test('association field assces,association target collection access with fields', async ({
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
          actions: [
            { name: 'view', fields: ['email'] },
            { name: 'update', fields: ['email'] },
          ],
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
    await page.getByTestId('user-center-button').hover();
    await expect(page.getByLabel('block-item-CardItem-general-table')).toBeVisible();
    await page.getByLabel('action-Action.Link-Association field-customize:popup-general-table').click();
    //关系字段组件可见，子表单/子表格中个别字段可见
    await expect(
      await page.getByLabel('block-item-CollectionField-general-form-general.oneToOneBelongsTo'),
    ).toBeVisible();
    await expect(await page.getByLabel('block-item-CollectionField-users-form-users.email')).toBeVisible();
    await expect(await page.getByLabel('block-item-CollectionField-users-form-users.phone')).not.toBeVisible();
  });
});

// test.describe('create', () => {
//   test('general permission', async ({ page, mockPage, mockRole }) => {
//     await mockPage(oneTableBlock).goto();
//     //新建角色并切换到新角色
//     const roleData = await mockRole({
//       snippets: ['pm', 'pm.*', 'ui.*'],
//       strategy: {
//         actions: ['update', 'destroy', 'view'],
//       },
//       default: true,
//       allowNewMenu: true,
//     });
//     await mockPage(oneTableBlock).goto();
//     await page.evaluate((roleData) => {
//       window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
//     }, roleData);
//     await page.reload();
//     await page.getByTestId('user-center-button').hover();
//     await expect(await page.getByLabel('action-Action-Add new-create-users-table')).not.toBeVisible();
//   });
//   test('individual collection permission', async ({ page, mockPage, mockRole, mockRecord }) => {
//     await mockPage(oneTableBlock).goto();
//     //新建角色并切换到新角色
//     const roleData = await mockRole({
//       default: true,
//       allowNewMenu: true,
//       resources: [
//         {
//           usingActionsConfig: true,
//           name: 'users',
//           actions: [
//             {
//               name: 'view',
//               fields: ['id'],
//               scope: null,
//             },
//             {
//               name: 'create',
//               fields: ['id'],
//               scope: null,
//             },
//           ],
//         },
//       ],
//     });
//     await page.evaluate((roleData) => {
//       window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
//     }, roleData);
//     await page.reload();
//     await mockPage(oneTableBlock).goto();
//     await page.reload();
//     await expect(await page.getByLabel('action-Action-Add new-create-users-table')).toBeVisible();
//   });
// });

// test.describe('update', () => {
//   test('general permission', async ({ page, mockPage, mockRole }) => {
//     await mockPage(oneTableBlock).goto();
//     //新建角色并切换到新角色
//     const roleData = await mockRole({
//       snippets: ['pm', 'pm.*', 'ui.*'],
//       strategy: {
//         actions: ['create', 'destroy', 'view'],
//       },
//       default: true,
//       allowNewMenu: true,
//     });
//     await mockPage(oneTableBlock).goto();
//     await page.evaluate((roleData) => {
//       window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
//     }, roleData);
//     await page.reload();
//     await page.getByTestId('user-center-button').hover();
//     await expect(await page.getByLabel('action-Action.Link-Edit-update-users-table-0')).not.toBeVisible();
//   });
//   test('individual collection permission', async ({ page, mockPage, mockRole, mockRecord }) => {
//     await mockPage().goto();
//     //新建角色并切换到新角色
//     const roleData = await mockRole({
//       default: true,
//       allowNewMenu: true,
//       resources: [
//         {
//           usingActionsConfig: true,
//           name: 'users',
//           actions: [{ name: 'view' }, { name: 'update' }],
//         },
//       ],
//     });
//     await page.evaluate((roleData) => {
//       window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
//     }, roleData);
//     await page.reload();
//     await mockPage(oneTableBlock).goto();
//     await page.getByTestId('user-center-button').hover();
//     await expect(await page.getByLabel('action-Action.Link-Edit-update-users-table-0')).toBeVisible();
//   });
// });

// test.describe('destroy', () => {
//   test('general permission', async ({ page, mockPage, mockRole }) => {
//     await mockPage(oneTableBlock).goto();
//     //新建角色并切换到新角色
//     const roleData = await mockRole({
//       snippets: ['pm', 'pm.*', 'ui.*'],
//       strategy: {
//         actions: ['create', 'update', 'view'],
//       },
//       default: true,
//       allowNewMenu: true,
//     });
//     await mockPage(oneTableBlock).goto();
//     await page.evaluate((roleData) => {
//       window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
//     }, roleData);
//     await page.reload();
//     await page.getByTestId('user-center-button').hover();
//     await expect(await page.getByLabel('action-Action-Delete-destroy-users-table')).not.toBeVisible();
//   });
//   test('individual collection permission', async ({ page, mockPage, mockRole, mockRecord }) => {
//     await mockPage().goto();
//     //新建角色并切换到新角色
//     const roleData = await mockRole({
//       default: true,
//       allowNewMenu: true,
//       resources: [
//         {
//           usingActionsConfig: true,
//           name: 'users',
//           actions: [
//             { name: 'view' },
//             {
//               name: 'destroy',
//               fields: ['id'],
//               scope: null,
//             },
//           ],
//         },
//       ],
//     });
//     await page.evaluate((roleData) => {
//       window.localStorage.setItem('NOCOBASE_ROLE', roleData.name);
//     }, roleData);
//     await page.reload();
//     await mockPage(oneTableBlock).goto();
//     await page.reload();
//     await expect(await page.getByLabel('action-Action-Delete-destroy-users-table')).not.toBeVisible();
//   });
// });
