import { expect, test } from '@nocobase/test/client';

test.describe('page header', () => {
  test('disabled & enabled page header', async ({ page, mockPage }) => {
    await mockPage().goto();
    await page.getByTestId('add-menu-item-button-in-header').hover();
    await page.getByRole('menuitem', { name: 'Link' }).click();
    await page.getByTestId('title-item').getByRole('textbox').fill('link');
    await page.getByTestId('href-item').getByRole('textbox').click();
    await page.getByTestId('href-item').getByRole('textbox').fill('https://www.baidu.com/');
    await page.getByRole('button', { name: 'OK' }).click();
    const page2Promise = page.waitForEvent('popup');
    await page.getByText('link', { exact: true }).click();
    const page2 = await page2Promise;

    await expect(page2.getByRole('button', { name: '百度一下' })).toBeVisible();

    // 删除页面，避免影响其他测试
    await page.getByRole('menu').getByText('link').hover();
    await page.getByTestId('designer-schema-settings').hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK' }).click();
  });
});

test.describe('page title', () => {
  test('disable & not disable page title', async ({ page, mockPage }) => {
    await mockPage().goto();
    await page.getByTestId('add-menu-item-button-in-header').hover();
    await page.getByRole('menuitem', { name: 'Link' }).click();
    await page.getByTestId('title-item').getByRole('textbox').fill('link');
    await page.getByTestId('href-item').getByRole('textbox').click();
    await page.getByTestId('href-item').getByRole('textbox').fill('https://www.baidu.com/');
    await page.getByRole('button', { name: 'OK' }).click();
    const page2Promise = page.waitForEvent('popup');
    await page.getByText('link', { exact: true }).click();
    const page2 = await page2Promise;

    await expect(page2.getByRole('button', { name: '百度一下' })).toBeVisible();

    // 删除页面，避免影响其他测试
    await page.getByRole('menu').getByText('link').hover();
    await page.getByTestId('designer-schema-settings').hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK' }).click();
  });
  test('edit page title', async ({ page, mockPage }) => {
    await mockPage().goto();
    await page.getByTestId('add-menu-item-button-in-header').hover();
    await page.getByRole('menuitem', { name: 'Link' }).click();
    await page.getByTestId('title-item').getByRole('textbox').fill('link');
    await page.getByTestId('href-item').getByRole('textbox').click();
    await page.getByTestId('href-item').getByRole('textbox').fill('https://www.baidu.com/');
    await page.getByRole('button', { name: 'OK' }).click();
    const page2Promise = page.waitForEvent('popup');
    await page.getByText('link', { exact: true }).click();
    const page2 = await page2Promise;

    await expect(page2.getByRole('button', { name: '百度一下' })).toBeVisible();

    // 删除页面，避免影响其他测试
    await page.getByRole('menu').getByText('link').hover();
    await page.getByTestId('designer-schema-settings').hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK' }).click();
  });
});

test.describe('page tabs', () => {
  test('enable & disabled page tab', async ({ page, mockPage }) => {
    await mockPage().goto();
    await page.getByTestId('add-menu-item-button-in-header').hover();
    await page.getByRole('menuitem', { name: 'Link' }).click();
    await page.getByTestId('title-item').getByRole('textbox').fill('link');
    await page.getByTestId('href-item').getByRole('textbox').click();
    await page.getByTestId('href-item').getByRole('textbox').fill('https://www.baidu.com/');
    await page.getByRole('button', { name: 'OK' }).click();
    const page2Promise = page.waitForEvent('popup');
    await page.getByText('link', { exact: true }).click();
    const page2 = await page2Promise;

    await expect(page2.getByRole('button', { name: '百度一下' })).toBeVisible();

    // 删除页面，避免影响其他测试
    await page.getByRole('menu').getByText('link').hover();
    await page.getByTestId('designer-schema-settings').hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK' }).click();
  });
  test('move page tab', async ({ page, mockPage }) => {
    await mockPage().goto();
    await page.getByTestId('add-menu-item-button-in-header').hover();
    await page.getByRole('menuitem', { name: 'Link' }).click();
    await page.getByTestId('title-item').getByRole('textbox').fill('link');
    await page.getByTestId('href-item').getByRole('textbox').click();
    await page.getByTestId('href-item').getByRole('textbox').fill('https://www.baidu.com/');
    await page.getByRole('button', { name: 'OK' }).click();
    const page2Promise = page.waitForEvent('popup');
    await page.getByText('link', { exact: true }).click();
    const page2 = await page2Promise;

    await expect(page2.getByRole('button', { name: '百度一下' })).toBeVisible();

    // 删除页面，避免影响其他测试
    await page.getByRole('menu').getByText('link').hover();
    await page.getByTestId('designer-schema-settings').hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK' }).click();
  });
});
