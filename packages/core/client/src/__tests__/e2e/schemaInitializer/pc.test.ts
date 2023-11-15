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
    await page.getByText(name, { exact: true }).first().hover();
  } else if (name === 'Filter form') {
    await page.getByText(name, { exact: true }).nth(1).hover();
  } else {
    await page.getByText(name, { exact: true }).hover();
  }

  await page.getByLabel('dataBlocks-table-Users').click();
};

test.describe('Menu', () => {
  test('header', async ({ page, deletePage }) => {
    await page.goto('/');

    // add group
    await page.getByLabel('schema-initializer-Menu-header').hover();
    await page.getByLabel('Group', { exact: true }).click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('page group');
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByLabel('page group', { exact: true })).toBeVisible();

    // add page
    await page.getByLabel('schema-initializer-Menu-header').hover();
    await page.getByLabel('Page', { exact: true }).click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('page item');
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByLabel('page item', { exact: true })).toBeVisible();

    // add link
    await page.getByLabel('schema-initializer-Menu-header').hover();
    await page.getByLabel('Link', { exact: true }).click();
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
    await page.getByLabel('schema-initializer-Menu-side').click();
    await page.getByLabel('Group', { exact: true }).click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('page group side');
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByText('page group side', { exact: true })).toBeVisible();

    // add page in side
    await page.getByLabel('schema-initializer-Menu-side').click();
    await page.getByLabel('Page', { exact: true }).click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('page item side');
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByText('page item side', { exact: true })).toBeVisible();

    // add link in side
    await page.getByLabel('schema-initializer-Menu-side').click();
    await page.getByLabel('Link', { exact: true }).click();
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
    await page.getByRole('button', { name: 'Add tab' }).click();
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
    await createBlock(page, 'Detail');
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

    // actions column -------------------------------------------------------------
    // 1. 点击开关，可以开启和关闭 Actions column
    // 2. 点击开关之后，如果不移出鼠标，下拉框不应该关闭
    await expect(page.getByText('Actions', { exact: true })).toBeVisible();
    await configureColumnButton.hover();
    await expect(page.getByRole('menuitem', { name: 'Actions column', exact: true }).getByRole('switch')).toBeChecked();
    await page.getByRole('menuitem', { name: 'Action column', exact: true }).click();
    await expect(
      page.getByRole('menuitem', { name: 'Actions column', exact: true }).getByRole('switch'),
    ).not.toBeChecked();

    // 移动鼠标关闭下拉框
    await page.mouse.move(300, 0);
    await expect(page.getByText('Actions', { exact: true })).not.toBeVisible();

    // 再次开启 Actions column
    await configureColumnButton.hover();
    await page.getByRole('menuitem', { name: 'Action column', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'Actions column', exact: true }).getByRole('switch')).toBeChecked();
    await page.mouse.move(300, 0);
    await expect(page.getByText('Actions', { exact: true })).toBeVisible();

    // collection fields -------------------------------------------------------------
    await configureColumnButton.hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await page.getByRole('menuitem', { name: 'One to one (belongs to)', exact: true }).first().click();
    await page.getByRole('menuitem', { name: 'One to one (has one)', exact: true }).first().click();
    await page.getByRole('menuitem', { name: 'Many to one', exact: true }).first().click();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch')).toBeChecked();
    await expect(
      page.getByRole('menuitem', { name: 'One to one (belongs to)', exact: true }).getByRole('switch'),
    ).toBeChecked();
    await expect(
      page.getByRole('menuitem', { name: 'One to one (has one)', exact: true }).getByRole('switch'),
    ).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Many to one', exact: true }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('button', { name: 'ID', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'One to one (belongs to)', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'One to one (has one)', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Many to one', exact: true })).toBeVisible();

    // 点击开关，删除创建的字段
    await configureColumnButton.hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await page.getByRole('menuitem', { name: 'One to one (belongs to)', exact: true }).first().click();
    await page.getByRole('menuitem', { name: 'One to one (has one)', exact: true }).first().click();
    await page.getByRole('menuitem', { name: 'Many to one', exact: true }).first().click();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch')).not.toBeChecked();
    await expect(
      page.getByRole('menuitem', { name: 'One to one (belongs to)', exact: true }).getByRole('switch'),
    ).not.toBeChecked();
    await expect(
      page.getByRole('menuitem', { name: 'One to one (has one)', exact: true }).getByRole('switch'),
    ).not.toBeChecked();
    await expect(
      page.getByRole('menuitem', { name: 'Many to one', exact: true }).getByRole('switch'),
    ).not.toBeChecked();
    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'ID', exact: true })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'One to one (belongs to)', exact: true })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'One to one (has one)', exact: true })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Many to one', exact: true })).not.toBeVisible();

    // association fields -------------------------------------------------------------
    await configureColumnButton.hover();
    await page.getByRole('menuitem', { name: 'One to one (belongs to)', exact: true }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Nickname', exact: true })).toBeVisible();

    // 开关应该是开启状态
    await configureColumnButton.hover();
    await page.getByRole('menuitem', { name: 'One to one (belongs to)', exact: true }).nth(1).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname', exact: true }).getByRole('switch')).toBeChecked();

    // 点击开关，删除创建的字段
    await page.getByRole('menuitem', { name: 'Nickname', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Nickname', exact: true })).not.toBeVisible();
    // 开关应该是关闭状态
    await configureColumnButton.hover();
    await page.getByRole('menuitem', { name: 'One to one (belongs to)', exact: true }).nth(1).hover();
    await expect(page.getByRole('menuitem', { name: 'Nickname', exact: true }).getByRole('switch')).not.toBeChecked();
  });

  // TODO: 继承表相关测试
  test.pgOnly('inherit column', async ({ page, mockPage }) => {});

  test('add column action buttons', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTable).goto();

    // add view & Edit & Delete & Duplicate ------------------------------------------------------------
    await page.getByLabel('schema-initializer-TableV2-TableColumnInitializers-users').hover();
    await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-users').hover();
    await page.getByRole('menuitem', { name: 'View', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Duplicate', exact: true }).click();

    await expect(page.getByRole('menuitem', { name: 'View', exact: true }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Edit', exact: true }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Delete', exact: true }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Duplicate', exact: true }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-View-view-users-table-0')).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Edit-update-users-table-0')).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Delete-delete-users-table-0')).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Duplicate-duplicate-users-table-0')).toBeVisible();

    // delete view & Edit & Delete & Duplicate ------------------------------------------------------------
    await page.getByLabel('schema-initializer-TableV2-TableColumnInitializers-users').hover();
    await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-users').hover();
    await page.getByRole('menuitem', { name: 'View', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Duplicate', exact: true }).click();

    await expect(page.getByRole('menuitem', { name: 'View', exact: true }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Edit', exact: true }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Delete', exact: true }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Duplicate', exact: true }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-View-view-users-table-0')).not.toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Edit-update-users-table-0')).not.toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Delete-delete-users-table-0')).not.toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Duplicate-duplicate-users-table-0')).not.toBeVisible();

    // add custom action ------------------------------------------------------------
    await page.getByLabel('schema-initializer-TableV2-TableColumnInitializers-users').hover();
    await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-users').hover();
    await page.getByRole('menuitem', { name: 'Customize', exact: true }).hover();

    await page.getByRole('menuitem', { name: 'Popup', exact: true }).click();
    // 此时二级菜单，不应该关闭，可以继续点击？
    await page.getByRole('menuitem', { name: 'Update record', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Custom request', exact: true }).click();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-Popup-customize:popup-users-table-0')).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Update record-customize:update-users-table-0')).toBeVisible();
    await expect(
      page.getByLabel('action-CustomRequestAction-Custom request-customize:table:request-users-table-0'),
    ).toBeVisible();
  });

  test('adjust column width', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTable).goto();

    // 列宽度默认为 200
    await expect(page.getByRole('columnheader', { name: 'Actions', exact: true })).toHaveJSProperty('offsetWidth', 200);

    await page.getByLabel('schema-initializer-TableV2-TableColumnInitializers-users').hover();
    await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-users').hover();
    await page.getByRole('menuitem', { name: 'Column width', exact: true }).click();

    await expect(page.getByRole('dialog').getByText('Column width')).toBeVisible();

    await page.getByRole('dialog').getByRole('spinbutton').click();
    await page.getByRole('dialog').getByRole('spinbutton').fill('400');
    await page.getByRole('button', { name: 'OK' }).click();

    await expect(page.getByRole('columnheader', { name: 'Actions', exact: true })).toHaveJSProperty('offsetWidth', 400);
  });

  test('add action buttons', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTable).goto();

    // add buttons
    await page.getByLabel('schema-initializer-ActionBar-TableActionInitializers-users').hover();
    await page.getByRole('menuitem', { name: 'Filter', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Add new', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Refresh', exact: true }).click();

    await expect(page.getByRole('menuitem', { name: 'Filter', exact: true }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Add new', exact: true }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Delete', exact: true }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Refresh', exact: true }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Filter' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add new' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible();

    // delete buttons
    await page.getByLabel('schema-initializer-ActionBar-TableActionInitializers-users').hover();
    await page.getByRole('menuitem', { name: 'Filter', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Add new', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Refresh', exact: true }).click();

    await expect(page.getByRole('menuitem', { name: 'Filter', exact: true }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Add new', exact: true }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Delete', exact: true }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Refresh', exact: true }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Filter' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Add new' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Refresh' })).not.toBeVisible();
  });

  test('add custom action buttons', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTable).goto();

    await page.getByLabel('schema-initializer-ActionBar-TableActionInitializers-users').hover();
    await page.getByRole('menuitem', { name: 'Customize' }).hover();
    await page.getByRole('menuitem', { name: 'Bulk update', exact: true }).click();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Bulk update' })).toBeVisible();
  });
});

test.describe('Form', () => {
  test('add fields', async ({ page, mockPage }) => {
    await mockPage(oneEmptyForm).goto();

    await page.getByLabel('schema-initializer-Grid-FormItemInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch')).toBeChecked();

    // add association fields
    await page.getByRole('menuitem', { name: 'Many to one', exact: true }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'Nickname', exact: true }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.id-ID')).toBeVisible();
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.manyToOne.nickname')).toBeVisible();

    // delete fields
    await page.getByLabel('schema-initializer-Grid-FormItemInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch')).not.toBeChecked();

    await page.getByRole('menuitem', { name: 'Many to one', exact: true }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'Nickname', exact: true }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.id-ID')).not.toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-general-form-general.manyToOne.nickname'),
    ).not.toBeVisible();

    // add text
    await page.getByLabel('schema-initializer-Grid-FormItemInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Text', exact: true }).click();
    await expect(page.getByLabel('block-item-Markdown.Void-general-form')).toBeVisible();
  });

  test.pgOnly('add inherit fields', async ({ page, mockPage }) => {});

  test('add action buttons', async ({ page, mockPage }) => {
    await mockPage(oneEmptyForm).goto();

    await page.getByLabel('schema-initializer-ActionBar-FormActionInitializers-general').hover();

    // add button
    await page.getByRole('menuitem', { name: 'Submit', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'Submit', exact: true }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();

    // delete button
    await page.getByLabel('schema-initializer-ActionBar-FormActionInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Submit', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'Submit', exact: true }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Submit' })).not.toBeVisible();
  });

  test('add custom action buttons', async ({ page, mockPage }) => {
    await mockPage(oneEmptyForm).goto();

    await page.getByLabel('schema-initializer-ActionBar-FormActionInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Customize', exact: true }).hover();
    await page.getByRole('menuitem', { name: 'Save record', exact: true }).click();

    await expect(page.getByRole('button', { name: 'Save record' })).toBeVisible();
  });
});

test.describe('Details block', () => {
  test('add fields', async ({ page, mockPage }) => {
    await mockPage(oneEmptyDetailsBlock).goto();

    // add fields
    await page.getByLabel('schema-initializer-Grid-ReadPrettyFormItemInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch')).toBeChecked();

    // add association fields
    await page.getByRole('menuitem', { name: 'Many to one', exact: true }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'Nickname', exact: true }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-details-general.id-ID')).toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-general-details-general.manyToOne.nickname'),
    ).toBeVisible();

    // delete fields
    await page.getByLabel('schema-initializer-Grid-ReadPrettyFormItemInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch')).not.toBeChecked();

    await page.getByRole('menuitem', { name: 'Many to one', exact: true }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'Nickname', exact: true }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-details-general.id-ID')).not.toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-general-details-general.manyToOne.nickname'),
    ).not.toBeVisible();

    // add text
    await page.getByLabel('schema-initializer-Grid-ReadPrettyFormItemInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Add text', exact: true }).click();
    await expect(page.getByLabel('block-item-Markdown.Void-general-details')).toBeVisible();
  });

  test('add action buttons', async ({ page, mockPage }) => {
    await mockPage(oneEmptyDetailsBlock).goto();

    await page.getByLabel('schema-initializer-ActionBar-DetailsActionInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Duplicate', exact: true }).click();

    await expect(page.getByRole('menuitem', { name: 'Edit', exact: true }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Delete', exact: true }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Duplicate', exact: true }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Duplicate' })).toBeVisible();

    // delete buttons
    await page.getByLabel('schema-initializer-ActionBar-DetailsActionInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Duplicate', exact: true }).click();

    await expect(page.getByRole('menuitem', { name: 'Edit', exact: true }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Delete', exact: true }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Duplicate', exact: true }).getByRole('switch')).not.toBeChecked();

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
    await page.getByRole('menuitem', { name: 'Filter', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Add new', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Refresh', exact: true }).click();

    await expect(page.getByRole('menuitem', { name: 'Filter', exact: true }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Add new', exact: true }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Refresh', exact: true }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Filter' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add new' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible();

    // delete buttons
    await page.getByLabel('schema-initializer-ActionBar-ListActionInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Filter', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Add new', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Refresh', exact: true }).click();

    await expect(page.getByRole('menuitem', { name: 'Filter', exact: true }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Add new', exact: true }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Refresh', exact: true }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Filter' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Add new' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Refresh' })).not.toBeVisible();
  });

  test('add fields', async ({ page, mockPage }) => {
    await mockPage(oneEmptyListBlock).goto();

    // add fields
    await page.getByLabel('schema-initializer-Grid-ReadPrettyFormItemInitializers-general').first().hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch')).toBeChecked();

    // add association fields
    await page.getByRole('menuitem', { name: 'Many to one', exact: true }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'Nickname', exact: true }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-list-general.id-ID').first()).toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-general-list-general.manyToOne.nickname').first(),
    ).toBeVisible();

    // delete fields
    await page.getByLabel('schema-initializer-Grid-ReadPrettyFormItemInitializers-general').first().hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch')).not.toBeChecked();

    await page.getByRole('menuitem', { name: 'Many to one', exact: true }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'Nickname', exact: true }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-list-general.id-ID').first()).not.toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-general-list-general.manyToOne.nickname').first(),
    ).not.toBeVisible();

    // add text
    await page.getByLabel('schema-initializer-Grid-ReadPrettyFormItemInitializers-general').first().hover();
    await page.getByRole('menuitem', { name: 'Add text', exact: true }).click();
    await expect(page.getByLabel('block-item-Markdown.Void-general-list').first()).toBeVisible();
  });

  test('add item actions', async ({ page, mockPage }) => {
    await mockPage(oneEmptyListBlock).goto();

    await page.getByLabel('schema-initializer-ActionBar-ListItemActionInitializers-general').first().hover();
    await page.getByRole('menuitem', { name: 'View', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();

    await expect(page.getByRole('menuitem', { name: 'View', exact: true }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Edit', exact: true }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Delete', exact: true }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-View-view-general-list').first()).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Edit-update-general-list').first()).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Delete-destroy-general-list').first()).toBeVisible();

    // delete buttons
    await page.getByLabel('schema-initializer-ActionBar-ListItemActionInitializers-general').first().hover();
    await page.getByRole('menuitem', { name: 'View', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();

    await expect(page.getByRole('menuitem', { name: 'View', exact: true }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Edit', exact: true }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Delete', exact: true }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-View-view-general-list').first()).not.toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Edit-update-general-list').first()).not.toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Delete-destroy-general-list').first()).not.toBeVisible();
  });

  test('add custom action buttons', async ({ page, mockPage }) => {
    await mockPage(oneEmptyListBlock).goto();

    await page.getByLabel('schema-initializer-ActionBar-ListItemActionInitializers-general').first().hover();
    await page.getByRole('menuitem', { name: 'Customize', exact: true }).hover();
    await page.getByRole('menuitem', { name: 'Popup', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Update record', exact: true }).click();

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
    await page.getByRole('menuitem', { name: 'Filter', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Add new', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Refresh', exact: true }).click();

    await expect(page.getByRole('menuitem', { name: 'Filter', exact: true }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Add new', exact: true }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Refresh', exact: true }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Filter' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add new' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible();

    // delete buttons
    await page.getByLabel('schema-initializer-ActionBar-GridCardActionInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Filter', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Add new', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Refresh', exact: true }).click();

    await expect(page.getByRole('menuitem', { name: 'Filter', exact: true }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Add new', exact: true }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Refresh', exact: true }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Filter' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Add new' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Refresh' })).not.toBeVisible();
  });

  test('add item fields', async ({ page, mockPage }) => {
    await mockPage(oneEmptyGridCardBlock).goto();

    await page.getByLabel('schema-initializer-Grid-ReadPrettyFormItemInitializers-general').first().hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch')).toBeChecked();

    // add association fields
    await page.mouse.wheel(0, 300);
    await page.getByRole('menuitem', { name: 'Many to one', exact: true }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'Nickname', exact: true }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-grid-card-general.id-ID').first()).toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-general-grid-card-general.manyToOne.nickname').first(),
    ).toBeVisible();

    // delete fields
    await page.getByLabel('schema-initializer-Grid-ReadPrettyFormItemInitializers-general').first().hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch')).not.toBeChecked();

    await page.mouse.wheel(0, 300);
    await page.getByRole('menuitem', { name: 'Many to one', exact: true }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'Nickname', exact: true }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(
      page.getByLabel('block-item-CollectionField-general-grid-card-general.id-ID').first(),
    ).not.toBeVisible();
    await expect(
      page.getByLabel('block-item-CollectionField-general-grid-card-general.manyToOne.nickname').first(),
    ).not.toBeVisible();

    // add text
    await page.getByLabel('schema-initializer-Grid-ReadPrettyFormItemInitializers-general').first().hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).hover();
    await page.mouse.wheel(0, 300);
    await page.getByRole('menuitem', { name: 'Add text', exact: true }).click();

    await expect(page.getByLabel('block-item-Markdown.Void-general-grid-card').first()).toBeVisible();
  });

  test.pgOnly('add inherit fields', async ({ page, mockPage }) => {});

  test('add item actions', async ({ page, mockPage }) => {
    await mockPage(oneEmptyGridCardBlock).goto();

    await page.getByLabel('schema-initializer-ActionBar-GridCardItemActionInitializers-general').first().hover();
    await page.getByRole('menuitem', { name: 'View', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();

    await expect(page.getByRole('menuitem', { name: 'View', exact: true }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Edit', exact: true }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Delete', exact: true }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-View-view-general-grid-card').first()).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Edit-update-general-grid-card').first()).toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Delete-destroy-general-grid-card').first()).toBeVisible();

    // delete buttons
    await page.getByLabel('schema-initializer-ActionBar-GridCardItemActionInitializers-general').first().hover();
    await page.getByRole('menuitem', { name: 'View', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();

    await expect(page.getByRole('menuitem', { name: 'View', exact: true }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Edit', exact: true }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Delete', exact: true }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action.Link-View-view-general-grid-card').first()).not.toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Edit-update-general-grid-card').first()).not.toBeVisible();
    await expect(page.getByLabel('action-Action.Link-Delete-destroy-general-grid-card').first()).not.toBeVisible();
  });

  test('add item custom action buttons', async ({ page, mockPage }) => {
    await mockPage(oneEmptyGridCardBlock).goto();

    await page.getByLabel('schema-initializer-ActionBar-GridCardItemActionInitializers-general').first().hover();
    await page.getByRole('menuitem', { name: 'Customize', exact: true }).hover();
    await page.getByRole('menuitem', { name: 'Popup', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Update record', exact: true }).click();

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

    // add fields
    await page.getByLabel('schema-initializer-Grid-FilterFormItemInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-filter-form-general.id-ID')).toBeVisible();

    // delete fields
    await page.getByLabel('schema-initializer-Grid-FilterFormItemInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'ID', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'ID', exact: true }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-general-filter-form-general.id-ID')).not.toBeVisible();

    // add association fields
    await page.getByLabel('schema-initializer-Grid-FilterFormItemInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Many to one', exact: true }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'Nickname', exact: true }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(
      page.getByLabel('block-item-CollectionField-general-filter-form-general.manyToOne.nickname'),
    ).toBeVisible();

    // delete association fields
    await page.getByLabel('schema-initializer-Grid-FilterFormItemInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Many to one', exact: true }).nth(1).hover();
    await page.getByRole('menuitem', { name: 'Nickname', exact: true }).click();
    await expect(page.getByRole('menuitem', { name: 'Nickname', exact: true }).getByRole('switch')).not.toBeChecked();

    await page.mouse.move(300, 0);
    await expect(
      page.getByLabel('block-item-CollectionField-general-filter-form-general.manyToOne.nickname'),
    ).not.toBeVisible();

    // add text
    await page.getByLabel('schema-initializer-Grid-FilterFormItemInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Add text', exact: true }).click();

    await expect(page.getByLabel('block-item-Markdown.Void-general-filter-form')).toBeVisible();
  });

  test.pgOnly('add inherit fields', async ({ page, mockPage }) => {});

  test('add action buttons', async ({ page, mockPage }) => {
    await mockPage(oneEmptyFilterFormBlock).goto();

    await page.getByLabel('schema-initializer-ActionBar-FilterFormActionInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Filter', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Reset', exact: true }).click();

    await expect(page.getByRole('menuitem', { name: 'Filter', exact: true }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Reset', exact: true }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByLabel('action-Action-Filter-submit-general-filter-form')).toBeVisible();
    await expect(page.getByLabel('action-Action-Reset-general-filter-form')).toBeVisible();

    // delete buttons
    await page.getByLabel('schema-initializer-ActionBar-FilterFormActionInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Filter', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Reset', exact: true }).click();

    await expect(page.getByRole('menuitem', { name: 'Filter', exact: true }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Reset', exact: true }).getByRole('switch')).not.toBeChecked();

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
    await page.getByRole('menuitem', { name: 'Created by', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Single select', exact: true }).click();

    await expect(page.getByRole('menuitem', { name: 'Created by', exact: true }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Single select', exact: true }).getByRole('switch')).toBeChecked();

    await page.mouse.move(300, 0);
    await expect(page.getByRole('button', { name: 'Created by' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Single select' })).toBeVisible();

    // delete fields
    await page
      .getByLabel('schema-initializer-AssociationFilter-AssociationFilter.FilterBlockInitializer-general')
      .hover();
    await page.getByRole('menuitem', { name: 'Created by', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Single select', exact: true }).click();

    await expect(page.getByRole('menuitem', { name: 'Created by', exact: true }).getByRole('switch')).not.toBeChecked();
    await expect(
      page.getByRole('menuitem', { name: 'Single select', exact: true }).getByRole('switch'),
    ).not.toBeChecked();

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
    await page.getByRole('menuitem', { name: 'Form', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Markdown', exact: true }).click();

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
    await page.getByRole('textbox').fill('test456');
    await page.getByLabel('action-Action-Submit-general-table').click();

    await expect(page.getByText('test456')).toBeVisible();

    // add blocks
    await page.getByLabel('schema-initializer-Grid-CusomeizeCreateFormBlockInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Form', exact: true }).hover();
    await page.getByRole('menuitem', { name: 'Users', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Markdown', exact: true }).click();

    await expect(page.getByLabel('block-item-CardItem-users-form')).toBeVisible();
    await expect(page.getByLabel('block-item-Markdown.Void-general-markdown')).toBeVisible();
  });

  test('view & edit & popup', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTableBlockWithActions).goto();

    // open dialog
    await page.getByLabel('action-Action.Link-View-view-general-table-0').click();

    // add a tab
    await page.getByLabel('schema-initializer-Tabs-TabPaneInitializers-general').click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('test7');
    await page.getByLabel('action-Action-Submit-general-table-0').click();

    await expect(page.getByText('test7')).toBeVisible();

    // add blocks
    await page.getByLabel('schema-initializer-Grid-RecordBlockInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Details', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Form', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Markdown', exact: true }).click();

    await expect(page.getByText('GeneralConfigure actionsConfigure fields')).toBeVisible();
    await expect(page.getByText('GeneralConfigure fieldsConfigure actions')).toBeVisible();
    await expect(page.getByLabel('block-item-Markdown.Void-general-markdown')).toBeVisible();

    // 删除已创建的 blocks，腾出页面空间
    // delete details block
    await page.getByText('GeneralConfigure actionsConfigure fields').hover();
    await page.getByLabel('designer-schema-settings-CardItem-FormV2.ReadPrettyDesigner-general').hover();
    await page.getByLabel('Delete', { exact: true }).click();
    await page.getByRole('button', { name: 'OK' }).click();
    // delete form block
    await page.getByLabel('block-item-CardItem-general-form').hover();
    await page.getByLabel('designer-schema-settings-CardItem-FormV2.Designer-general').hover();
    await page.getByLabel('Delete', { exact: true }).click();
    await page.getByRole('button', { name: 'OK' }).click();
    // delete markdown block
    await page.getByLabel('block-item-Markdown.Void-general-markdown').hover();
    await page.getByLabel('designer-schema-settings-Markdown.Void-Markdown.Void.Designer-general').hover();
    await page.getByLabel('Delete', { exact: true }).click();
    await page.getByRole('button', { name: 'OK' }).click();

    // add relationship blocks
    await page.getByLabel('schema-initializer-Grid-RecordBlockInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Many to one', exact: true }).hover();
    await page.getByRole('menuitem', { name: 'Details', exact: true }).click();

    await page.getByLabel('schema-initializer-Grid-RecordBlockInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'One to many', exact: true }).hover();

    // 下拉列表中，可选择以下区块进行创建
    await expect(page.getByRole('menuitem', { name: 'Table', exact: true })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Details', exact: true })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'List', exact: true })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Grid Card', exact: true })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Form', exact: true })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Calendar', exact: true })).toBeVisible();

    await page.getByRole('menuitem', { name: 'Table', exact: true }).click();
    await expect(page.getByLabel('block-item-CardItem-users-table')).toBeVisible();
  });

  test('bulk edit', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTableBlockWithCustomizeActions).goto();

    // open dialog
    await page.getByLabel('schema-initializer-Tabs-TabPaneInitializersForBulkEditFormBlock-general').click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('test1');
    await page.getByLabel('action-Action-Submit-general-table').click();

    await expect(page.getByText('test1')).toBeVisible();

    // add blocks
    await page.getByLabel('schema-initializer-Grid-CreateFormBulkEditBlockInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Form', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Markdown', exact: true }).click();

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
    await page.getByRole('menuitem', { name: 'Table', exact: true }).click();

    // TODO: 不应该有二级菜单
    await page.getByRole('menuitem', { name: 'Form', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Collapse', exact: true }).click();

    await page.getByRole('menuitem', { name: 'Add text', exact: true }).click();

    await expect(page.getByLabel('block-item-CardItem-roles-table-selector')).toBeVisible();
    await expect(page.getByLabel('block-item-CardItem-users-filter-form')).toBeVisible();

    // 向下滚动一点距离，使得下方的区块可见
    await page.getByLabel('block-item-CardItem-roles-table-selector').hover();
    await page.mouse.wheel(0, 500);

    await expect(page.getByLabel('block-item-CardItem-users-filter-collapse')).toBeVisible();
    await expect(page.getByLabel('block-item-Markdown.Void-roles-form')).toBeVisible();
  });

  test('click association link to view', async ({ page, mockPage }) => {});
});
