import { expect, test } from '@nocobase/test/e2e';

test.describe('desktop-mode', () => {
  test.beforeAll(async ({ page }) => {
    await page.goto('/m');
  });

  test('desktop should have back link to admin', async ({ page }) => {
    await page.getByRole('link', { name: 'Back' }).click();
    // 跳转到 /admin
    expect(page.url()).toContain('/admin');

    await page.goto('/m');
  })

  test('ui editor should work', async ({ page }) => {
    // 默认 designer 开启
    expect(page.getByLabel('schema-initializer-MobileTabBar')).toBeVisible();

    // 再次点击应该隐藏
    await page.getByTestId('ui-editor-button').click();
    expect(page.getByLabel('schema-initializer-MobileTabBar')).not.toBeVisible();

    await page.getByTestId('ui-editor-button').click();
    expect(page.getByLabel('schema-initializer-MobileTabBar')).toBeVisible();
  })

  test('change mobile size', async ({ page }) => {
    await page.getByTestId('desktop-mode-size-pad').click();
    expect(page.getByTestId('desktop-mode-resizable')).toHaveCSS('width', '768px');

    await page.getByTestId('desktop-mode-size-mobile').click();
    expect(page.getByTestId('desktop-mode-resizable')).toHaveCSS('width', '375px');
  });

  test('show qrcode', async ({ page }) => {
    expect(page.getByRole('button', { name: 'qrcode' })).toBeVisible();
    await page.getByRole('button', { name: 'qrcode' }).click();
    expect(page.getByRole('tooltip')).toBeVisible();
  })
});
