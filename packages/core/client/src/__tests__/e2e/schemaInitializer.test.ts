import { expect, test } from '@nocobase/test/client';

test.describe('add menu item', () => {
  test('header', async ({ page }) => {
    // group
    await page.getByLabel('schema-initializer-Menu-header').hover();
    await page.getByLabel('Group', { exact: true }).click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('page group');
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByLabel('page group')).toBeVisible();

    // page
    await page.getByLabel('schema-initializer-Menu-header').hover();
    await page.getByLabel('Page', { exact: true }).click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('page item');
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByLabel('page item')).toBeVisible();

    // link
    await page.getByLabel('schema-initializer-Menu-header').hover();
    await page.getByLabel('Link', { exact: true }).click();
    await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').fill('link item');
    await page.getByLabel('block-item-Input-Link').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-Link').getByRole('textbox').fill('baidu.com');
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByText('link item')).toBeVisible();
  });

  test('sidebar', async ({ page }) => {});
});
