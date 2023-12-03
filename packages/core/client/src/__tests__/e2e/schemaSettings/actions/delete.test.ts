import { Page, expect, oneEmptyTableBlockWithActions, test } from '@nocobase/test/client';
import { expectOptions } from './expectOptions';

test.describe('delete', () => {
  const showMenu = async (page: Page) => {
    await page.getByLabel('action-Action.Link-Delete-destroy-general-table-0').hover();
    await page.getByRole('button', { name: 'designer-schema-settings-Action.Link-Action.Designer-general' }).hover();
  };

  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await expectOptions({
      page,
      showMenu: () => showMenu(page),
      enableOptions: ['Edit button', 'Linkage rules', 'Delete'],
    });
  });

  test('edit button', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await showMenu(page);
    await page.getByRole('menuitem', { name: 'Edit button' }).click();
    await page.getByLabel('block-item-Input-general-Button title').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-general-Button title').getByRole('textbox').fill('Delete record');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await expect(page.getByLabel('action-Action.Link-Delete record-destroy-general-table-0')).toBeVisible();
  });
});
