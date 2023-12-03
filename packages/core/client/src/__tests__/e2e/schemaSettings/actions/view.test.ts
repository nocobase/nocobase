import { Page, oneEmptyTableBlockWithActions, test } from '@nocobase/test/client';
import { expectOptions } from './expectOptions';

test.describe('view', () => {
  const showMenu = async (page: Page) => {
    await page.getByLabel('action-Action.Link-View-view-general-table-0').hover();
    await page.getByRole('button', { name: 'designer-schema-settings-Action.Link-Action.Designer-general' }).hover();
  };

  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await expectOptions({
      page,
      showMenu: () => showMenu(page),
      enableOptions: ['Edit button', 'Linkage rules', 'Open mode', 'Popup size', 'Delete'],
    });
  });
});
