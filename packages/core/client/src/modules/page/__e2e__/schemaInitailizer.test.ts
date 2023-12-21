import { expect, tabPageEmpty, test } from '@nocobase/test/e2e';

test('add tab', async ({ page, mockPage }) => {
  await mockPage(tabPageEmpty).goto();

  // add tab page
  await page.getByLabel('schema-initializer-Page-tabs').click();
  await page.getByRole('textbox').click();
  await page.getByRole('textbox').fill('tab1');
  await page.getByRole('button', { name: 'OK', exact: true }).click();

  await expect(page.getByText('tab1', { exact: true })).toBeVisible();
});
