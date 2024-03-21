import { expect, test } from '@nocobase/test/e2e';

test.describe('auth', () => {
  // 重置登录状态
  test.use({
    storageState: {
      cookies: [],
      origins: [],
    },
  });

  test('register', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Create an account' }).click();
    await page.getByPlaceholder('Username').click();
    await page.getByPlaceholder('Username').fill('zidonghuaceshi');
    await page.getByPlaceholder('Password', { exact: true }).click();
    await page.getByPlaceholder('Password', { exact: true }).fill('zidonghuaceshi123');
    await page.getByPlaceholder('Confirm password').click();
    await page.getByPlaceholder('Confirm password').fill('zidonghuaceshi123');
    await page.getByRole('button', { name: 'Sign up' }).click();

    await expect(page.getByText('Sign up successfully, and automatically jump to the sign in page')).toBeVisible();

    // 用新账户登录
    await page.getByPlaceholder('Username/Email').click();
    await page.getByPlaceholder('Username/Email').fill('zidonghuaceshi');
    await page.getByPlaceholder('Password').click();
    await page.getByPlaceholder('Password').fill('zidonghuaceshi123');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await page.getByTestId('user-center-button').hover();
    await expect(page.getByText('zidonghuaceshi')).toBeVisible();
  });
});
