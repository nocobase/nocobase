import { expect, groupPageEmpty, test } from '@nocobase/test/client';

test.describe('add menu item', () => {
  test('header', async ({ page, deletePage }) => {
    await page.goto('/');

    // add group
    await page.getByLabel('schema-initializer-Menu-header').hover();
    await page.getByLabel('Group', { exact: true }).click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('page group');
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByLabel('page group', { exact: true })).toBeVisible();

    // add page
    await page.getByLabel('schema-initializer-Menu-header').hover();
    await page.getByLabel('Page', { exact: true }).click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('page item');
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByLabel('page item', { exact: true })).toBeVisible();

    // add link
    await page.getByLabel('schema-initializer-Menu-header').hover();
    await page.getByLabel('Link', { exact: true }).click();
    await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').fill('page link');
    await page.getByLabel('block-item-Input-Link').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-Link').getByRole('textbox').fill('baidu.com');
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByText('page link', { exact: true })).toBeVisible();

    // delete pages
    await deletePage('page group');
    await deletePage('page item');
    await deletePage('page link');
  });

  test('sidebar', async ({ page, mockPage }) => {
    await mockPage(groupPageEmpty).goto();

    // add group in side
    await page.getByLabel('schema-initializer-Menu-side').click();
    await page.getByLabel('Group', { exact: true }).click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('page group side');
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByText('page group side', { exact: true })).toBeVisible();

    // add page in side
    await page.getByLabel('schema-initializer-Menu-side').click();
    await page.getByLabel('Page', { exact: true }).click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('page item side');
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByText('page item side', { exact: true })).toBeVisible();

    // add link in side
    await page.getByLabel('schema-initializer-Menu-side').click();
    await page.getByLabel('Link', { exact: true }).click();
    await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').fill('link item side');
    await page.getByLabel('block-item-Input-Link').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-Link').getByRole('textbox').fill('/');
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByText('link item side', { exact: true })).toBeVisible();
  });
});
