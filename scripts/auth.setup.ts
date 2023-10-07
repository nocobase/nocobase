import { expect, test as setup } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

const adminFile = 'playwright/.auth/admin.json';

// 加载变量
if (!process.env.APP_BASE_URL) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.e2e') });
}

// 保存登录状态，避免每次都要登录
setup('admin', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Username/Email').click();
  await page.getByPlaceholder('Username/Email').fill('admin@nocobase.com');
  await page.getByPlaceholder('Password').click();
  await page.getByPlaceholder('Password').fill('admin123');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByTestId('user-center-button').getByText('Super Admin')).toBeVisible();

  // 保存登录状态
  await page.context().storageState({ path: adminFile });
});
