import { expect, test } from '@nocobase/test/e2e';
import { uid } from '@nocobase/utils';

test.describe('add external data source', () => {
  test('pg external data source', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('plugin-settings-button').click();
    await page.getByRole('link', { name: 'Data sources' }).click();
    await page.getByRole('button', { name: 'plus Add new down' }).click();
    await page.getByRole('menuitem', { name: 'PostgreSQL' }).click();
    await page.getByLabel('Data source name').click();
    await page.getByLabel('Data source name').getByRole('textbox').fill('pg');
    await page.getByLabel('Data source display name').getByRole('textbox').fill('pg');
    await page.getByLabel('Port').getByRole('textbox').fill(`${process.env.DB_PORT}`);
    await page.getByLabel('Database').getByRole('textbox').fill(`${process.env.DB_DATABASE}_external_test`);
    await page.getByLabel('Username').getByRole('textbox').fill(`${process.env.USER}`);
    await page.locator('input[type="password"]').fill(`${process.env.DB_PASSWORD}`);
    //测试连接
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('api/dataSources:testConnection')),
      page.getByLabel('action-Action-Test Connection').click(),
    ]);
    const response = await (await request.response()).json();
    expect(response).toMatchObject({
      data: {
        success: true,
      },
    });
    await page.getByLabel('action-Action-Submit-').click();
    await page.waitForTimeout(1000);
  });
});

test.describe('configure data source', () => {
  test('external data source collection configure', async ({ page }) => {});
  test('synchronize(refresh) external data source collection', async ({ page }) => {});
});
