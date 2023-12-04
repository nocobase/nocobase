import { Page, oneEmptyTableWithTreeCollection, test } from '@nocobase/test/client';
import { expectOptions } from './expectOptions';

test.describe('add child', () => {
  const showMenu = async (page: Page) => {
    await page.getByLabel('action-Action.Link-Add child-create-treeCollection-table-0').hover();
    await page.getByLabel('designer-schema-settings-Action.Link-Action.Designer-tree').hover();
  };

  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyTableWithTreeCollection).waitForInit();
    await nocoPage.goto();

    // 添加一行数据
    // TODO: 使用 mockRecord 为 tree 表添加一行数据无效
    await page.getByLabel('schema-initializer-ActionBar-TableActionInitializers-treeCollection').hover();
    await page.getByRole('menuitem', { name: 'Add new' }).click();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel('schema-initializer-Grid-CreateFormBlockInitializers-treeCollection').hover();
    await page.getByRole('menuitem', { name: 'form Form' }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('schema-initializer-ActionBar-CreateFormActionInitializers-treeCollection').hover();
    await page.getByRole('menuitem', { name: 'Submit' }).click();
    await page.mouse.move(300, 0);
    await page.getByRole('button', { name: 'Submit' }).click();

    // 添加 add child 按钮
    await page.getByRole('button', { name: 'Actions' }).hover();
    await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-tree').hover();
    await page.getByRole('menuitem', { name: 'Add child' }).click();

    await expectOptions({
      page,
      showMenu: () => showMenu(page),
      enableOptions: ['Edit button', 'Linkage rules', 'Open mode', 'Popup size', 'Delete'],
    });
  });
});
