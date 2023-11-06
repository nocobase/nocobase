import { Page, expect, groupPageEmpty, schemaInitializerTable, tabPageEmpty, test } from '@nocobase/test/client';

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
  test('BlockInitializers: create block', async ({ page, mockPage }) => {
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
  test('TableColumnInitializers: add column', async ({ page, mockPage }) => {
    await mockPage(schemaInitializerTable).goto();
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

  test.pgOnly('TableColumnInitializers: inherit column', async ({ page, mockPage }) => {});
});
