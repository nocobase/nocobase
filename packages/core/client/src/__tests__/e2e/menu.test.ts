import { enableToConfig, expect, test } from '@nocobase/test/client';

test.describe('menu', () => {
  test('create new page, then delete', async ({ page }) => {
    await page.goto('/');
    await enableToConfig(page);

    await page.getByTestId('add-menu-item-button-in-header').hover();
    await page.getByRole('menuitem', { name: 'Page' }).click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('new page');
    await page.getByRole('button', { name: 'OK' }).click();
    await page.getByText('new page').click();

    await expect(page.getByTestId('add-block-button-in-page')).toBeVisible();

    // 删除页面，避免影响其他测试
    await page.getByRole('menu').getByText('new page').hover();
    await page.getByTestId('designer-schema-settings').hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK' }).click();
  });
});
