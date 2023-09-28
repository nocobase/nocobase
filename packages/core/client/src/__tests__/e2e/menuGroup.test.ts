import { test, enableToConfig, expect } from '@nocobase/test/client';

test.describe('menu group', () => {
  test('create new menu group, then delete', async ({ page }) => {
    await page.goto('/');
    await enableToConfig(page);

    await page.getByTestId('add-menu-item-button-in-header').hover();
    await page.getByRole('menuitem', { name: 'Group' }).click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('menu Group');
    await page.getByRole('button', { name: 'OK' }).click();
    await page.getByText('menu Group').click();

    await expect(page.getByTestId('add-menu-item-button-in-side')).toBeVisible();

    // 删除页面，避免影响其他测试
    await page.getByRole('menu').getByText('menu Group').hover();
    await page.getByTestId('designer-schema-settings').hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK' }).click();
  });
});
