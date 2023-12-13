import { Page, oneEmptyTableBlockWithActions, test } from '@nocobase/test/client';
import { expectOptions } from './expectOptions';

const addSomeCustomActions = async (page: Page) => {
  // 先删除掉之前的 actions
  await page.getByRole('button', { name: 'Actions' }).hover();
  await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-general').hover();
  await page.getByRole('menuitem', { name: 'View' }).click();
  await page.getByRole('menuitem', { name: 'Edit' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('menuitem', { name: 'Duplicate' }).click();

  // 再增加两个自定义的 actions
  await page.getByRole('menuitem', { name: 'Customize' }).hover();
  await page.getByRole('menuitem', { name: 'Popup' }).click();
  await page.getByRole('menuitem', { name: 'Update record' }).click();
};

test.describe('popup', () => {
  const showMenu = async (page: Page) => {
    await page.getByLabel('action-Action.Link-Popup-customize:popup-general-table-0').hover();
    await page.getByRole('button', { name: 'designer-schema-settings-Action.Link-Action.Designer-general' }).hover();
  };

  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();
    await addSomeCustomActions(page);

    await showMenu(page);
    await expectOptions({
      page,
      showMenu: () => showMenu(page),
      enableOptions: ['Edit button', 'Linkage rules', 'Open mode', 'Popup size', 'Delete'],
    });
  });
});
