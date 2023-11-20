import { test, expect } from '@nocobase/test/client';
import { oneEmptyKanbanBlock, generalWithSingleSelect } from './utils';

test.describe('configure Kanban', () => {
  test(' create kanban blocks in the page && add field', async ({
    page,
    mockPage,
    mockCollection,
    mockCollections,
    mockRecord,
    mockRecords,
  }) => {
    await mockCollections(generalWithSingleSelect);
    await mockRecord('general');
    await mockPage().goto();
    //在页面中可以创建看板区块
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await expect(page.getByRole('menuitem', { name: 'form Kanban right' })).toBeVisible();
    await page.getByRole('menuitem', { name: 'form Kanban right' }).click();
    await page.getByRole('menuitem', { name: 'form Kanban right' }).hover();
    await page.getByRole('menuitem', { name: 'General' }).click();
    await page.getByLabel('block-item-Select-Grouping field').getByLabel('Search').click();
    await page.getByRole('option', { name: 'Single select' }).click();
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByLabel('block-item-CardItem-general-kanban')).toBeVisible();
  });
  test('configure action in kanban block', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneEmptyKanbanBlock).goto();
    await expect(page.getByLabel('block-item-CardItem-general-kanban')).toBeVisible();
    await expect(page.getByLabel('schema-initializer-ActionBar-KanbanActionInitializers-general')).toBeVisible();
    await page.getByLabel('schema-initializer-ActionBar-KanbanActionInitializers-general').click();
    await page.getByRole('menuitem', { name: 'Filter' }).getByRole('switch').click();
    await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();

    await expect(page.getByLabel('action-Filter.Action-Filter-filter-general-kanban')).toBeVisible();
    await expect(page.getByLabel('action-Action-Add ')).toBeVisible();

    //   // mockCollections
    //   await mockCollections([
    //     {
    //       name: 'example',
    //     },
    //   ]);

    //   // mockRecord，生成 example 表的 1 条数据

    //   // mockRecords，生成 example 表的 3 条数据
    //   const records = await mockRecords('example', 3);
  });
});
