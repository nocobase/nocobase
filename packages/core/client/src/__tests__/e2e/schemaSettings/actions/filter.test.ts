import { Page, oneEmptyTableBlockWithActions, test } from '@nocobase/test/client';
import { expectOptions } from './expectOptions';

test.describe('filter', () => {
  const showMenu = async (page: Page) => {
    await page.getByRole('button', { name: 'Filter' }).hover();
    await page.getByLabel('designer-schema-settings-Filter.Action-Filter.Action.Designer-general').hover();
  };

  test('supported options', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneEmptyTableBlockWithActions).goto();

    await expectOptions({
      page,
      showMenu: () => showMenu(page),
      enableOptions: [
        'Edit button',
        'Delete',
        'Many to one',
        'One to many',
        'Single select',
        'ID',
        'Created at',
        'Last updated at',
        'Created by',
        'Last updated by',
      ],
    });
  });
});
