import { expect, test } from '@nocobase/test/e2e';
import { tableDetailsListGridCardWithUsers } from './templates';

test.describe('where filter block can be added', () => {
  test('page', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(tableDetailsListGridCardWithUsers).waitForInit();
    const newUserRecords = await mockRecords('users', 3);
    await nocoPage.goto();

    // 1. 页面中创建一个 filter form，一个 filter collapse
    await page.getByLabel('schema-initializer-Grid-page:').hover();
    await page.getByRole('menuitem', { name: 'form Form right' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();
    await page.getByLabel('schema-initializer-Grid-page:').hover();
    await page.getByRole('menuitem', { name: 'table Collapse right' }).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();

    // 2. 区块中能正常创建字段和按钮，且能正常显示字段值
    await page.getByLabel('schema-initializer-Grid-filterForm:configureFields-users').hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await page.getByLabel('schema-initializer-ActionBar-filterForm:configureActions-users').hover();
    await page.getByRole('menuitem', { name: 'Filter' }).click();
    await page.getByRole('menuitem', { name: 'Reset' }).click();
    await page.getByLabel('schema-initializer-AssociationFilter-filterCollapse:configureFields-users').hover();
    await page.getByRole('menuitem', { name: 'Roles' }).click();

    // 3. 与 Table、Details、List、GridCard 等区块建立连接
    const connectByForm = async (name: string) => {
      await page.getByLabel('block-item-CardItem-users-filter-form').hover();
      await page.getByLabel('designer-schema-settings-CardItem-blockSettings:filterForm-users').hover();
      await page.getByRole('menuitem', { name: 'Connect data blocks right' }).hover();
      await page.getByRole('menuitem', { name }).click();
    };
    const connectByCollapse = async (name: string) => {
      await page.getByLabel('block-item-CardItem-users-filter-collapse').hover();
      await page.getByLabel('designer-schema-settings-CardItem-blockSettings:filterCollapse-users').hover();
      await page.getByRole('menuitem', { name: 'Connect data blocks right' }).hover();
      await page.getByRole('menuitem', { name }).click();
    };
    await connectByForm('Users #79xm');
    await connectByForm('Users #4whf');
    await connectByForm('Users #qztm');
    await connectByForm('Users #2nig');
    await connectByCollapse('Users #79xm');
    await connectByCollapse('Users #4whf');
    await connectByCollapse('Users #qztm');
    await connectByCollapse('Users #2nig');

    // 4. 筛选区块能正常筛选数据
    await page
      .getByLabel('block-item-CollectionField-users-filter-form-users.nickname-Nickname')
      .getByRole('textbox')
      .fill(newUserRecords[0].nickname);

    // filter
    await page.getByLabel('action-Action-Filter-submit-').click({ position: { x: 10, y: 10 } });
    await page.waitForLoadState('networkidle');
    for (const record of newUserRecords) {
      await expect(page.getByLabel('block-item-CardItem-users-table').getByText(record.nickname)).toBeVisible({
        visible: record === newUserRecords[0],
      });
      await expect(page.getByLabel('block-item-CardItem-users-details').getByText(record.nickname)).toBeVisible({
        visible: record === newUserRecords[0],
      });
      await expect(page.getByLabel('block-item-CardItem-users-list').getByText(record.nickname)).toBeVisible({
        visible: record === newUserRecords[0],
      });
      await expect(page.getByLabel('block-item-BlockItem-users-grid').getByText(record.nickname)).toBeVisible({
        visible: record === newUserRecords[0],
      });
    }

    // reset
    await page.getByLabel('action-Action-Reset-users-').click({ position: { x: 10, y: 10 } });
    await page.waitForLoadState('networkidle');
    for (const record of newUserRecords) {
      await expect(page.getByLabel('block-item-CardItem-users-table').getByText(record.nickname)).toBeVisible();
      await expect(page.getByLabel('block-item-CardItem-users-list').getByText(record.nickname)).toBeVisible();
      await expect(page.getByLabel('block-item-BlockItem-users-grid').getByText(record.nickname)).toBeVisible();
    }
  });
});
