import { oneEmptyTableBlockWithActions, test } from '@nocobase/test/client';
import { expectOptions } from './expectOptions';

test.describe('refresh', () => {
  test('supported options', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTableBlockWithActions).goto();

    await expectOptions({
      page,
      showMenu: async () => {
        await page.getByRole('button', { name: 'Refresh' }).hover();
        await page.getByRole('button', { name: 'designer-schema-settings-Action-Action.Designer-general' }).hover();
      },
      enableOptions: ['Edit button', 'Delete'],
    });
  });
});
