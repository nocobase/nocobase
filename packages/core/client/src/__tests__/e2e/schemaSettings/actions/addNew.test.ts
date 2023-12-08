import { Page, expect, oneEmptyTableBlockWithActions, test } from '@nocobase/test/client';
import { expectOptions } from './expectOptions';

test.describe('add new', () => {
  const showMenu = async (page: Page) => {
    await page.getByRole('button', { name: 'Add new' }).hover();
    await page.getByRole('button', { name: 'designer-schema-settings-Action-Action.Designer-general' }).hover();
  };

  test('supported options', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneEmptyTableBlockWithActions).goto();

    await expectOptions({
      page,
      showMenu: () => showMenu(page),
      enableOptions: ['Edit button', 'Open mode', 'Popup size', 'Delete'],
    });
  });

  test('edit button', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneEmptyTableBlockWithActions).goto();

    await showMenu(page);
    await page.getByRole('menuitem', { name: 'Edit button' }).click();
    await page.getByLabel('block-item-Input-general-Button title').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-general-Button title').getByRole('textbox').fill('1234');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await expect(page.getByRole('button', { name: '1234' })).toBeVisible();
  });

  test('open mode', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneEmptyTableBlockWithActions).goto();
    await showMenu(page);

    // 默认是 drawer
    await expect(page.getByRole('menuitem', { name: 'Open mode' }).getByText('Drawer')).toBeVisible();

    // 切换为 dialog
    await page.getByRole('menuitem', { name: 'Open mode' }).click();
    await page.getByRole('option', { name: 'Dialog' }).click();

    await page.getByRole('button', { name: 'Add new' }).click();
    await expect(page.getByTestId('modal-Action.Container-general-Add record')).toBeVisible();
  });

  test('popup size', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneEmptyTableBlockWithActions).goto();

    await showMenu(page);
    // 默认值 middle
    await expect(page.getByRole('menuitem', { name: 'Popup size' }).getByText('Middle')).toBeVisible();

    // 切换为 small
    await page.getByRole('menuitem', { name: 'Popup size' }).click();
    await page.getByRole('option', { name: 'Small' }).click();

    await page.getByRole('button', { name: 'Add new' }).click();
    const drawerWidth =
      (await page.getByTestId('drawer-Action.Container-general-Add record').boundingBox())?.width || 0;
    expect(drawerWidth).toBeLessThanOrEqual(400);

    await page.getByLabel('drawer-Action.Container-general-Add record-mask').click();

    // 切换为 large
    await showMenu(page);
    await page.getByRole('menuitem', { name: 'Popup size' }).click();
    await page.getByRole('option', { name: 'Large' }).click();

    await page.getByRole('button', { name: 'Add new' }).click();
    const drawerWidth2 =
      (await page.getByTestId('drawer-Action.Container-general-Add record').boundingBox())?.width || 0;
    expect(drawerWidth2).toBeGreaterThanOrEqual(800);
  });

  test('delete', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneEmptyTableBlockWithActions).goto();

    await showMenu(page);
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.mouse.move(300, 0);
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await expect(page.getByRole('button', { name: 'Add new' })).toBeHidden();
  });
});
