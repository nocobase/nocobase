import { enableToConfig, expect, test } from '@nocobase/test/client';

test.describe('menu', () => {
  test('create new page, then delete', async ({ page }) => {
    await page.goto('/');
    await enableToConfig(page);

    await page.getByTestId('add-menu-item-button-in-header').hover();
    await page.getByRole('menuitem', { name: 'Page' }).click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('new page');
    await page.getByRole('button', { name: 'OK' }).click();
    await page.getByText('new page').click();

    await expect(page.getByTestId('add-block-button-in-page')).toBeVisible();

    // 删除页面，避免影响其他测试
    await page.getByRole('menu').getByText('new page').hover();
    await page.getByTestId('designer-schema-settings').hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK' }).click();
  });

  test('insert befort page', async ({ page, mockPage }) => {
    await mockPage({ name: 'page' }).goto();
    await page.getByRole('menuitem', { name: 'Page', exact: true }).locator('span').click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('page1');
    await page.getByRole('button', { name: 'OK' }).click();
    // 获取需要比较的两个元素
    const element1 = await page.getByText('page1'); // 假设这是第一个元素
    const element2 = await page.getByText('page'); // 假设这是第二个元素

    // 获取两个元素的位置信息
    const element1BoundingBox = await element1.boundingBox();
    const element2BoundingBox = await element2.boundingBox();
    expect(element1BoundingBox.x).toBeLessThan(element2BoundingBox.x);

    // 删除页面，避免影响其他测试
    await page.getByRole('menu').getByText('page1').hover();
    await page.getByTestId('designer-schema-settings').hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK' }).click();
  });
});
