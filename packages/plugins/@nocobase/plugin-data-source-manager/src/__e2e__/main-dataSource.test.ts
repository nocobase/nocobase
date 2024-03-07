import { expect, test } from '@nocobase/test/e2e';
import { uid } from '@nocobase/utils';

test('initializing main data source by default', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('plugin-settings-button').click();
  await page.getByRole('link', { name: 'Data sources' }).click();
  await expect(page.getByText('main', { exact: true })).toBeVisible();
});
