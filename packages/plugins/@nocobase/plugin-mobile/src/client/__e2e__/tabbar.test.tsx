import { expect, removeAllMobileRoutes, request, test } from '@nocobase/test/e2e';

function randomStr() {
  return Math.random().toString(36).substring(2);
}

test.describe('TabBar', () => {
  test('schema page & settings', async ({ page }) => {
    await removeAllMobileRoutes();
    await page.goto('/m');

    // hover initializer
    expect(page.getByLabel('schema-initializer-MobileTabBar')).toBeVisible();
    await page.getByLabel('schema-initializer-MobileTabBar').click();

    // 添加页面
    const Title = randomStr();
    await page.getByRole('menuitem', { name: 'Page' }).click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill(Title);
    await page.getByRole('button', { name: 'Select icon' }).click();
    await page.getByRole('tooltip').getByLabel('account-book').locator('svg').click();
    await page.getByLabel('action-Action-Submit').click();
    expect(page.getByTestId('modal-Action.Modal-Add page')).not.toBeVisible();

    // 确认添加成功 data-testid="mobile-tab-bar-r5fb94wgkra"
    await page.getByTestId(`mobile-tab-bar-${Title}`).click();
    const count = await page.locator(`text=${Title}`).count(); // title and tabBar
    expect(count).toBe(2);
    expect(page.getByLabel('block-item-MobilePageProvider')).toBeVisible();

    // 编辑
    await page.getByTestId(`mobile-tab-bar-${Title}`).click();
    await page.getByLabel('designer-schema-settings-MobileTabBar.Page-mobile:tab-bar:page').click();
    await page.getByRole('menuitem', { name: 'Edit button' }).click();
    await page.getByRole('textbox').fill(`${Title}_change`);
    await page.getByRole('button', { name: 'Submit' }).click();
    expect(page.getByTestId('modal-Action.Modal-Add page')).not.toBeVisible();

    await page.getByLabel('block-item-MobileTabBar.Page').click();
    const count_changed = await page.locator(`text=${Title}_change`).count();
    expect(count_changed).toBe(2);

    // 删除
    await page.getByTestId(`mobile-tab-bar-${Title}_change`).click();
    await page.getByLabel('designer-schema-settings-MobileTabBar.Page-mobile:tab-bar:page').click();
    await page.getByText('Delete').click();
    await page.getByRole('button', { name: 'OK' }).click();
    expect(page.getByText('Delete action')).not.toBeVisible();

    // 确认删除成功
    await page.waitForTimeout(1000);
    expect(page.getByText(`${Title}_change`)).not.toBeVisible();
  })

  test('add link page & settings', async ({ page }) => {
    await page.goto('/m');
    await removeAllMobileRoutes();

    // hover initializer
    expect(page.getByLabel('schema-initializer-MobileTabBar')).toBeVisible();
    await page.getByLabel('schema-initializer-MobileTabBar').hover();

    // 添加页面
    const Title = randomStr();
    await page.getByRole('menuitem', { name: 'Link' }).click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill(Title);
    await page.getByRole('button', { name: 'Select icon' }).click();
    await page.getByRole('tooltip').getByLabel('account-book').locator('svg').click();
    await page.getByLabel('action-Action-Submit').click();
    expect(page.getByTestId('modal-Action.Modal-Add page')).not.toBeVisible();

    // 确认添加成功
    await page.getByTestId(`mobile-tab-bar-${Title}`).click();
    expect(page.getByText('Please configure the URL')).toBeVisible();
    const count = await page.locator(`text=${Title}`).count();
    expect(count).toBe(1);
    expect(page.getByLabel('block-item-MobilePageProvider')).toBeVisible();

    // 编辑
    await page.getByTestId(`mobile-tab-bar-${Title}`).hover();
    await page.getByLabel('designer-schema-settings-MobileTabBar.Link-mobile:tab-bar:link').click();
    await page.getByRole('menuitem', { name: 'Edit button' }).click();
    await page.getByRole('textbox').fill(`${Title}_change`);
    await page.getByRole('button', { name: 'Submit' }).click();
    expect(page.getByTestId('modal-Action.Modal-Add page')).not.toBeVisible();

    await page.getByTestId(`mobile-tab-bar-${Title}_change`).click();
    const count_changed = await page.locator(`text=${Title}_change`).count();
    expect(count_changed).toBe(1);

    // 编辑 URL
    await page.getByTestId(`mobile-tab-bar-${Title}_change`).hover();
    // 如果有多个，点击获取 display 不为 none 的元素
    await page.getByLabel('designer-schema-settings-MobileTabBar.Link-mobile:tab-bar:link').hover();
    await page.getByRole('menuitem', { name: 'Edit link' }).click();
    console.log('page.url()', page.url());
    await page.getByLabel('block-item-Variable.TextArea-').getByLabel('textbox').fill(page.url().replace('/m', '/admin'));
    await page.getByRole('button', { name: 'OK' }).click();
    const page2Promise = page.waitForEvent('popup');
    await page.getByTestId(`mobile-tab-bar-${Title}_change`).click();
    const page2 = await page2Promise;
    expect(page2.url()).toBe(page.url().replace('/m', '/admin'));
    await page2.close();

    // 删除
    await page.getByTestId(`mobile-tab-bar-${Title}_change`).hover();
    await page.getByLabel('designer-schema-settings-MobileTabBar.Link-mobile:tab-bar:link').click();
    await page.getByText('Delete').click();
    await page.getByRole('button', { name: 'OK' }).click();
    expect(page.getByText('Delete action')).not.toBeVisible();

    // 确认删除成功
    await page.waitForTimeout(1000);
    expect(page.getByText(`${Title}_change`)).not.toBeVisible();
  })

  test('enable TabBar Settings', async ({ page, mockMobilePage }) => {
    const nocoPage = mockMobilePage({})
    await nocoPage.goto();
    expect(page.getByLabel('schema-initializer-MobileTabBar')).toBeVisible();
    await page.getByLabel('schema-initializer-MobileTabBar').hover();
    const countShow1 = await page.locator(`text=${nocoPage.getTitle()}`).count();
    expect(countShow1).toBe(2);

    // hover settings
    await page.getByLabel('block-item-MobileTabBar', { exact: true }).click();
    await page.getByLabel('designer-schema-settings-MobileTabBar-mobile:tab-bar').click();
    await page.getByText('Enable TabBar').click();
    const countHide = await page.locator(`text=${nocoPage.getTitle()}`).count();
    expect(countHide).toBe(1);

    // hover settings
    await page.getByLabel('block-item-MobileTabBar', { exact: true }).hover();
    await page.getByLabel('designer-schema-settings-MobileTabBar-mobile:tab-bar').hover();
    await page.getByText('Enable TabBar').click();
    const countShow2 = await page.locator(`text=${nocoPage.getTitle()}`).count();
    expect(countShow2).toBe(2);
  })
});
