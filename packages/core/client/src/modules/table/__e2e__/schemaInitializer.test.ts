import { createBlockInPage, expect, oneEmptyTable, test } from '@nocobase/test/client';

test.describe('where table block can be added', () => {
  test('page', async ({ page, mockPage }) => {
    await mockPage().goto();

    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await createBlockInPage(page, 'Table');
    await expect(page.getByLabel('block-item-CardItem-users-table')).toBeVisible();
  });

  test('popup', async () => {});
});

test.describe('configure actions', () => {
  test('filter & add new & delete & refresh', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTable).goto();

    // add buttons
    await page.getByLabel('schema-initializer-ActionBar-TableActionInitializers-t_unp4scqamw9').hover();
    await page.getByRole('menuitem', { name: 'Filter' }).click();
    await page.getByRole('menuitem', { name: 'Add new' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('menuitem', { name: 'Refresh' }).click();

    await expect(page.getByRole('menuitem', { name: 'Filter' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Delete' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Refresh' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Filter' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add new' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible();

    // delete buttons
    await page.getByLabel('schema-initializer-ActionBar-TableActionInitializers-t_unp4scqamw9').hover();
    await page.getByRole('menuitem', { name: 'Filter' }).click();
    await page.getByRole('menuitem', { name: 'Add new' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('menuitem', { name: 'Refresh' }).click();

    await expect(page.getByRole('menuitem', { name: 'Filter' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Delete' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Refresh' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Filter' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Add new' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Refresh' })).not.toBeVisible();
  });

  test('customize: add record', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTable).goto();

    await page.getByLabel('schema-initializer-ActionBar-TableActionInitializers-t_unp4scqamw9').hover();
    await page.getByRole('menuitem', { name: 'Customize' }).hover();
    await page.getByRole('menuitem', { name: 'add record' }).click();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Add record' })).toBeVisible();
  });
});

test.describe('configure columns', () => {
  test('action column & display collection fields & display association fields', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTable).goto();
    const configureColumnButton = page.getByLabel('schema-initializer-TableV2-TableColumnInitializers-t_unp4scqamw9');

    // Action column -------------------------------------------------------------
    // 1. 点击开关，可以开启和关闭 Action column
    // 2. 点击开关之后，如果不移出鼠标，下拉框不应该关闭
    await expect(page.getByText('Actions', { exact: true })).toBeVisible();
    await configureColumnButton.hover();

    await expect(page.getByRole('menuitem', { name: 'Action column' }).getByRole('switch')).toBeChecked();
    await page.getByRole('menuitem', { name: 'Action column' }).click();
    await expect(page.getByRole('menuitem', { name: 'Action column' }).getByRole('switch')).not.toBeChecked();

    // 移动鼠标关闭下拉框
    await page.mouse.move(300, 0);
    await expect(page.getByText('Actions', { exact: true })).not.toBeVisible();

    // 再次开启 Action column
    await configureColumnButton.hover();
    await page.getByRole('menuitem', { name: 'Action column' }).click();
    await expect(page.getByRole('menuitem', { name: 'Action column' }).getByRole('switch')).toBeChecked();
    await page.mouse.move(300, 0);
    await expect(page.getByText('Actions', { exact: true })).toBeVisible();

    // display collection fields -------------------------------------------------------------
    await configureColumnButton.hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await page.getByRole('menuitem', { name: 'One to one (belongs to)' }).first().click();
    await page.getByRole('menuitem', { name: 'One to one (has one)' }).first().click();
    await page.getByRole('menuitem', { name: 'Many to one' }).first().click();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'One to one (belongs to)' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'One to one (has one)' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Many to one' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('button', { name: 'ID', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'One to one (belongs to)', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'One to one (has one)', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Many to one', exact: true })).toBeVisible();

    // 点击开关，删除创建的字段
    await configureColumnButton.hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await page.getByRole('menuitem', { name: 'One to one (belongs to)' }).first().click();
    await page.getByRole('menuitem', { name: 'One to one (has one)' }).first().click();
    await page.getByRole('menuitem', { name: 'Many to one' }).first().click();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'One to one (belongs to)' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'One to one (has one)' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Many to one' }).getByRole('switch')).not.toBeChecked();
    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'ID', exact: true })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'One to one (belongs to)', exact: true })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'One to one (has one)', exact: true })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Many to one', exact: true })).not.toBeVisible();

    // display association fields -------------------------------------------------------------
    await configureColumnButton.hover();

    await page.getByText('Display collection fields', { exact: true }).hover();
    await page.mouse.wheel(0, 300);

    await page.getByRole('menuitem', { name: 'One to one (belongs to)' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await expect(page.getByRole('button', { name: 'Nickname', exact: true })).toBeVisible();

    // 开关应该是开启状态
    await configureColumnButton.hover();
    await page.getByRole('menuitem', { name: 'One to one (belongs to)' }).nth(1).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).toBeChecked();

    // 点击开关，删除创建的字段
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await expect(page.getByRole('button', { name: 'Nickname', exact: true })).not.toBeVisible();
    // 开关应该是关闭状态
    await configureColumnButton.hover();
    await page.getByRole('menuitem', { name: 'One to one (belongs to)' }).nth(1).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).not.toBeChecked();
  });

  test.pgOnly('display inherit fields', async ({ page, mockPage }) => {});
});

test.describe('configure actions column', () => {
  test('view & edit & delete & duplicate & customize', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyTable).waitForInit();
    await mockRecord('t_unp4scqamw9');
    await nocoPage.goto();

    // add view & Edit & Delete & Duplicate ------------------------------------------------------------
    await page.getByText('Actions', { exact: true }).hover();
    await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-t_unp4scqamw9').hover();
    await page.getByRole('menuitem', { name: 'View' }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();

    await expect(page.getByRole('menuitem', { name: 'View' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Edit' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Delete' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Duplicate' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-View-view-t_unp4scqamw9-table-0')).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Edit-update-t_unp4scqamw9-table-0')).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Delete-destroy-t_unp4scqamw9-table-0')).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Duplicate-duplicate-t_unp4scqamw9-table-0')).toBeVisible();

    // delete view & Edit & Delete & Duplicate ------------------------------------------------------------
    await page.getByText('Actions', { exact: true }).hover();
    await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-t_unp4scqamw9').hover();
    await page.getByRole('menuitem', { name: 'View' }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();

    await expect(page.getByRole('menuitem', { name: 'View' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Edit' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Delete' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Duplicate' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-View-view-t_unp4scqamw9-table-0')).not.toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Edit-update-t_unp4scqamw9-table-0')).not.toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Delete-destroy-t_unp4scqamw9-table-0')).not.toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Duplicate-duplicate-t_unp4scqamw9-table-0')).not.toBeVisible();

    // add custom action ------------------------------------------------------------
    await page.getByText('Actions', { exact: true }).hover();
    await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-t_unp4scqamw9').hover();
    await page.getByRole('menuitem', { name: 'Customize' }).hover();

    await page.getByRole('menuitem', { name: 'Popup' }).click();
    // 此时二级菜单，不应该关闭，可以继续点击？
    await page.getByRole('menuitem', { name: 'Update record' }).click();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-Popup-customize:popup-t_unp4scqamw9-table-0')).toBeVisible();
    await expect(
      page.getByLabel('action-Action.Link-Update record-customize:update-t_unp4scqamw9-table-0'),
    ).toBeVisible();
  });

  test('column width', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTable).goto();

    // 列宽度默认为 200
    await expect(page.getByRole('columnheader', { name: 'Actions', exact: true })).toHaveJSProperty('offsetWidth', 200);

    await page.getByText('Actions', { exact: true }).hover();
    await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-t_unp4scqamw9').hover();
    await page.getByRole('menuitem', { name: 'Column width' }).click();

    await expect(page.getByRole('dialog').getByText('Column width')).toBeVisible();

    await page.getByRole('dialog').getByRole('spinbutton').click();
    await page.getByRole('dialog').getByRole('spinbutton').fill('400');
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByRole('columnheader', { name: 'Actions', exact: true })).toHaveJSProperty('offsetWidth', 400);
  });
});
