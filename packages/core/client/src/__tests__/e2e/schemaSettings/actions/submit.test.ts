import { oneEmptyFormWithActions, test } from '@nocobase/test/client';
import { expectOptions } from './expectOptions';

test.describe('submit', () => {
  test('supported options', async ({ page, mockPage }) => {
    await mockPage(oneEmptyFormWithActions).goto();

    await expectOptions({
      page,
      showMenu: async () => {
        await page.getByRole('button', { name: 'Submit' }).hover();
        await page.getByRole('button', { name: 'designer-schema-settings-Action-Action.Designer-users' }).hover();
      },
      enableOptions: ['Edit button', 'Linkage rules', 'Bind workflows', 'Delete'],
    });
  });
});
