import { test, expect } from '@nocobase/test/client';
import { oneEmptyKanbanBlock, generalWithSingleSelect } from './utils';

test.describe('configure Kanban', () => {
  test(' create kanban blocks in the page && add field', async ({ page, mockPage, mockCollections, mockRecord }) => {
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
});

test('configure action in kanban block', async ({ page, mockPage, mockCollections }) => {
  await mockPage(oneEmptyKanbanBlock).goto();
  //配置区块按钮
  await expect(page.getByLabel('block-item-CardItem-general-kanban')).toBeVisible();
  await expect(page.getByLabel('schema-initializer-ActionBar-KanbanActionInitializers-general')).toBeVisible();
  await page.getByLabel('schema-initializer-ActionBar-KanbanActionInitializers-general').click();
  await page.getByRole('menuitem', { name: 'Filter' }).getByRole('switch').click();
  await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').click();
  //按钮正常显示
  await expect(page.getByLabel('action-Filter.Action-Filter-filter-general-kanban')).toBeVisible();
  await expect(page.getByLabel('action-Action-Add ')).toBeVisible();
});
test('configure fields in kanban block', async ({ page, mockPage, mockRecord, mockCollections }) => {
  await mockCollections(generalWithSingleSelect);
  await mockRecord('general', { singleLineText: 'singleLineText', manyToOne: { id: 1 } });
  await mockPage().goto();
  await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
  await expect(page.getByRole('menuitem', { name: 'form Kanban right' })).toBeVisible();
  await page.getByRole('menuitem', { name: 'form Kanban right' }).click();
  await page.getByRole('menuitem', { name: 'form Kanban right' }).hover();
  await page.getByRole('menuitem', { name: 'General' }).click();
  await page.getByLabel('block-item-Select-Grouping field').getByLabel('Search').click();
  await page.getByRole('option', { name: 'Single select' }).click();
  await page.getByRole('button', { name: 'OK' }).click();
  await expect(page.getByLabel('block-item-CardItem-general-kanban')).toBeVisible();
  //看板上配置普通字段
  await page.getByLabel('block-item-Kanban.Card-general-kanban').hover();
  await page.getByLabel('designer-schema-initializer-Kanban.Card-Kanban.Card.Designer-general').hover();
  await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Single line text' }).click();
  //字段正常显示
  expect(await page.getByLabel('block-item-CollectionField-general-kanban-general.singleLineText').innerText()).toBe(
    'singleLineText',
  );
  expect(await page.getByLabel('block-item-CollectionField-general-kanban-general.id').innerText()).toBe('1');
  //配置关系字段
  await page.getByRole('menuitem', { name: 'Many to one', exact: true }).click();
  expect(await page.getByLabel('block-item-CollectionField-general-kanban-general.manyToOne').innerText()).toBe('1');
  //修改字段标题
  await page.getByLabel('schema-initializer-ActionBar-KanbanActionInitializers-general').click();
  await page.getByLabel('block-item-CollectionField-general-kanban-general.manyToOne').hover();
  await page.getByLabel('designer-schema-settings-CollectionField-FormItem.Designer-general-general.manyToOne').hover();
  await page.getByText('Title field').click();
  await page.getByRole('option', { name: 'Username' }).click();
  //显示新的标题字段符合预期
  expect(await page.getByLabel('block-item-CollectionField-general-kanban-general.manyToOne').innerText()).toBe(
    'nocobase',
  );
});
