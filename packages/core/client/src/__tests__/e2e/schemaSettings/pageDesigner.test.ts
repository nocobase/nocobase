import { Page, expect, test } from '@nocobase/test/client';

test.describe('page designer', () => {
  const showMenu = async (page: Page) => {
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('designer-schema-settings-Page').hover();
  };

  test('basic', async ({ page, mockPage }) => {
    await mockPage({ name: 'page' }).goto();

    // 选项：Enable page header ---------------------------------------------------------------------------------
    await expect(page.locator('.ant-page-header')).toBeVisible();
    await showMenu(page);
    // 默认开启
    await expect(page.getByRole('menuitem', { name: 'Enable page header' }).getByRole('switch')).toBeChecked();
    await page.getByRole('menuitem', { name: 'Enable page header' }).click();
    await expect(page.getByRole('menuitem', { name: 'Enable page header' }).getByRole('switch')).not.toBeChecked();
    // 标题应该被隐藏
    await expect(page.locator('.ant-page-header')).not.toBeVisible();
    // 其它开关也应该被隐藏
    await expect(page.getByRole('menuitem', { name: 'Display page title' })).not.toBeVisible();

    // 选项：Display page title ---------------------------------------------------------------------------------
    // 再次开启，显示出 Display page title
    await page.getByRole('menuitem', { name: 'Enable page header' }).click();
    await expect(page.getByRole('menuitem', { name: 'Display page title' }).getByRole('switch')).toBeChecked();
    await page.getByRole('menuitem', { name: 'Display page title' }).click();
    await expect(page.getByRole('menuitem', { name: 'Display page title' }).getByRole('switch')).not.toBeChecked();
    // 标题应该被隐藏
    await expect(page.locator('.ant-page-header').getByText('page')).not.toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Edit page title' })).not.toBeVisible();

    // 选项：Edit page title ------------------------------------------------------------------------------------
    // 再次开启，显示出 Edit page title
    await page.getByRole('menuitem', { name: 'Display page title' }).click();
    await page.getByRole('menuitem', { name: 'Edit page title' }).click();
    await page.getByLabel('block-item-Input-Title').getByRole('textbox').fill('new page title');
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByText('new page title')).toBeVisible();

    // 选项：Enable page tabs -----------------------------------------------------------------------------------
    await showMenu(page);
    // 默认关闭
    await expect(page.getByRole('menuitem', { name: 'Enable page tabs' }).getByRole('switch')).not.toBeChecked();
    await page.getByRole('menuitem', { name: 'Enable page tabs' }).click();
    await expect(page.getByRole('menuitem', { name: 'Enable page tabs' }).getByRole('switch')).toBeChecked();
    await page.mouse.move(300, 0);
    // 标签选项应该显示
    await expect(page.getByLabel('schema-initializer-Page-tabs')).toBeVisible();
    // 添加一个新的 tab 页
    await page.getByLabel('schema-initializer-Page-tabs').click();
    await page.getByLabel('block-item-Input-Tab name').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-Tab name').getByRole('textbox').fill('new tab');
    // 选择一个图标
    await page.getByRole('button', { name: 'Select icon' }).click();
    await page.getByLabel('account-book').locator('svg').click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByText('new tab')).toBeVisible();
    await expect(page.getByLabel('account-book').locator('svg')).toBeVisible();
  });
});
