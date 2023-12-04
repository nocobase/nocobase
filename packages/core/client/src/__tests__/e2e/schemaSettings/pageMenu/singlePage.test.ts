import { test } from '@nocobase/test/client';
import { expectOptions } from '../expectOptions';

test.describe('single page menu', () => {
  test('options', async ({ page, mockPage }) => {
    await mockPage({ name: 'single page' }).goto();

    await expectOptions({
      page,
      showMenu: async () => {
        await page.locator('.ant-layout-header').getByText('single page', { exact: true }).hover();
        await page.getByRole('button', { name: 'designer-schema-settings-' }).hover();
      },
      supportedOptions: ['Edit', 'Move to', 'Insert before', 'Insert after', 'Delete'],
    });
  });
});
