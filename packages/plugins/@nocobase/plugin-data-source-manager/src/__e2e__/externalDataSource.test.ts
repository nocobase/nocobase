import { expect, test } from '@nocobase/test/e2e';
import { uid } from '@nocobase/utils';

test('add data source', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('plugin-settings-button').click();
  await page.getByRole('link', { name: 'Data sources' }).click();
  await expect(page.getByText('main', { exact: true })).toBeVisible();
});

test.describe('configure data source', () => {
  test('external data source collection configure', async ({ page }) => {});
  test('synchronize(refresh) external data source collection', async ({ page }) => {});
});
