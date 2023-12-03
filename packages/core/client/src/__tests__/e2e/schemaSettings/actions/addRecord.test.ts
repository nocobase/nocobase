import { Page, oneEmptyTableBlockWithActions, test } from '@nocobase/test/client';
import { expectOptions } from './expectOptions';

test.describe('add record', () => {
  const showMenu = async (page: Page) => {
    await page.getByRole('button', { name: 'Add record' }).hover();
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
});
