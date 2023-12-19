import { test } from '@nocobase/test/client';

test('switch role', async ({ page, mockPage }) => {
  await mockPage().goto();

  await page.getByTestId('user-center-button').hover();
  await page.getByRole('menuitem', { name: 'Switch role' }).click();
  await page.getByRole('option', { name: 'Member' }).click();
});
