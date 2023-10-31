import { enableToConfig, expect, test } from '@nocobase/test/client';

test.describe('menu', () => {
  test('create new page, then delete', async ({ page }) => {
    await page.goto('/');
    await enableToConfig(page);

    await page.getByLabel('schema-initializer-Menu-header').hover();
    await page.getByLabel('Page').click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('new page');
    await page.getByRole('button', { name: 'OK' }).click();
    await page.getByText('new page').click();

    await expect(page.getByLabel('schema-initializer-Grid-BlockInitializers')).toBeVisible();

    // 删除页面，避免影响其他测试
    await page.getByRole('menu').getByText('new page').hover();
    await page.getByLabel('designer-schema-settings-Menu.Item').hover();
    await page.getByLabel('Delete').click();
    await page.getByRole('button', { name: 'OK' }).click();
  });
});
