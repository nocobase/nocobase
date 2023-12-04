import { test } from '@nocobase/test/client';
import { expectOptions } from '../expectOptions';

test.describe('link page menu', () => {
  test('options', async ({ page, mockPage }) => {
    await mockPage({ type: 'link', name: 'link page' }).goto();

    await expectOptions({
      page,
      showMenu: async () => {
        await page.locator('.ant-layout-header').getByText('link page', { exact: true }).hover();
        await page.getByRole('button', { name: 'designer-schema-settings-' }).hover();
      },
      supportedOptions: ['Edit', 'Move to', 'Insert before', 'Insert after', 'Delete'],
    });
  });
});
