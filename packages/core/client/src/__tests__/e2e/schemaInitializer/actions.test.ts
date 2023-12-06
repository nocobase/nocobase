import {
  expect,
  oneEmptyTableBlockWithActions,
  oneEmptyTableBlockWithCustomizeActions,
  test,
} from '@nocobase/test/client';

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
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    // delete form block
    await page.getByLabel('block-item-CardItem-general-form').hover();
    await page.getByLabel('designer-schema-settings-CardItem-FormV2.Designer-general').hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    // delete markdown block
    await page.getByLabel('block-item-Markdown.Void-general-markdown').hover();
    await page.getByLabel('designer-schema-settings-Markdown.Void-Markdown.Void.Designer-general').hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

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
