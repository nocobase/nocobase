/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  Page,
  expect,
  expectSettingsMenu,
  expectSupportedVariables,
  mockUserRecordsWithoutDepartments,
  oneTableBlockWithActionsAndFormBlocks,
  oneTableBlockWithAddNewAndViewAndEditAndBasicFields,
  test,
  twoTableWithAssociationFields,
  twoTableWithSameCollection,
} from '@nocobase/test/e2e';
import { T4032, oneTableWithRoles, twoTableWithAuthorAndBooks } from './templatesOfBug';

test.describe('table block schema settings', () => {
  test('supported options', async ({ page, mockPage }) => {
    await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).goto();

    await expectSettingsMenu({
      page,
      showMenu: () => showSettingsMenu(page),
      supportedOptions: [
        'Edit block title',
        'Enable drag and drop sorting',
        'Set the data scope',
        'Records per page',
        'Connect data blocks',
        // 'Save as template',
        'Delete',
      ],
    });
  });

  test('records per page', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecords('general', 40);
    await nocoPage.goto();

    // 默认每页显示 20 条（算上顶部 head 一共 21 行）
    await expect(page.getByRole('row')).toHaveCount(21);
    // 底部 pagination 的显示布局：[Total 40 items] [1] [2] [20 / page]
    await expect(page.locator('.ant-pagination')).toHaveText('Total 40 items1220 / page');

    await showSettingsMenu(page);
    await page.getByRole('menuitem', { name: 'Records per page' }).click();
    await page.getByRole('option', { name: '10', exact: true }).click();

    await expect(page.getByRole('row')).toHaveCount(11);
    // 底部 pagination 的显示布局：[Total 40 items] [1] [2] [3] [4] [10 / page]
    await expect(page.locator('.ant-pagination')).toHaveText('Total 40 items123410 / page');
  });

  test.describe('enable drag and drop sorting', () => {
    // 该用例在 CI 并发环境下容易报错，原因未知，通过增加重试次数可以解决
    test.describe.configure({ retries: process.env.CI ? 4 : 0 });
    test('enable drag and drop sorting', async ({ page, mockPage, mockRecords }) => {
      const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
      const records = await mockRecords('general', 3);
      await nocoPage.goto();

      await page.getByLabel('block-item-CardItem-general-table').hover();
      await page.getByLabel('designer-schema-settings-CardItem-TableBlockDesigner-general').hover();

      // 默认是关闭状态
      await expect(
        page.getByRole('menuitem', { name: 'Enable drag and drop sorting' }).getByRole('switch'),
      ).not.toBeChecked();

      // 开启之后，隐藏 Set default sorting rules 选项
      await page.getByRole('menuitem', { name: 'Enable drag and drop sorting' }).click();
      await page.getByText('Drag and drop sorting field').click();
      await page.getByText('sort', { exact: true }).click();
      await expect(
        page.getByRole('menuitem', { name: 'Enable drag and drop sorting' }).getByRole('switch'),
      ).toBeChecked();
      await expect(page.getByRole('menuitem', { name: 'Set default sorting rules' })).toBeHidden();
      // 显示出来 email 和 ID
      await page.getByLabel('schema-initializer-TableV2-table:configureColumns-general').hover();
      await page.getByRole('menuitem', { name: 'email' }).click();
      await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
      await page.getByLabel('schema-initializer-TableV2-').click();

      await page.mouse.move(300, 0);

      // 默认的排序
      let email1 = await page.getByText(records[0].email).boundingBox();
      let email2 = await page.getByText(records[1].email).boundingBox();
      let email3 = await page.getByText(records[2].email).boundingBox();

      expect(email1.y).toBeLessThan(email2.y);
      expect(email2.y).toBeLessThan(email3.y);

      // 将第二行拖动到第一行
      await page
        .getByLabel('table-index-2')
        .getByRole('img', { name: 'menu' })
        .dragTo(page.getByLabel('table-index-1').getByRole('img', { name: 'menu' }));

      await page.reload();

      email1 = await page.getByText(records[0].email).boundingBox();
      email2 = await page.getByText(records[1].email).boundingBox();
      email3 = await page.getByText(records[2].email).boundingBox();

      expect(email2.y).toBeLessThan(email1.y);
      expect(email1.y).toBeLessThan(email3.y);
    });
  });

  test.describe('set the data scope', () => {
    async function showDialog(page: Page) {
      await page.getByLabel('block-item-CardItem-general-table').hover();
      await page.getByLabel('designer-schema-settings-CardItem-TableBlockDesigner-general').hover();
      await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    }

    async function createColumnItem(page: Page, fieldName: string) {
      await page.getByLabel('schema-initializer-TableV2-table:configureColumns-general').hover();
      await page.getByRole('menuitem', { name: fieldName, exact: true }).click();
      await page.mouse.move(300, 0);
    }

    test('use constants', async ({ page, mockRecords, mockPage }) => {
      const nocoPage = await mockPage(oneTableBlockWithActionsAndFormBlocks).waitForInit();
      await mockRecords('general', 3);
      await nocoPage.goto();
      await createColumnItem(page, 'ID');

      await showDialog(page);

      // 添加一个 ID 为 1 的条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('select-filter-field').click();
      await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
      await page.getByRole('spinbutton').click();
      await page.getByRole('spinbutton').fill('1');
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.reload();

      // 被筛选之后数据只有一条（有一行是空的）
      await expect(page.getByRole('row')).toHaveCount(2);
      // 有一行 id 为 1 的数据
      await expect(page.getByRole('cell', { name: '1', exact: true })).toBeVisible();
    });

    test('use variable called current user', async ({ page, mockPage, mockRecords }) => {
      const nocoPage = await mockPage(oneTableBlockWithActionsAndFormBlocks).waitForInit();
      // Super Admin 是当前的用户的名字
      await mockRecords('general', [{ singleLineText: 'Super Admin' }, {}, {}]);
      await nocoPage.goto();
      await createColumnItem(page, 'singleLineText');

      await showDialog(page);

      // 添加一个 singleLineText 为 current user 的 Nickname 的条件
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('select-filter-field').click();
      await page.getByRole('menuitemcheckbox', { name: 'singleLineText' }).click();
      await page.getByLabel('variable-button').click();
      await expectSupportedVariables(page, ['Constant', 'Current user', 'Current role', 'API token', 'Date variables']);
      await page.getByRole('menuitemcheckbox', { name: 'Current user' }).click();
      await page.getByRole('menuitemcheckbox', { name: 'Nickname' }).click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.reload();

      // 被筛选之后数据只有一条（有一行是空的）
      await expect(page.getByRole('row')).toHaveCount(2);
      await expect(page.getByRole('cell', { name: 'Super Admin', exact: true })).toBeVisible();
    });

    // https://nocobase.height.app/T-4032
    test('parent record variable', async ({ page, mockPage }) => {
      await mockPage(T4032).goto();

      // 1. 打开弹窗，弹窗中的表格设置了数据范围：roles.name 包含当前用户的 roles.name
      await page.getByLabel('action-Action.Link-View').click();
      await page.waitForTimeout(1000);

      // 2. 断言
      // 不应该弹出错误提示
      await expect(page.locator('.ant-notification-notice')).not.toBeVisible();

      // 应该显示出三条数据：root，admin，member
      await expect(page.getByLabel('block-item-CardItem-roles-').getByText('root')).toBeVisible();
      await expect(page.getByLabel('block-item-CardItem-roles-').getByText('admin')).toBeVisible();
      await expect(page.getByLabel('block-item-CardItem-roles-').getByText('member')).toBeVisible();
    });
  });

  test.describe('set default sorting rules', () => {
    // 该用例在 CI 并发环境下容易报错，原因未知，通过增加重试次数可以解决
    test.describe.configure({ retries: process.env.CI ? 4 : 0 });
    test('set default sorting rules', async ({ page, mockPage, mockRecords }) => {
      const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
      const records = await mockRecords('general', 3);
      await nocoPage.goto();

      // 打开配置弹窗
      await page.getByLabel('block-item-CardItem-general-table').hover();
      await page.getByLabel('designer-schema-settings-CardItem-TableBlockDesigner-general').hover();
      await page.getByRole('menuitem', { name: 'Set default sorting rules' }).click();

      // 设置一个按 ID 降序的规则
      await page.getByRole('button', { name: 'plus Add sort field' }).click();
      await page.getByTestId('select-single').click();
      await page.getByRole('option', { name: 'ID', exact: true }).click();
      await page.getByText('DESC', { exact: true }).click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.reload();

      // 显示出来 email 和 ID
      await page.getByLabel('schema-initializer-TableV2-table:configureColumns-general').hover();
      await page.getByRole('menuitem', { name: 'email' }).click();
      await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
      await page.mouse.move(300, 0);

      // 规则生效后的顺序：3，2，1
      const email1 = await page.getByText(records[0].email).boundingBox();
      const email2 = await page.getByText(records[1].email).boundingBox();
      const email3 = await page.getByText(records[2].email).boundingBox();

      expect(email3.y).toBeLessThan(email2.y);
      expect(email2.y).toBeLessThan(email1.y);
    });
  });

  test.describe('connect data blocks', () => {
    test('connecting two blocks of the same collection', async ({ page, mockPage, mockRecords }) => {
      const nocoPage = await mockPage(twoTableWithSameCollection).waitForInit();
      const records = await mockUserRecordsWithoutDepartments(mockRecords, 3);
      await nocoPage.goto();

      // 将左边的 Table 连接到右边的 Table
      await page.getByLabel('block-item-CardItem-users-table').first().hover();
      await page.getByRole('button', { name: 'designer-schema-settings-CardItem-TableBlockDesigner-users' }).hover();
      await page.getByRole('menuitem', { name: 'Connect data blocks' }).hover();
      await page.getByRole('menuitem', { name: 'Users' }).click();

      // 点击左边 Table 的某一行，右边 Table 的数据会被筛选为当前点中行的数据
      await page.getByLabel('block-item-CardItem-users-table').nth(0).getByText('Super Admin').click();
      await expect(
        page.getByLabel('block-item-CardItem-users-table').nth(1).getByText(records[0].nickname),
      ).toBeHidden();
      await expect(
        page.getByLabel('block-item-CardItem-users-table').nth(1).getByText(records[1].nickname),
      ).toBeHidden();
      await expect(
        page.getByLabel('block-item-CardItem-users-table').nth(1).getByText(records[2].nickname),
      ).toBeHidden();
      await expect(page.getByLabel('block-item-CardItem-users-table').nth(1).getByText('Super Admin')).toBeVisible();
    });

    test('connecting two blocks connected by a relationship field', async ({ page, mockPage, mockRecords }) => {
      const nocoPage = await mockPage(twoTableWithAssociationFields).waitForInit();
      await mockUserRecordsWithoutDepartments(mockRecords, 3);
      await nocoPage.goto();

      // 将左边的 Table 连接到右边的 Table
      await page.getByLabel('block-item-CardItem-roles-table').hover();
      await page.getByRole('button', { name: 'designer-schema-settings-CardItem-TableBlockDesigner-roles' }).hover();
      await page.getByRole('menuitem', { name: 'Connect data blocks' }).hover();
      await page.getByRole('menuitem', { name: 'Users' }).click();
      await page.getByRole('option', { name: 'Roles' }).click();

      // 点击左边 Table 的某一行
      await page.getByLabel('block-item-CardItem-roles-table').getByRole('cell', { name: 'Root', exact: true }).click();
      await expect(
        page.getByLabel('block-item-CardItem-users-table').getByRole('row').filter({ hasNotText: 'Root' }),
      ).toHaveCount(1, {
        timeout: 1000 * 10,
      });
      await expect(page.getByLabel('block-item-CardItem-users-table').getByRole('row', { name: 'Root' })).toBeVisible();

      // 再次点击，会取消筛选效果
      await page.getByLabel('block-item-CardItem-roles-table').getByRole('cell', { name: 'Root', exact: true }).click();
      await expect(
        page.getByLabel('block-item-CardItem-users-table').getByRole('row').filter({ hasNotText: 'Root' }),
      ).toHaveCount(4, {
        timeout: 1000 * 10,
      });
      await expect(page.getByLabel('block-item-CardItem-users-table').getByRole('row', { name: 'Root' })).toBeVisible();
    });

    test('connecting two blocks connected by a foreign key', async ({ page, mockPage, mockRecords }) => {
      const nocoPage = await mockPage(twoTableWithAuthorAndBooks).waitForInit();
      const authors = await mockRecords('author', 3);
      await nocoPage.goto();

      // 1. 将 author 表通过外键连接到 books 表
      await page.getByLabel('block-item-CardItem-author-').hover();
      await page.getByLabel('designer-schema-settings-CardItem-blockSettings:table-author').hover();
      await page.getByRole('menuitem', { name: 'Connect data blocks right' }).hover();
      await page.getByRole('menuitem', { name: 'books ' }).click();
      await page.getByRole('option', { name: 'authorId [Foreign key]' }).click();

      // 2. 点击 author 表的某一行，books 表的数据会被筛选为当前点中行的数据
      await page.getByLabel('block-item-CardItem-author-').getByText(authors[0].name).click();

      for (const book of authors[0].books) {
        await expect(page.getByLabel('block-item-CardItem-books-').getByText(book.name)).toBeVisible();
      }

      for (const book of authors[1].books) {
        await expect(page.getByLabel('block-item-CardItem-books-').getByText(book.name)).not.toBeVisible();
      }
    });

    test('should immediately show in the drop-down menu of Connect data blocks when adding a block for the first time', async ({
      page,
      mockPage,
    }) => {
      await mockPage(oneTableWithRoles).goto();

      // 1. 创建一个详情区块
      await page.getByLabel('schema-initializer-Grid-page:').hover();
      await page.getByRole('menuitem', { name: 'Details right' }).hover();
      await page.getByRole('menuitem', { name: 'Roles' }).click();
      await page.mouse.move(300, 0);
      await page.getByLabel('schema-initializer-Grid-details:configureFields-roles').hover();
      await page.getByRole('menuitem', { name: 'Role name' }).click();
      await page.mouse.move(300, 0);

      // 2. 创建的详情区块应该立即出现在 Connect data blocks 的下拉菜单中
      await page.getByLabel('block-item-CardItem-roles-table').hover();
      await page.getByLabel('designer-schema-settings-CardItem-blockSettings:table-roles').hover();
      await page.getByRole('menuitem', { name: 'Connect data blocks right' }).hover();
      await page.getByRole('menuitem', { name: 'Roles #' }).click();

      // 3. 点击 Table 行，筛选功能应该正常
      // 初次点击，变为选中状态
      await page.getByRole('button', { name: 'Admin' }).click();
      await expect(page.getByLabel('block-item-CollectionField-').getByText('Admin')).toBeVisible();
      // 因为只有一条数据，所以不显示分页器
      await expect(page.getByLabel('block-item-CardItem-roles-details').locator('.ant-pagination')).toBeHidden();
      // 再次点击，取消选中状态
      await page.getByRole('button', { name: 'Admin' }).click();
      await expect(page.getByLabel('block-item-CardItem-roles-details').locator('.ant-pagination')).toBeVisible();

      // 4. 删除详情区块，Connect data blocks 的下拉菜单应该立即消失
      await page.getByLabel('block-item-CardItem-roles-details').hover();
      await page.getByLabel('designer-schema-settings-CardItem-blockSettings:detailsWithPagination-roles').hover();
      await page.getByRole('menuitem', { name: 'Delete' }).click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();

      await page.getByLabel('block-item-CardItem-roles-').hover();
      await page.getByLabel('designer-schema-settings-CardItem-blockSettings:table-roles').hover();
      await page.getByRole('menuitem', { name: 'Connect data blocks right' }).hover();
      await expect(page.getByRole('menuitem', { name: 'No blocks to connect' })).toBeVisible();
    });

    test('should not lose the filtering function when dragging and connecting', async ({ page, mockPage }) => {
      await mockPage(oneTableWithRoles).goto();

      // 1. 创建一个详情区块
      await page.getByLabel('schema-initializer-Grid-page:').hover();
      await page.getByRole('menuitem', { name: 'Details right' }).hover();
      await page.getByRole('menuitem', { name: 'Roles' }).click();
      await page.mouse.move(300, 0);
      await page.getByLabel('schema-initializer-Grid-details:configureFields-roles').hover();
      await page.getByRole('menuitem', { name: 'Role name' }).click();
      await page.mouse.move(300, 0);

      // 2. 拖动详情区块
      await page.getByLabel('block-item-CardItem-roles-details').hover();
      await page
        .getByLabel('designer-drag-handler-CardItem-blockSettings:detailsWithPagination-roles')
        .dragTo(page.getByLabel('block-item-CardItem-roles-table'));

      // 3. 创建的详情区块应该立即出现在 Connect data blocks 的下拉菜单中
      await page.getByLabel('block-item-CardItem-roles-table').hover({
        position: {
          x: 10,
          y: 10,
        },
      });
      await page.getByLabel('designer-schema-settings-CardItem-blockSettings:table-roles').hover();
      await page.getByRole('menuitem', { name: 'Connect data blocks right' }).hover();
      await page.getByRole('menuitem', { name: 'Roles #' }).click();

      // 4. 点击 Table 行，筛选功能应该正常
      // 初次点击，变为选中状态
      await page.getByRole('button', { name: 'Admin' }).click();
      await expect(page.getByLabel('block-item-CollectionField-').getByText('Admin')).toBeVisible();
      // 因为只有一条数据，所以不显示分页器
      await expect(page.getByLabel('block-item-CardItem-roles-details').locator('.ant-pagination')).toBeHidden();
      // 再次点击，取消选中状态
      await page.getByRole('button', { name: 'Admin' }).click();
      await expect(page.getByLabel('block-item-CardItem-roles-details').locator('.ant-pagination')).toBeVisible();

      // 5. 删除详情区块，Connect data blocks 的下拉菜单应该立即消失
      await page.getByLabel('block-item-CardItem-roles-details').hover();
      await page.getByLabel('designer-schema-settings-CardItem-blockSettings:detailsWithPagination-roles').hover();
      await page.getByRole('menuitem', { name: 'Delete' }).click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForTimeout(300);

      await page.getByLabel('block-item-CardItem-roles-').hover();
      await page.getByLabel('designer-schema-settings-CardItem-blockSettings:table-roles').hover();
      await page.getByRole('menuitem', { name: 'Connect data blocks right' }).hover();
      await expect(page.getByRole('menuitem', { name: 'No blocks to connect' })).toBeVisible();
    });
  });
});

async function showSettingsMenu(page) {
  await page.getByLabel('block-item-CardItem-general-table').hover();
  await page.getByLabel('designer-schema-settings-CardItem-TableBlockDesigner-general').click();
}
