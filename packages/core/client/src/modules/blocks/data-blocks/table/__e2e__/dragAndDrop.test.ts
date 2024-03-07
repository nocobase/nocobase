import { expect, oneEmptyTableBlockBasedOnUsers, test } from '@nocobase/test/e2e';

test('actions', async ({ page, mockPage }) => {
  await mockPage(oneEmptyTableBlockBasedOnUsers).goto();
  await page.getByLabel('schema-initializer-ActionBar-table:configureActions-users').hover();
  //添加按钮
  await page.getByRole('menuitem', { name: 'Add new' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('menuitem', { name: 'Refresh' }).click();
  // 向右挪动鼠标指针，用以关闭下拉列表
  await page.mouse.move(300, 0);

  const addNewBtn = page.getByLabel('action-Action-Add new-create-users-table');
  await addNewBtn.hover();
  const addNewDrag = page.getByLabel('action-Action-Add new-create-users-table').getByLabel('designer-drag');
  await addNewDrag.hover();

  const delBtn = page.getByLabel('action-Action-Delete-destroy-users-table');
  await addNewDrag.dragTo(delBtn);
  const refreshBtn = page.getByLabel('action-Action-Refresh-refresh-users-table');
  await addNewBtn.hover();
  await addNewBtn.getByLabel('designer-drag').dragTo(refreshBtn);

  const addNew = await addNewBtn.boundingBox();
  const del = await delBtn.boundingBox();
  const refresh = await refreshBtn.boundingBox();
  const max = Math.max(addNew.x, refresh.x, del.x);
  //拖拽调整排序符合预期
  expect(addNew.x).toBe(max);
});

test('fields', async () => {});
