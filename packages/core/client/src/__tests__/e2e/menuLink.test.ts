import { test, enableToConfig, expect } from '@nocobase/test/client';

test.describe('menu group', () => {
  test('create new menu group, then delete', async ({ page }) => {
    await page.goto('/');
    await enableToConfig(page);

    await page.getByTestId('title-item').getByRole('textbox').fill('link');
    await page.getByTestId('href-item').getByRole('textbox').click();
    await page.getByTestId('href-item').getByRole('textbox').fill('https://www.baidu.com/');
    await page.getByRole('button', { name: 'OK' }).click();
    const page2Promise = page.waitForEvent('popup');
    await page.getByText('link', { exact: true }).click();
    const page2 = await page2Promise;

    await expect(page2.getByRole('button', { name: '百度一下' })).toBeVisible();

    // 删除页面，避免影响其他测试
    await page.getByRole('menu').getByText('link').hover();
    await page.getByTestId('designer-schema-settings').hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK' }).click();
  });
});
