import { oneEmptyFormWithActions, test } from '@nocobase/test/client';
import { expectOptions } from './expectOptions';

test.describe('save record', () => {
  test('supported options', async ({ page, mockPage }) => {
    await mockPage(oneEmptyFormWithActions).goto();

    await expectOptions({
      page,
      showMenu: async () => {
        await page.getByRole('button', { name: 'Save record' }).hover();
        await page.getByRole('button', { name: 'designer-schema-settings-Action-Action.Designer-users' }).hover();
      },
      enableOptions: [
        'Edit button',
        'Linkage rules',
        'Assign field values',
        'Skip required validation',
        'After successful submission',
        'Bind workflows',
        'Delete',
      ],
    });
  });
});
