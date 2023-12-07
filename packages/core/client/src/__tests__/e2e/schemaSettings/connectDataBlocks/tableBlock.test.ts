import { expect, test } from '@nocobase/test/client';
import { twoTableWithRelationalFields, twoTableWithSameCollection } from './templatesOfPage';

test.describe('connect data blocks: table block', () => {
  test('connections between same collections', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(twoTableWithSameCollection).waitForInit();
    const records = await mockRecords('users', 3);
    await nocoPage.goto();

    // 将左边的 Table 连接到右边的 Table
    await page.getByLabel('block-item-CardItem-users-table').first().hover();
    await page.getByRole('button', { name: 'designer-schema-settings-CardItem-TableBlockDesigner-users' }).hover();
    await page.getByRole('menuitem', { name: 'Connect data blocks' }).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();

    // 点击左边 Table 的某一行，右边 Table 的数据会被筛选为当前点中行的数据
    await page.getByLabel('block-item-CardItem-users-table').nth(0).getByText('Super Admin').click();
    await expect(page.getByLabel('block-item-CardItem-users-table').nth(1).getByText(records[0].nickname)).toBeHidden();
    await expect(page.getByLabel('block-item-CardItem-users-table').nth(1).getByText(records[1].nickname)).toBeHidden();
    await expect(page.getByLabel('block-item-CardItem-users-table').nth(1).getByText(records[2].nickname)).toBeHidden();
    await expect(page.getByLabel('block-item-CardItem-users-table').nth(1).getByText('Super Admin')).toBeVisible();
  });

  test('connecting via Relational Fields', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(twoTableWithRelationalFields).waitForInit();
    await mockRecords('users', 3);
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
      page
        .getByLabel('block-item-CardItem-users-table')
        .getByRole('row', { name: 'Member' })
        .filter({ hasNotText: 'Root' }),
    ).toHaveCount(0, { timeout: 1000 * 10 });
    await expect(page.getByLabel('block-item-CardItem-users-table').getByRole('row', { name: 'Root' })).toBeVisible();

    // 再次点击，会取消筛选效果
    await page.getByLabel('block-item-CardItem-roles-table').getByRole('cell', { name: 'Root', exact: true }).click();
    await expect(
      page
        .getByLabel('block-item-CardItem-users-table')
        .getByRole('row', { name: 'Member' })
        .filter({ hasNotText: 'Root' }),
    ).toHaveCount(3, { timeout: 1000 * 10 });
    await expect(page.getByLabel('block-item-CardItem-users-table').getByRole('row', { name: 'Root' })).toBeVisible();
  });

  test('connection via foreign key', async ({ page, mockPage, mockRecords }) => {});
});
