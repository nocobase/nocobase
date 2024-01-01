import { expect, oneEmptyTableBlockBasedOnUsers, test } from '@nocobase/test/e2e';

test('actions', async ({ page, mockPage }) => {
  await mockPage(oneEmptyTableBlockBasedOnUsers).goto();
  await page.getByLabel('schema-initializer-ActionBar-TableActionInitializers-users').hover();
  //添加按钮
  await page.getByRole('menuitem', { name: 'Add new' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('menuitem', { name: 'Refresh' }).click();
  // 向右挪动鼠标指针，用以关闭下拉列表
  await page.mouse.move(300, 0);

  await page.getByLabel('action-Action-Add new-create-users-table').hover();
  await page.getByLabel('action-Action-Add new-create-users-table').getByLabel('designer-drag').hover();

  await page
    .getByLabel('action-Action-Add new-create-users-table')
    .getByLabel('designer-drag')
    .dragTo(page.getByLabel('action-Action-Delete-destroy-users-table'));
  await page.getByLabel('action-Action-Add new-create-users-table').hover();
  await page
    .getByLabel('action-Action-Add new-create-users-table')
    .getByLabel('designer-drag')
    .dragTo(page.getByLabel('action-Action-Refresh-refresh-users-table'));

  const addNew = await page.getByLabel('action-Action-Add new-create-users-table').boundingBox();
  const del = await page.getByLabel('action-Action-Delete-destroy-users-table').boundingBox();
  const refresh = await page.getByLabel('action-Action-Refresh-refresh-users-table').boundingBox();
  const max = Math.max(addNew.x, refresh.x, del.x);
  //拖拽调整排序符合预期
  expect(addNew.x).toBe(max);
});

test('fields', async () => {});
