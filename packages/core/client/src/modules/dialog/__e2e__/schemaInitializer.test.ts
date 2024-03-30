import {
  expect,
  oneDetailBlockWithM2oFieldToGeneral,
  oneEmptyTableBlockWithActions,
  oneEmptyTableBlockWithCustomizeActions,
  oneFormBlockWithRolesFieldBasedUsers,
  test,
} from '@nocobase/test/e2e';

test.describe('where to open a popup and what can be added to it', () => {
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
    await page.getByLabel('schema-initializer-Grid-popup:addNew:addBlock-general').hover();
    await page.getByText('Form').click();
    await page.getByText('Markdown').click();

    await page.mouse.move(300, 0);

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
    await page.getByLabel('schema-initializer-Grid-popup:addRecord:addBlock-general').hover();
    await page.getByText('Form').hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();

    // add Markdown
    await page.getByLabel('schema-initializer-Grid-popup:addRecord:addBlock-general').hover();
    await page.getByRole('menuitem', { name: 'Markdown' }).click();

    await expect(page.getByLabel('block-item-CardItem-users-form')).toBeVisible();
    await expect(page.getByLabel('block-item-Markdown.Void-general-markdown')).toBeVisible();
  });

  test('view', async ({ page, mockPage, mockRecord }) => {
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
    await addBlock(['table Details right', 'General']);
    await addBlock(['form Form (Edit)']);
    await addBlock(['Markdown']);

    await expect(page.getByText('GeneralConfigure actionsConfigure fields')).toBeVisible();
    await expect(page.getByText('GeneralConfigure fieldsConfigure actions')).toBeVisible();
    await expect(page.getByLabel('block-item-Markdown.Void-general-markdown')).toBeVisible();

    // 删除已创建的 blocks，腾出页面空间
    // delete details block
    await page.getByText('GeneralConfigure actionsConfigure fields').hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:details-general').hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    // delete form block
    await page.getByLabel('block-item-CardItem-general-form').hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:editForm-general').hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    // delete markdown block
    await page.getByLabel('block-item-Markdown.Void-general-markdown').hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-Markdown.Void-blockSettings:markdown-general' })
      .hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // add relationship blocks
    await addBlock(['table Details right', 'Many to one']);
    await expect(page.getByLabel('block-item-CardItem-users-')).toBeVisible();
    await addBlock(['table Table right', 'One to many']);
    await expect(page.getByLabel('block-item-CardItem-users-table')).toBeVisible();

    async function addBlock(names: string[]) {
      await page.getByLabel('schema-initializer-Grid-popup').hover();
      for (const name of names) {
        await page.getByRole('menuitem', { name }).click();
      }
      await page.mouse.move(300, 0);
    }
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
    await page.getByLabel('schema-initializer-Grid-popup:bulkEdit:addBlock-general').hover();
    await page.getByText('Form').click();
    await page.getByRole('menuitem', { name: 'Markdown' }).click();
    await page.mouse.move(300, 0);

    await expect(page.getByLabel('block-item-CardItem-general-form')).toBeVisible();
    await expect(page.getByLabel('block-item-Markdown.Void-general-markdown')).toBeVisible();
  });

  test('association link', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneDetailBlockWithM2oFieldToGeneral).waitForInit();
    const record = await mockRecord('targetToGeneral');
    await nocoPage.goto();

    // open dialog
    await page
      .getByLabel('block-item-CollectionField-targetToGeneral-details-targetToGeneral.toGeneral-toGeneral')
      .getByText(record.id, { exact: true })
      .click();

    // add a tab
    await page.getByLabel('schema-initializer-Tabs-TabPaneInitializers-general').click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('test8');
    await page.getByLabel('action-Action-Submit-general-details').click();

    await expect(page.getByText('test8')).toBeVisible();

    // add blocks
    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-general').hover();
    await page.getByRole('menuitem', { name: 'Details' }).hover();
    await page.getByRole('menuitem', { name: 'General' }).click();
    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-general').hover();
    await page.getByRole('menuitem', { name: 'form Form (Edit)' }).first().click();
    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-general').hover();
    await page.getByRole('menuitem', { name: 'Markdown' }).click();
    await page.mouse.move(300, 0);

    await expect(page.getByText('GeneralConfigure actionsConfigure fields')).toBeVisible();
    await expect(page.getByText('GeneralConfigure fieldsConfigure actions')).toBeVisible();
    await expect(page.getByLabel('block-item-Markdown.Void-general-markdown')).toBeVisible();

    // add relationship blocks
    // 下拉列表中，可选择以下区块进行创建
    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-general').hover();
    await expect(page.getByRole('menuitem', { name: 'table Details right' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'form Form (Edit)' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'form Form (Add new) right' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'form Form (Add new) right' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'table Table right' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'ordered-list List right' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'ordered-list Grid Card right' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Calendar' })).toBeVisible();

    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-general').hover();
    await page.getByRole('menuitem', { name: 'Details' }).hover();
    await page.getByRole('menuitem', { name: 'Many to one' }).click();
    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CardItem-users-')).toBeVisible();

    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-general').hover();
    await page.getByRole('menuitem', { name: 'table Table right' }).hover();
    await page.getByRole('menuitem', { name: 'One to many' }).click();
    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CardItem-users-table')).toBeVisible();
    // 屏幕上没有显示错误提示
    await expect(page.locator('.ant-notification-notice').first()).toBeHidden({ timeout: 1000 });
  });

  test('data picker', async ({ page, mockPage }) => {
    await mockPage(oneFormBlockWithRolesFieldBasedUsers).goto();

    // open dialog
    await page.getByTestId('select-data-picker').click();

    // add blocks
    await addBlock('form Table');
    await addBlock('form Form');
    await addBlock('Collapse');
    await addBlock('Add text');

    await expect(page.getByLabel('block-item-CardItem-roles-table-selector')).toBeVisible();
    await expect(page.getByLabel('block-item-CardItem-roles-filter-form')).toBeVisible();
    await expect(page.getByLabel('block-item-CardItem-roles-filter-collapse')).toBeVisible();
    await expect(page.getByLabel('block-item-Markdown.Void-roles-form')).toBeVisible();

    async function addBlock(name: string) {
      await page.getByLabel('schema-initializer-Grid-popup:tableSelector:addBlock-roles').hover();
      await page.getByRole('menuitem', { name }).click();
      await page.mouse.move(300, 0);
    }
  });
});
