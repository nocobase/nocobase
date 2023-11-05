import { enableToConfig, expect, test } from '@nocobase/test/client';
import { approximateColor } from './utils';

test.describe('menu page', () => {
  test('create new page, then delete', async ({ page, mockPage }) => {
    await mockPage().goto();
    const pageTitle = 'new page';
    await page.getByLabel('schema-initializer-Menu-header').click();
    await page.waitForTimeout(1000); // 等待1秒钟
    await page.getByRole('menu').getByLabel('Page').click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill(pageTitle);
    await page.getByRole('button', { name: 'OK' }).click();
    const menuItem = page.getByRole('menu').locator('li').filter({ hasText: pageTitle });
    const defaultBackgroundColor = await menuItem.evaluate((element) => {
      const computedStyle = window.getComputedStyle(element);
      return computedStyle.backgroundColor;
    });
    await menuItem.click();
    // 获取激活后的背景高亮颜色
    const activedBackgroundColor = await menuItem.evaluate((element) => {
      const computedStyle = window.getComputedStyle(element);
      return computedStyle.backgroundColor;
    });
    // 菜单高亮/进入空页面只有一个add block 按钮
    expect(activedBackgroundColor).not.toBe(defaultBackgroundColor);
    await expect(page.getByLabel('schema-initializer-Grid-BlockInitializers')).toBeVisible();
    await expect(page.getByTitle(pageTitle)).toBeVisible();
    const divElement = await page.locator('.nb-page-content');
    const buttons = await divElement.locator('button').count();
    const divText = await divElement.textContent();

    await expect(buttons).toEqual(1);
    await expect(divText).toBe('Add block');

    // 删除页面，避免影响其他测试
    await page.getByLabel(pageTitle).click();
    await page.getByLabel(pageTitle).getByLabel('designer-schema-settings').hover();
    await page.getByLabel('Delete').click();
    await page.getByRole('button', { name: 'OK' }).click();
    await mockPage().goto();
    await expect(page.getByTitle(pageTitle)).not.toBeVisible();
  });
  test('edit menu title', async ({ page, mockPage }) => {
    const pageTitle = 'page title';
    const newPagetitle = 'page title1';
    await mockPage({
      name: pageTitle,
    }).goto();
    await page.getByLabel(pageTitle).hover();
    await page.getByLabel(pageTitle).getByLabel('designer-schema-settings').hover();
    await page.getByLabel('Edit').click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill(newPagetitle);
    await page.getByRole('button', { name: 'OK' }).click();
    await page.getByRole('menu').getByText(newPagetitle).click();
    await mockPage().goto();
    await page.getByText(newPagetitle).click();
    await expect(page.getByTitle(newPagetitle)).toBeVisible();
  });
  test('move menu ', async ({ page, mockPage }) => {
    const pageTitle1 = 'page1';
    const pageTitle2 = 'page2';
    await mockPage({
      name: pageTitle1,
    }).goto();
    await mockPage({ name: pageTitle2 }).goto();
    await enableToConfig(page);
    await page.getByRole('menu').getByText(pageTitle1).click();
    await page.getByRole('menu').getByText(pageTitle1).hover();
    await page.getByLabel(pageTitle1).getByLabel('designer-schema-settings').hover();
    await page.getByLabel('Move to').click();
    await page.getByRole('dialog').click();
    await page.getByLabel('Search').click();
    await page.waitForTimeout(1000); // 等待1秒钟
    await page.locator('.ant-select-dropdown').getByText(pageTitle2).click();
    await page.getByRole('button', { name: 'OK' }).click();
    const page1 = await page.getByRole('menu').getByText(pageTitle1).boundingBox();
    const page2 = await page.getByRole('menu').getByText(pageTitle2).boundingBox();
    //拖拽菜单排序符合预期
    expect(page2.x).toBeLessThan(page1.x);
  });

  test('insert page before', async ({ page, mockPage }) => {
    const pageTitle3 = 'page3';
    const pageTitle4 = 'page4';
    await mockPage({
      name: pageTitle3,
    }).goto();

    await page.getByLabel(pageTitle3).click();
    await page.getByLabel(pageTitle3).hover();
    await page.getByLabel(pageTitle3).getByLabel('designer-schema-settings').hover();

    await page.getByLabel('Insert before').hover();

    await page.getByRole('button', { name: 'Page', exact: true }).click();
    await page.getByRole('textbox').fill(pageTitle4);
    await page.getByRole('button', { name: 'OK' }).click();

    const page3 = await page.getByLabel(pageTitle3).boundingBox();
    const page4 = await page.getByLabel(pageTitle4).boundingBox();
    //插入的菜单位置符合预期，且进入空页面
    expect(page4.x).toBeLessThan(page3.x);
    await page.getByRole('menu').getByText(pageTitle4).click();
    await expect(page.getByLabel('schema-initializer-Grid-BlockInitializers')).toBeVisible();
    //删除页面
    await page.getByLabel(pageTitle4).click();
    await page.getByLabel(pageTitle4).getByLabel('designer-schema-settings').hover();
    await page.getByLabel('Delete').click();
    await page.getByRole('button', { name: 'OK' }).click();
  });

  test('insert page after', async ({ page, mockPage }) => {
    const pageTitle5 = 'page5';
    const pageTitle6 = 'page6';
    await mockPage({
      name: pageTitle5,
    }).goto();

    await page.getByLabel(pageTitle5).click();
    await page.getByLabel(pageTitle5).hover();
    await page.getByLabel(pageTitle5).getByLabel('designer-schema-settings').hover();

    await page.getByLabel('Insert after').hover();

    await page.getByRole('button', { name: 'Page', exact: true }).click();
    await page.getByRole('textbox').fill(pageTitle6);
    await page.getByRole('button', { name: 'OK' }).click();

    const page6 = await page.getByLabel(pageTitle6).boundingBox();
    const page5 = await page.getByLabel(pageTitle5).boundingBox();
    //插入的菜单位置符合预期
    expect(page5.x).toBeLessThan(page6.x);
    await page.getByLabel(pageTitle6).click();
    await expect(page.getByLabel('schema-initializer-Grid-BlockInitializers')).toBeVisible();
    //删除页面
    await page.getByLabel(pageTitle6).getByLabel('designer-schema-settings-Menu.Item').click();
    await page.getByRole('menu').getByLabel('Delete').click();
    await page.getByRole('button', { name: 'OK' }).click();
  });
});

test.describe('menu group', () => {
  test('create new menu group, then delete', async ({ page, mockPage }) => {
    await mockPage().goto();
    await page.getByLabel('schema-initializer-Menu-header').hover();
    await page.getByRole('menu').getByLabel('Group').click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('menu Group');
    await page.getByRole('button', { name: 'OK' }).click();
    await page.getByText('menu Group').click();

    await expect(page.getByLabel('schema-initializer-Menu-side')).toBeVisible();
    const sideBar = await page.locator('ul').filter({ hasText: /^Add menu item$/ });
    await expect(sideBar).toBeVisible();

    //添加子页面
    await page
      .locator('ul')
      .filter({ hasText: /^Add menu item$/ })
      .click();
    await page.getByLabel('schema-initializer-Menu-side').click();
    await page.getByRole('button', { name: 'Page' }).click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('group page');
    await page.getByRole('button', { name: 'OK' }).click();
    await page.getByText('group page').click();
    //进入子页面
    await expect(page.getByTitle('group page')).toBeVisible();
    //对应分组/子菜单项均高亮
    const menuItem = await page.getByRole('menu').locator('li').filter({ hasText: 'menu Group' });
    const menuItemBackgroundColor = await menuItem.evaluate((element) => {
      const computedStyle = window.getComputedStyle(element);
      return computedStyle.backgroundColor;
    });
    await page.waitForTimeout(1000); // 等待1秒钟
    const isApproximate = approximateColor(menuItemBackgroundColor, 'rgba(255, 255, 255, 0.1)');
    await expect(isApproximate).toBe(true);
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
    await page.getByLabel('Delete').click();
    await page.getByRole('button', { name: 'OK' }).click();
    await mockPage().goto();
    await expect(page.getByTitle('menu Group')).not.toBeVisible();
  });
});

test.describe('menu link', () => {
  test('create new menu link, then delete', async ({ page, mockPage }) => {
    await mockPage().goto();
    await page.getByLabel('schema-initializer-Menu-header').hover();
    await page.getByRole('menu').getByLabel('Link').click();
    await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').fill('link menu');
    await page.getByLabel('block-item-Input-Link').getByRole('textbox').fill('https://www.baidu.com/');
    await page.getByRole('button', { name: 'OK' }).click();
    await page.getByLabel('link menu').click();
    const page2Promise = page.waitForEvent('popup');
    const page2 = await page2Promise;

    await expect(page2.getByRole('button', { name: '百度一下' })).toBeVisible();
    // 删除页面，避免影响其他测试
    await page.getByLabel('link menu').click();
    await page.getByLabel('link menu').getByLabel('designer-schema-settings').hover();
    await page.getByLabel('Delete').click();
    await page.getByRole('button', { name: 'OK' }).click();
  });
});
