import { expect, test } from '@nocobase/test/e2e';
import { uid } from '@nocobase/utils';

test.describe('add external data source', () => {
  test('pg external data source', async ({ page }) => {
    await page.getByTestId('plugin-settings-button').click();
    await page.getByRole('link', { name: 'Data sources' }).click();
    await page.getByRole('menuitem', { name: 'PostgreSQL' }).click();
    await page.getByLabel('Data source name').click();
    await page.getByLabel('Data source name').getByRole('textbox').fill('pg');
    await page.getByLabel('Data source display name').getByRole('textbox').fill('pg');
    await page.getByLabel('Database').getByRole('textbox').fill(`${process.env.DATABASE}_external_test`);
    await page.getByLabel('Username').getByRole('textbox').fill(`${process.env.USER}`);
    await page.locator('input[type="password"]').fill(`${process.env.PASSWORD}`);
    await page.getByLabel('action-Action-Submit-').click();
  });
});

test.describe('configure data source', () => {
  test('external data source collection configure', async ({ page }) => {});
  test('synchronize(refresh) external data source collection', async ({ page }) => {});
});
