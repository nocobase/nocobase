import {
  Page,
  expect,
  groupPageEmpty,
  oneEmptyDetailsBlock,
  oneEmptyFilterCollapseBlock,
  oneEmptyFilterFormBlock,
  oneEmptyForm,
  oneEmptyGridCardBlock,
  oneEmptyListBlock,
  oneEmptyTable,
  oneEmptyTableBlockWithActions,
  oneEmptyTableBlockWithCustomizeActions,
  oneFormBlockWithRolesFieldBasedUsers,
  tabPageEmpty,
  test,
} from '@nocobase/test/client';

const createBlock = async (page: Page, name: string) => {
  await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();

  if (name === 'Form') {
    await page.getByText('Form', { exact: true }).first().hover();
  } else if (name === 'Filter form') {
    await page.getByText('Form', { exact: true }).nth(1).hover();
  } else {
    await page.getByText(name, { exact: true }).hover();
  }

  if (name === 'Markdown') {
    await page.getByRole('menuitem', { name: 'Markdown' }).click();
  } else {
    await page.getByRole('menuitem', { name: 'Users' }).click();
  }

  await page.mouse.move(300, 0);
};

test.describe('Menu', () => {
  test('header', async ({ page, deletePage }) => {
    await page.goto('/');

    // add group
    await page.getByTestId('schema-initializer-Menu-header').hover();
    await page.getByRole('menuitem', { name: 'Group' }).click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('page group');
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByLabel('page group', { exact: true })).toBeVisible();

    // add page
    await page.getByTestId('schema-initializer-Menu-header').hover();
    await page.getByRole('menuitem', { name: 'Page', exact: true }).click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('page item');
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByLabel('page item', { exact: true })).toBeVisible();

    // add link
    await page.getByTestId('schema-initializer-Menu-header').hover();
    await page.getByRole('menuitem', { name: 'Link', exact: true }).click();
    await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').fill('page link');
    await page.getByLabel('block-item-Input-Link').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-Link').getByRole('textbox').fill('baidu.com');
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByText('page link', { exact: true })).toBeVisible();

    // delete pages
    await deletePage('page group');
    await deletePage('page item');
    await deletePage('page link');
  });

  test('sidebar', async ({ page, mockPage }) => {
    await mockPage(groupPageEmpty).goto();

    // add group in side
    await page.getByTestId('schema-initializer-Menu-side').hover();
    await page.getByRole('menuitem', { name: 'Group', exact: true }).click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('page group side');
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByText('page group side', { exact: true })).toBeVisible();

    // add page in side
    await page.getByTestId('schema-initializer-Menu-side').hover();
    await page.getByRole('menuitem', { name: 'Page', exact: true }).click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('page item side');
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByText('page item side', { exact: true })).toBeVisible();

    // add link in side
    await page.getByTestId('schema-initializer-Menu-side').hover();
    await page.getByRole('menuitem', { name: 'Link', exact: true }).click();
    await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').fill('link item side');
    await page.getByLabel('block-item-Input-Link').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-Link').getByRole('textbox').fill('/');
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByText('link item side', { exact: true })).toBeVisible();
  });
});

test.describe('Page.Tabs', () => {
  test('enable to create tab', async ({ page, mockPage }) => {
    await mockPage(tabPageEmpty).goto();

    // add tab page
    await page.getByLabel('schema-initializer-Page-tabs').click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('tab1');
    await page.getByRole('button', { name: 'OK' }).click();

    await expect(page.getByText('tab1', { exact: true })).toBeVisible();
  });
});

test.describe('Page.Grid', () => {
  test('create block', async ({ page, mockPage }) => {
    await mockPage().goto();
    const button = page.getByLabel('schema-initializer-Grid-BlockInitializers');

    // add table block
    await button.hover();
    await createBlock(page, 'Table');
    await expect(page.getByLabel('block-item-CardItem-users-table')).toBeVisible();

    // add form block
    await button.hover();
    await createBlock(page, 'Form');
    await expect(page.getByLabel('block-item-CardItem-users-form')).toBeVisible();

    // add detail block
    await button.hover();
    await createBlock(page, 'Details');
    await expect(page.getByLabel('block-item-CardItem-users-details')).toBeVisible();

    // add list block
    await button.hover();
    await createBlock(page, 'List');
    await expect(page.getByLabel('block-item-CardItem-users-list')).toBeVisible();

    // add grid card block
    await button.hover();
    await createBlock(page, 'Grid Card');
    await expect(page.getByLabel('block-item-BlockItem-users-grid-card')).toBeVisible();

    // add filter form block
    await button.hover();
    await createBlock(page, 'Filter form');
    await expect(page.getByLabel('block-item-CardItem-users-filter-form')).toBeVisible();

    // add collapse block
    await button.hover();
    await createBlock(page, 'Collapse');
    await expect(page.getByLabel('block-item-CardItem-users-filter-collapse')).toBeVisible();

    // add markdown block
    await button.hover();
    await createBlock(page, 'Markdown');
    await expect(page.getByLabel('block-item-Markdown.Void-markdown')).toBeVisible();
  });
});

test.describe('Table', () => {
  test('add column', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTable).goto();
    const configureColumnButton = page.getByLabel('schema-initializer-TableV2-TableColumnInitializers-t_unp4scqamw9');

    // Action column -------------------------------------------------------------
    // 1. 点击开关，可以开启和关闭 Action column
    // 2. 点击开关之后，如果不移出鼠标，下拉框不应该关闭
    await expect(page.getByText('Actions', { exact: true })).toBeVisible();
    await configureColumnButton.hover();

    // 滚动鼠标，以把底部的 Action column 选项显示出来
    await page.getByText('Display collection fields', { exact: true }).hover();
    await page.mouse.wheel(0, 300);

    await expect(page.getByRole('menuitem', { name: 'Action column' }).getByRole('switch')).toBeChecked();
    await page.getByRole('menuitem', { name: 'Action column' }).click();
    await expect(page.getByRole('menuitem', { name: 'Action column' }).getByRole('switch')).not.toBeChecked();

    // 移动鼠标关闭下拉框
    await page.mouse.move(300, 0);
    await expect(page.getByText('Actions', { exact: true })).not.toBeVisible();

    // 再次开启 Action column
    await configureColumnButton.hover();
    await page.mouse.wheel(0, 300);
    await page.getByRole('menuitem', { name: 'Action column' }).click();
    await expect(page.getByRole('menuitem', { name: 'Action column' }).getByRole('switch')).toBeChecked();
    await page.mouse.move(300, 0);
    await expect(page.getByText('Actions', { exact: true })).toBeVisible();

    // collection fields -------------------------------------------------------------
    await configureColumnButton.hover();
    await page.getByRole('menuitem', { name: 'ID' }).click();
    await page.getByRole('menuitem', { name: 'One to one (belongs to)' }).first().click();
    await page.getByRole('menuitem', { name: 'One to one (has one)' }).first().click();
    await page.getByRole('menuitem', { name: 'Many to one' }).first().click();
    await expect(page.getByRole('menuitem', { name: 'ID' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'One to one (belongs to)' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'One to one (has one)' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Many to one' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('button', { name: 'ID', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'One to one (belongs to)', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'One to one (has one)', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Many to one', exact: true })).toBeVisible();

    // 点击开关，删除创建的字段
    await configureColumnButton.hover();
    await page.getByRole('menuitem', { name: 'ID' }).click();
    await page.getByRole('menuitem', { name: 'One to one (belongs to)' }).first().click();
    await page.getByRole('menuitem', { name: 'One to one (has one)' }).first().click();
    await page.getByRole('menuitem', { name: 'Many to one' }).first().click();
    await expect(page.getByRole('menuitem', { name: 'ID' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'One to one (belongs to)' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'One to one (has one)' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Many to one' }).getByRole('switch')).not.toBeChecked();
    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'ID', exact: true })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'One to one (belongs to)', exact: true })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'One to one (has one)', exact: true })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Many to one', exact: true })).not.toBeVisible();

    // association fields -------------------------------------------------------------
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

  // TODO: 继承表相关测试
  test.pgOnly('inherit column', async ({ page, mockPage }) => {});

  test('add column action buttons', async ({ page, mockPage, mockRecord }) => {
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

  test('adjust column width', async ({ page, mockPage }) => {
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

  test('add action buttons', async ({ page, mockPage }) => {
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

  test('add custom action buttons', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTable).goto();

    await page.getByLabel('schema-initializer-ActionBar-TableActionInitializers-t_unp4scqamw9').hover();
    await page.getByRole('menuitem', { name: 'Customize' }).hover();
    await page.getByRole('menuitem', { name: 'Bulk update' }).click();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Bulk update' })).toBeVisible();
  });
});

test.describe('Form', () => {
  test('add fields', async ({ page, mockPage }) => {
    await mockPage(oneEmptyForm).goto();

    const formItemInitializer = page.getByLabel('schema-initializer-Grid-FormItemInitializers-general');

    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'ID' }).click();
    await expect(page.getByRole('menuitem', { name: 'ID' }).getByRole('switch')).toBeChecked();

    // add association fields
    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.id-ID')).toBeVisible();
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.manyToOne.nickname')).toBeVisible();

    // delete fields
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'ID' }).click();
    await expect(page.getByRole('menuitem', { name: 'ID' }).getByRole('switch')).not.toBeChecked();

    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.id-ID')).not.toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-general-form-general.manyToOne.nickname'),
    ).not.toBeVisible();

    // add text
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'Text' }).click();
    await expect(page.getByLabel('block-item-Markdown.Void-general-form')).toBeVisible();
  });

  test.pgOnly('add inherit fields', async ({ page, mockPage }) => {});

  test('add action buttons', async ({ page, mockPage }) => {
    await mockPage(oneEmptyForm).goto();

    await page.getByLabel('schema-initializer-ActionBar-FormActionInitializers-general').hover();

    // add button
    await page.getByRole('menuitem', { name: 'Submit' }).click();
    await expect(page.getByRole('menuitem', { name: 'Submit' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();

    // delete button
    await page.getByLabel('schema-initializer-ActionBar-FormActionInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Submit' }).click();
    await expect(page.getByRole('menuitem', { name: 'Submit' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Submit' })).not.toBeVisible();
  });

  test('add custom action buttons', async ({ page, mockPage }) => {
    await mockPage(oneEmptyForm).goto();

    await page.getByLabel('schema-initializer-ActionBar-FormActionInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Customize' }).hover();
    await page.getByRole('menuitem', { name: 'Save record' }).click();

    await expect(page.getByRole('button', { name: 'Save record' })).toBeVisible();
  });
});

test.describe('Details block', () => {
  test('add fields', async ({ page, mockPage }) => {
    await mockPage(oneEmptyDetailsBlock).goto();

    const formItemInitializer = page.getByLabel('schema-initializer-Grid-ReadPrettyFormItemInitializers-general');

    // add fields
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'ID' }).click();
    await expect(page.getByRole('menuitem', { name: 'ID' }).getByRole('switch')).toBeChecked();

    // add association fields
    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-details-general.id-ID')).toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-general-details-general.manyToOne.nickname'),
    ).toBeVisible();

    // delete fields
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'ID' }).click();
    await expect(page.getByRole('menuitem', { name: 'ID' }).getByRole('switch')).not.toBeChecked();

    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-details-general.id-ID')).not.toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-general-details-general.manyToOne.nickname'),
    ).not.toBeVisible();

    // add text
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'Add text' }).click();
    await expect(page.getByLabel('block-item-Markdown.Void-general-details')).toBeVisible();
  });

  test('add action buttons', async ({ page, mockPage }) => {
    await mockPage(oneEmptyDetailsBlock).goto();

    await page.getByLabel('schema-initializer-ActionBar-DetailsActionInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();

    await expect(page.getByRole('menuitem', { name: 'Edit' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Delete' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Duplicate' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Duplicate' })).toBeVisible();

    // delete buttons
    await page.getByLabel('schema-initializer-ActionBar-DetailsActionInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();

    await expect(page.getByRole('menuitem', { name: 'Edit' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Delete' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Duplicate' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Edit' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Duplicate' })).not.toBeVisible();
  });
});

test.describe('List', () => {
  test('add list actions', async ({ page, mockPage }) => {
    await mockPage(oneEmptyListBlock).goto();

    await page.getByLabel('schema-initializer-ActionBar-ListActionInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Filter' }).click();
    await page.getByRole('menuitem', { name: 'Add new' }).click();
    await page.getByRole('menuitem', { name: 'Refresh' }).click();

    await expect(page.getByRole('menuitem', { name: 'Filter' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Refresh' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Filter' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add new' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible();

    // delete buttons
    await page.getByLabel('schema-initializer-ActionBar-ListActionInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Filter' }).click();
    await page.getByRole('menuitem', { name: 'Add new' }).click();
    await page.getByRole('menuitem', { name: 'Refresh' }).click();

    await expect(page.getByRole('menuitem', { name: 'Filter' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Refresh' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Filter' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Add new' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Refresh' })).not.toBeVisible();
  });

  test('add fields', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyListBlock).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    const formItemInitializer = page
      .getByLabel('schema-initializer-Grid-ReadPrettyFormItemInitializers-general')
      .first();

    // add fields
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'ID' }).click();
    await expect(page.getByRole('menuitem', { name: 'ID' }).getByRole('switch')).toBeChecked();

    // add association fields
    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    // TODO: 二级菜单点击后，不应该被关闭；只有在鼠标移出下拉列表的时候，才应该被关闭
    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-list-general.id-ID').first()).toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-general-list-general.manyToOne.nickname').first(),
    ).toBeVisible();

    // delete fields
    await formItemInitializer.hover();
    await page.getByRole('tooltip').getByText('Display association fields').hover();
    await page.mouse.wheel(0, -300);
    await page.getByRole('menuitem', { name: 'ID' }).click();
    await expect(page.getByRole('menuitem', { name: 'ID' }).getByRole('switch')).not.toBeChecked();

    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-list-general.id-ID').first()).not.toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-general-list-general.manyToOne.nickname').first(),
    ).not.toBeVisible();

    // add text
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'Add text' }).click();
    await expect(page.getByLabel('block-item-Markdown.Void-general-list').first()).toBeVisible();
  });

  test('add item actions', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyListBlock).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await page.getByLabel('schema-initializer-ActionBar-ListItemActionInitializers-general').first().hover();
    await page.getByRole('menuitem', { name: 'View' }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();

    await expect(page.getByRole('menuitem', { name: 'View' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Edit' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Delete' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-View-view-general-list').first()).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Edit-update-general-list').first()).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Delete-destroy-general-list').first()).toBeVisible();

    // delete buttons
    await page.getByLabel('schema-initializer-ActionBar-ListItemActionInitializers-general').first().hover();
    await page.getByRole('menuitem', { name: 'View' }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();

    await expect(page.getByRole('menuitem', { name: 'View' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Edit' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Delete' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-View-view-general-list').first()).not.toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Edit-update-general-list').first()).not.toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Delete-destroy-general-list').first()).not.toBeVisible();
  });

  test('add custom action buttons', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyListBlock).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await page.getByLabel('schema-initializer-ActionBar-ListItemActionInitializers-general').first().hover();
    await page.getByRole('menuitem', { name: 'Customize' }).hover();
    await page.getByRole('menuitem', { name: 'Popup' }).click();
    await page.getByRole('menuitem', { name: 'Update record' }).click();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-Popup-customize:popup-general-list').first()).toBeVisible();
    await expect(
      page.getByLabel('action-Action.Link-Update record-customize:update-general-list').first(),
    ).toBeVisible();
  });
});

test.describe('Grid Card', () => {
  test('add actions', async ({ page, mockPage }) => {
    await mockPage(oneEmptyGridCardBlock).goto();

    await page.getByLabel('schema-initializer-ActionBar-GridCardActionInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Filter' }).click();
    await page.getByRole('menuitem', { name: 'Add new' }).click();
    await page.getByRole('menuitem', { name: 'Refresh' }).click();

    await expect(page.getByRole('menuitem', { name: 'Filter' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Refresh' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Filter' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add new' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible();

    // delete buttons
    await page.getByLabel('schema-initializer-ActionBar-GridCardActionInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Filter' }).click();
    await page.getByRole('menuitem', { name: 'Add new' }).click();
    await page.getByRole('menuitem', { name: 'Refresh' }).click();

    await expect(page.getByRole('menuitem', { name: 'Filter' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Refresh' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Filter' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Add new' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Refresh' })).not.toBeVisible();
  });

  test('add item fields', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyGridCardBlock).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    const formItemInitializer = page
      .getByLabel('schema-initializer-Grid-ReadPrettyFormItemInitializers-general')
      .first();

    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'ID' }).click();
    await expect(page.getByRole('menuitem', { name: 'ID' }).getByRole('switch')).toBeChecked();

    // add association fields
    await page.mouse.wheel(0, 300);
    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-grid-card-general.id-ID').first()).toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-general-grid-card-general.manyToOne.nickname').first(),
    ).toBeVisible();

    // delete fields
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'ID' }).click();
    await expect(page.getByRole('menuitem', { name: 'ID' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.wheel(0, 300);
    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(
      page.getByLabel('block-item-CollectionField-general-grid-card-general.id-ID').first(),
    ).not.toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-general-grid-card-general.manyToOne.nickname').first(),
    ).not.toBeVisible();

    // add text
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'ID' }).hover();
    await page.mouse.wheel(0, 300);
    await page.getByRole('menuitem', { name: 'Add text' }).click();

    await expect(page.getByLabel('block-item-Markdown.Void-general-grid-card').first()).toBeVisible();
  });

  test.pgOnly('add inherit fields', async ({ page, mockPage }) => {});

  test('add item actions', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyGridCardBlock).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await page.getByLabel('schema-initializer-ActionBar-GridCardItemActionInitializers-general').first().hover();
    await page.getByRole('menuitem', { name: 'View' }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();

    await expect(page.getByRole('menuitem', { name: 'View' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Edit' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Delete' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-View-view-general-grid-card').first()).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Edit-update-general-grid-card').first()).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Delete-destroy-general-grid-card').first()).toBeVisible();

    // delete buttons
    await page.getByLabel('schema-initializer-ActionBar-GridCardItemActionInitializers-general').first().hover();
    await page.getByRole('menuitem', { name: 'View' }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();

    await expect(page.getByRole('menuitem', { name: 'View' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Edit' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Delete' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-View-view-general-grid-card').first()).not.toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Edit-update-general-grid-card').first()).not.toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Delete-destroy-general-grid-card').first()).not.toBeVisible();
  });

  test('add item custom action buttons', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyGridCardBlock).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await page.getByLabel('schema-initializer-ActionBar-GridCardItemActionInitializers-general').first().hover();
    await page.getByRole('menuitem', { name: 'Customize' }).hover();
    await page.getByRole('menuitem', { name: 'Popup' }).click();
    await page.getByRole('menuitem', { name: 'Update record' }).click();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-Popup-customize:popup-general-grid-card').first()).toBeVisible();
    await expect(
      page.getByLabel('action-Action.Link-Update record-customize:update-general-grid-card').first(),
    ).toBeVisible();
  });
});

test.describe('Filter Form Block', () => {
  test('add fields', async ({ page, mockPage }) => {
    await mockPage(oneEmptyFilterFormBlock).goto();

    const formItemInitializer = page.getByLabel('schema-initializer-Grid-FilterFormItemInitializers-general');

    // add fields
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'ID' }).click();
    await expect(page.getByRole('menuitem', { name: 'ID' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-filter-form-general.id-ID')).toBeVisible();

    // delete fields
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'ID' }).click();
    await expect(page.getByRole('menuitem', { name: 'ID' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-filter-form-general.id-ID')).not.toBeVisible();

    // add association fields
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(
      page.getByLabel('block-item-CollectionField-general-filter-form-general.manyToOne.nickname'),
    ).toBeVisible();

    // delete association fields
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();

    await page.getByRole('menuitem', { name: 'Many to one' }).nth(1).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(
      page.getByLabel('block-item-CollectionField-general-filter-form-general.manyToOne.nickname'),
    ).not.toBeVisible();

    // add text
    await formItemInitializer.hover();
    await page.getByRole('menuitem', { name: 'Add text' }).click();

    await expect(page.getByLabel('block-item-Markdown.Void-general-filter-form')).toBeVisible();
  });

  test.pgOnly('add inherit fields', async ({ page, mockPage }) => {});

  test('add action buttons', async ({ page, mockPage }) => {
    await mockPage(oneEmptyFilterFormBlock).goto();

    await page.getByLabel('schema-initializer-ActionBar-FilterFormActionInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Filter' }).click();
    await page.getByRole('menuitem', { name: 'Reset' }).click();

    await expect(page.getByRole('menuitem', { name: 'Filter' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Reset' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action-Filter-submit-general-filter-form')).toBeVisible();
    await expect(page.getByLabel('action-Action-Reset-general-filter-form')).toBeVisible();

    // delete buttons
    await page.getByLabel('schema-initializer-ActionBar-FilterFormActionInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Filter' }).click();
    await page.getByRole('menuitem', { name: 'Reset' }).click();

    await expect(page.getByRole('menuitem', { name: 'Filter' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Reset' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action-Filter-submit-general-filter-form')).not.toBeVisible();
    await expect(page.getByLabel('action-Action-Reset-general-filter-form')).not.toBeVisible();
  });
});

test.describe('Filter Collapse', () => {
  test('add fields', async ({ page, mockPage }) => {
    await mockPage(oneEmptyFilterCollapseBlock).goto();

    // add fields
    await page
      .getByLabel('schema-initializer-AssociationFilter-AssociationFilter.FilterBlockInitializer-general')
      .hover();
    await page.getByRole('menuitem', { name: 'Created by' }).click();
    await page.getByRole('menuitem', { name: 'Single select' }).click();

    await expect(page.getByRole('menuitem', { name: 'Created by' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Single select' }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Created by' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Single select' })).toBeVisible();

    // delete fields
    await page
      .getByLabel('schema-initializer-AssociationFilter-AssociationFilter.FilterBlockInitializer-general')
      .hover();
    await page.getByRole('menuitem', { name: 'Created by' }).click();
    await page.getByRole('menuitem', { name: 'Single select' }).click();

    await expect(page.getByRole('menuitem', { name: 'Created by' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Single select' }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Created by' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Single select' })).not.toBeVisible();
  });
});

test.describe('Actions with dialog', () => {
  test('add new', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTableBlockWithActions).goto();

    // open dialog
    await page.getByLabel('action-Action-Add new-create-general-table').click();

    // add a tab
    await page.getByLabel('schema-initializer-Tabs-TabPaneInitializersForCreateFormBlock-general').click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('test123');
    await page.getByLabel('action-Action-Submit-general-table').click();

    await expect(page.getByText('test123')).toBeVisible();

    // add blocks
    await page.getByLabel('schema-initializer-Grid-CreateFormBlockInitializers-general').hover();
    await page.getByText('Form').click();
    await page.getByText('Markdown').click();

    await expect(page.getByLabel('block-item-CardItem-general-form')).toBeVisible();
    await expect(page.getByLabel('block-item-Markdown.Void-general-markdown')).toBeVisible();
  });

  test('add record', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTableBlockWithActions).goto();

    // open dialog
    await page.getByLabel('action-Action-Add record-customize:create-general-table').click();

    // add a tab
    await page.getByLabel('schema-initializer-Tabs-TabPaneInitializersForCreateFormBlock-general').click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('test7');
    await page.getByLabel('action-Action-Submit-general-table').click();

    await expect(page.getByText('test7')).toBeVisible();

    // add blocks
    await page.getByLabel('schema-initializer-Grid-CusomeizeCreateFormBlockInitializers-general').hover();
    await page.getByText('Form').hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();
    await page.getByRole('menuitem', { name: 'Markdown' }).click();

    await expect(page.getByLabel('block-item-CardItem-users-form')).toBeVisible();
    await expect(page.getByLabel('block-item-Markdown.Void-general-markdown')).toBeVisible();
  });

  test('view & edit & popup', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    // open dialog
    await page.getByLabel('action-Action.Link-View-view-general-table-0').click();

    // add a tab
    await page.getByLabel('schema-initializer-Tabs-TabPaneInitializers-general').click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('test8');
    await page.getByLabel('action-Action-Submit-general-table-0').click();

    await expect(page.getByText('test8')).toBeVisible();

    // add blocks
    await page.getByLabel('schema-initializer-Grid-RecordBlockInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Details' }).click();
    await page.getByText('Form').click();
    await page.getByRole('menuitem', { name: 'Markdown' }).click();

    await expect(page.getByText('GeneralConfigure actionsConfigure fields')).toBeVisible();
    await expect(page.getByText('GeneralConfigure fieldsConfigure actions')).toBeVisible();
    await expect(page.getByLabel('block-item-Markdown.Void-general-markdown')).toBeVisible();

    // 删除已创建的 blocks，腾出页面空间
    // delete details block
    await page.getByText('GeneralConfigure actionsConfigure fields').hover();
    await page.getByLabel('designer-schema-settings-CardItem-FormV2.ReadPrettyDesigner-general').hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK' }).click();
    // delete form block
    await page.getByLabel('block-item-CardItem-general-form').hover();
    await page.getByLabel('designer-schema-settings-CardItem-FormV2.Designer-general').hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK' }).click();
    // delete markdown block
    await page.getByLabel('block-item-Markdown.Void-general-markdown').hover();
    await page.getByLabel('designer-schema-settings-Markdown.Void-Markdown.Void.Designer-general').hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK' }).click();

    // add relationship blocks
    await page.getByLabel('schema-initializer-Grid-RecordBlockInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Many to one' }).hover();
    await page.getByRole('menuitem', { name: 'Details' }).click();

    await page.mouse.move(300, 0);

    await page.getByLabel('schema-initializer-Grid-RecordBlockInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'One to many' }).hover();

    // 下拉列表中，可选择以下区块进行创建
    await expect(page.getByText('Table')).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Details' }).nth(1)).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'List' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Grid Card' })).toBeVisible();
    await expect(page.getByText('Form').nth(1)).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Calendar' })).toBeVisible();

    await page.getByText('Table').click();
    await expect(page.getByLabel('block-item-CardItem-users-table')).toBeVisible();
  });

  test('bulk edit', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTableBlockWithCustomizeActions).goto();

    // open dialog
    await page.getByLabel('action-Action-Bulk edit-customize:bulkEdit-general-table').click();
    await page.getByLabel('schema-initializer-Tabs-TabPaneInitializersForBulkEditFormBlock-general').click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('test1');
    await page.getByLabel('action-Action-Submit-general-table').click();

    await expect(page.getByText('test1')).toBeVisible();

    // add blocks
    await page.getByLabel('schema-initializer-Grid-CreateFormBulkEditBlockInitializers-general').hover();
    await page.getByText('Form').click();
    await page.getByRole('menuitem', { name: 'Markdown' }).click();

    await expect(page.getByLabel('block-item-CardItem-general-form')).toBeVisible();
    await expect(page.getByLabel('block-item-Markdown.Void-general-markdown')).toBeVisible();
  });
});

test.describe('association fields with dialog', () => {
  test('data selector', async ({ page, mockPage }) => {
    await mockPage(oneFormBlockWithRolesFieldBasedUsers).goto();

    // open dialog
    await page.getByTestId('select-data-picker').click();

    // add blocks
    await page.getByLabel('schema-initializer-Grid-TableSelectorInitializers-roles').hover();
    await page.getByRole('menuitem', { name: 'form Table' }).click();

    // 筛选区块这里应该是可以直接点击的，不应该有二级菜单
    await page.getByText('Form').click();
    await page.getByRole('menuitem', { name: 'Collapse' }).click();

    await page.getByRole('menuitem', { name: 'Add text' }).click();

    await expect(page.getByLabel('block-item-CardItem-roles-table-selector')).toBeVisible();
    await expect(page.getByLabel('block-item-CardItem-roles-filter-form')).toBeVisible();

    // 向下滚动一点距离，使得下方的区块可见
    await page.getByLabel('block-item-CardItem-roles-table-selector').hover();
    await page.mouse.wheel(0, 500);

    await expect(page.getByLabel('block-item-CardItem-roles-filter-collapse')).toBeVisible();
    await expect(page.getByLabel('block-item-Markdown.Void-roles-form')).toBeVisible();
  });

  test('click association link to view', async ({ page, mockPage }) => {});
});
