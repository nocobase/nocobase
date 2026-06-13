import { expect, test } from '@nocobase/test/e2e';

test.describe('backups settings view', () => {
  test.beforeAll(async ({ page }) => {
    await page.goto('/admin/settings/backups/settings');
  });

  test('should be able to set backup interval', async ({ page }) => {
    await page.locator('.ant-checkbox-input').first().check();
    await page.locator('.ant-select-selector').first().click();
    await page.getByText('hour').click();
    await page.locator('input.ant-input-number-input').fill('20');
    await page.locator('.ant-checkbox-input').last().check();
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('Saved successfully')).toBeVisible();
  });
});
