import { enableToConfig, expect, test } from '@nocobase/test/client';

test.describe('menu page', () => {
  test('create new page, then delete', async ({ page, mockPage }) => {
    await mockPage().goto();
    await enableToConfig(page);
    await page.getByTestId('add-menu-item-button-in-header').hover();
    await page.getByRole('menuitem', { name: 'Page', exact: true }).click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('new page');
    await page.getByRole('button', { name: 'OK' }).click();
    const menuItem = await page.getByRole('menu').locator('li').filter({ hasText: 'new page' });
    const defaultBackgroundColor = await menuItem.evaluate((element) => {
      const computedStyle = window.getComputedStyle(element);
      return computedStyle.backgroundColor;
    });
    await page.waitForTimeout(1000); // 等待1秒钟
    await menuItem.click();
    // 获取激活后的背景高亮颜色
    const activedBackgroundColor = await menuItem.evaluate((element) => {
      const computedStyle = window.getComputedStyle(element);
      return computedStyle.backgroundColor;
    });
    // 菜单高亮/进入空页面只有一个add block 按钮
    await expect(activedBackgroundColor).not.toBe(defaultBackgroundColor);
    await expect(page.getByTestId('add-block-button-in-page')).toBeVisible();
    await expect(page.getByTitle('new page')).toBeVisible();
    const divElement = await page.locator('.nb-page-content');
    const buttons = await divElement.locator('button').count();
    const divText = await divElement.textContent();

    await expect(buttons).toEqual(1);
    await expect(divText).toBe('Add block');

    // 删除页面，避免影响其他测试
    await page.getByLabel('new page').click();
    await page.getByLabel('new page').getByLabel('designer-schema-settings').hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK' }).click();
    await mockPage().goto();
    await expect(page.getByTitle('new page')).not.toBeVisible();
  });
  test('edit menu title', async ({ page, mockPage }) => {
    await mockPage({
      name: 'page title',
    }).goto();
    await page.getByLabel('page title').hover();
    await page.getByLabel('page title').getByLabel('designer-schema-settings').hover();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('page title1');
    await page.getByRole('button', { name: 'OK' }).click();
    await page.getByRole('menu').getByText('page title1').click();
    await mockPage().goto();
    await page.getByText('page title1').click();
    await expect(page.getByTitle('page title1')).toBeVisible();
  });
  test('move menu ', async ({ page, mockPage }) => {
    await mockPage({
      name: 'page1',
    }).goto();
    await mockPage({ name: 'page2' }).goto();
    await enableToConfig(page);

    await page.getByRole('menu').getByText('page1').click();
    await page.getByRole('menu').getByText('page1').hover();
    await page.getByLabel('page1').getByLabel('designer-schema-settings').hover();
    await page.getByRole('menuitem', { name: 'Move to' }).click();
    await page.getByLabel('Search').click();
    await page.getByTitle('page2').getByText('page2').click();
    await page.getByRole('button', { name: 'OK' }).click();
    const page1 = await page.getByRole('menu').getByText('page1').boundingBox();
    const page2 = await page.getByRole('menu').getByText('page2').boundingBox();
    expect(page2.x).toBeLessThan(page1.x);
  });

  test('insert page before', async ({ page, mockPage }) => {
    await mockPage({
      name: 'page3',
    }).goto();

    await page.getByLabel('page3').click();
    await page.getByLabel('page3').hover();
    await page.getByLabel('page3').getByLabel('designer-schema-settings').hover();

    await page.getByRole('menuitem', { name: 'Insert before right' }).hover();
    await page.waitForTimeout(1000); // 等待1秒钟

    await page.getByRole('menuitem', { name: 'Page', exact: true }).click();
    await page.getByRole('textbox').fill('page4');
    await page.getByRole('button', { name: 'OK' }).click();

    const page3 = await page.getByLabel('page3').boundingBox();
    const page4 = await page.getByLabel('page4').boundingBox();
    expect(page4.x).toBeLessThan(page3.x);
    await page.getByRole('menu').getByText('page4').click();
    await expect(page.getByTestId('add-block-button-in-page')).toBeVisible();
  });

  test('insert page after', async ({ page, mockPage }) => {
    await mockPage({
      name: 'page5',
    }).goto();

    await page.getByLabel('page5').click();
    await page.getByLabel('page5').hover();
    await page.getByLabel('page5').getByLabel('designer-schema-settings').hover();

    await page.getByRole('menuitem', { name: 'Insert after right' }).hover();
    await page.waitForTimeout(1000); // 等待1秒钟

    await page.getByRole('menuitem', { name: 'Page', exact: true }).click();
    await page.getByRole('textbox').fill('page6');
    await page.getByRole('button', { name: 'OK' }).click();

    const page6 = await page.getByRole('menu').getByText('page6').boundingBox();
    const page5 = await page.getByRole('menu').getByText('page5').boundingBox();
    expect(page5.x).toBeLessThan(page6.x);

    await page.getByRole('menu').getByText('page6').click();
    await expect(page.getByTestId('add-block-button-in-page')).toBeVisible();
  });
});

test.describe('menu group', () => {
  test('create new menu group, then delete', async ({ page, mockPage }) => {
    await mockPage().goto();
    await enableToConfig(page);
    await page.getByTestId('add-menu-item-button-in-header').hover();
    await page.getByRole('menuitem', { name: 'Group' }).click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('menu Group');
    await page.getByRole('button', { name: 'OK' }).click();
    await page.getByText('menu Group').click();

    await expect(page.getByTestId('add-menu-item-button-in-side')).toBeVisible();
    const sideBar = await page.locator('ul').filter({ hasText: /^Add menu item$/ });
    await expect(sideBar).toBeVisible();

    //添加子页面
    await page
      .locator('ul')
      .filter({ hasText: /^Add menu item$/ })
      .click();
    await page.getByTestId('add-menu-item-button-in-side').hover();
    await page.getByRole('menuitem', { name: 'Page', exact: true }).locator('span').click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('group page');
    await page.getByRole('button', { name: 'OK' }).click();
    await page.getByText('group page').click();
    //进入子页面
    await expect(page.getByTitle('group page')).toBeVisible();
    //对应分组/子菜单项高亮
    const menuItem = await page.getByRole('menu').locator('li').filter({ hasText: 'menu Group' });
    const menuItemBackgroundColor = await menuItem.evaluate((element) => {
      const computedStyle = window.getComputedStyle(element);
      return computedStyle.backgroundColor;
    });
    await page.waitForTimeout(1000); // 等待1秒钟
    await expect(menuItemBackgroundColor).toBe('rgba(255, 255, 255, 0.1)');
    const pageItem = await page.getByRole('menu').locator('li').filter({ hasText: 'group page' });

    const pageItemBackgroundColor = await pageItem.evaluate((element) => {
      const computedStyle = window.getComputedStyle(element);
      return computedStyle.backgroundColor;
    });
    await expect(pageItemBackgroundColor).toBe('rgb(230, 244, 255)');

    // 删除页面，避免影响其他测试
    await page.getByLabel('menu Group').click();
    await page.getByLabel('menu Group').hover();
    await page.getByLabel('menu Group').getByLabel('designer-schema-settings').first().hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK' }).click();
    await mockPage().goto();
    await expect(page.getByTitle('menu Group')).not.toBeVisible();
  });
});

test.describe('menu link', () => {
  test('create new menu link, then delete', async ({ page, mockPage }) => {
    await mockPage().goto();
    await page.getByTestId('add-menu-item-button-in-header').hover();
    await page.getByLabel('link').click();
    await page.getByTestId('title-item').getByRole('textbox').fill('link');
    await page.getByTestId('href-item').getByRole('textbox').click();
    await page.getByTestId('href-item').getByRole('textbox').fill('https://www.baidu.com/');
    await page.getByRole('button', { name: 'OK' }).click();
    const page2Promise = page.waitForEvent('popup');
    await page.getByText('link', { exact: true }).click();
    const page2 = await page2Promise;

    await expect(page2.getByRole('button', { name: '百度一下' })).toBeVisible();

    // 删除页面，避免影响其他测试
    await page.getByLabel('link').click();
    await page.getByLabel('link').getByLabel('designer-schema-settings').hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK' }).click();
  });
});
