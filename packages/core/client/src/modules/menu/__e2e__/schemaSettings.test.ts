import { Page, PageConfig, expect, expectSettingsMenu, test } from '@nocobase/test/e2e';

test.describe('group page menus schema settings', () => {
  test('edit', async ({ page, mockPage }) => {
    await mockPage({ type: 'group', name: 'group page' }).goto();
    await showSettings(page, 'group page');
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await page.mouse.move(300, 0);

    // 设置一个新名称
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('new group page');
    // 设置一个图标
    await page.getByRole('button', { name: 'Select icon' }).click();
    await page.getByRole('tooltip').getByLabel('account-book').locator('svg').click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await page.reload();

    await expect(page.getByLabel('new group page')).toBeVisible();
    await expect(page.getByLabel('new group page').getByLabel('account-book').locator('svg')).toBeVisible();
  });

  test('move to', async ({ page, mockPage }) => {
    await mockPage({ type: 'group', name: 'anchor page' }).waitForInit();
    await mockPage({ type: 'group', name: 'a other group page' }).waitForInit();
    await mockPage({ type: 'group', name: 'group page' }).goto();

    // 默认情况下的排列顺序：anchor page, group page
    await expect(page.getByText('anchor pagea other group pagegroup page')).toBeVisible();

    // 移动到 anchor page 之前 --------------------------------------------
    await showSettings(page, 'group page');
    await page.getByRole('menuitem', { name: 'Move to' }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('block-item-TreeSelect-Target').locator('.ant-select').click();
    await page.locator('.ant-select-dropdown').getByText('anchor page').click();
    await page.getByLabel('Before').click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByText('group pageanchor pagea other group page')).toBeVisible();

    // 移动到 anchor page 之后
    await showSettings(page, 'group page');
    await page.getByRole('menuitem', { name: 'Move to' }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('block-item-TreeSelect-Target').locator('.ant-select').click();
    await page.locator('.ant-select-dropdown').getByText('anchor page').click();
    await page.getByLabel('After').click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByText('anchor pagegroup pagea other group page')).toBeVisible();

    // 移动到 anchor page 内部 --------------------------------------------
    await showSettings(page, 'group page');
    await page.getByRole('menuitem', { name: 'Move to' }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('block-item-TreeSelect-Target').locator('.ant-select').click();
    await page.locator('.ant-select-dropdown').getByText('anchor page').click();
    await page.getByLabel('Inner').click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    // 当前页面菜单会消失
    await expect(page.getByLabel('group page', { exact: true })).not.toBeVisible();
    // 跳转到 anchor page 页面，会有一个名为 group page 的子页面菜单
    await page.getByLabel('anchor page').click();
    await expect(page.locator('.ant-layout-sider').getByLabel('group page')).toBeVisible();

    // 移动到子页面菜单之前 --------------------------------------------
    await showSettings(page, 'a other group page');
    await page.getByRole('menuitem', { name: 'Move to' }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('block-item-TreeSelect-Target').locator('.ant-select').click();
    await page.getByLabel('caret-down').locator('svg').click();
    await page.locator('.ant-select-dropdown').getByText('group page', { exact: true }).click();
    await page.getByLabel('Before').click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.locator('.ant-layout-sider').getByText('a other group pagegroup page')).toBeVisible();
  });

  test('insert before', async ({ page, mockPage, deletePage }) => {
    await mockPage({ name: 'single page' }).goto();

    // 在 single page 之前插入一个 group page
    await showSettings(page, 'single page');
    await page.getByRole('menuitem', { name: 'Insert before' }).hover();
    await page.getByRole('menuitem', { name: 'Group', exact: true }).click();
    await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').fill('group page');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await expect(page.locator('.ant-layout-header').getByText('group pagesingle page')).toBeVisible();

    await deletePage('group page');
  });

  test('insert after', async ({ page, mockPage, deletePage }) => {
    await mockPage({ name: 'single page' }).goto();

    // 在 single page 之后插入一个 group page
    await showSettings(page, 'single page');
    await page.getByRole('menuitem', { name: 'Insert after' }).hover();
    await page.getByRole('menuitem', { name: 'Group', exact: true }).click();
    await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').fill('group page');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await expect(page.locator('.ant-layout-header').getByText('single pagegroup page')).toBeVisible();

    await deletePage('group page');
  });

  test('insert inner', async ({ page, mockPage }) => {
    await mockPage({ type: 'group', name: 'group page' }).goto();

    // 在 group page 内部插入一个 single page
    await showSettings(page, 'group page');
    await page.getByRole('menuitem', { name: 'Insert inner' }).hover();
    await page.getByRole('menuitem', { name: 'Page', exact: true }).click();
    await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').fill('single page');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await expect(page.locator('.ant-layout-sider').getByText('single page')).toBeVisible();
  });

  test('delete', async ({ page, mockPage }) => {
    await mockPage({ type: 'group', name: 'group page' }).goto();
    await expect(page.getByLabel('group page')).toBeVisible();

    await showSettings(page, 'group page');
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 现在需要刷新一下页面，被删除的页面内容才会消失
    await page.reload();
    await expect(page.getByLabel('group page')).not.toBeVisible();
  });
});

test.describe('group page side menus schema settings', () => {
  test('group page', async ({ page, mockPage }) => {
    await mockPage({ type: 'group', name: 'group page' }).goto();
    await createSubPage({ page, type: 'group', name: 'group page in side' });

    await expectSettingsMenu({
      page,
      showMenu: () => showSettingsInSide(page, 'group page in side'),
      supportedOptions: ['Edit', 'Move to', 'Insert before', 'Insert after', 'Insert inner', 'Delete'],
    });
  });

  test('link page', async ({ page, mockPage }) => {
    await mockPage({ type: 'group', name: 'group page' }).goto();
    await createSubPage({ page, type: 'link', name: 'link page in side' });

    await expectSettingsMenu({
      page,
      showMenu: () => showSettingsInSide(page, 'link page in side'),
      supportedOptions: ['Edit', 'Move to', 'Insert before', 'Insert after', 'Delete'],
    });
  });

  test('single page', async ({ page, mockPage }) => {
    await mockPage({ type: 'group', name: 'group page' }).goto();
    await createSubPage({ page, type: 'page', name: 'single page in side' });

    await expectSettingsMenu({
      page,
      showMenu: () => showSettingsInSide(page, 'single page in side'),
      supportedOptions: ['Edit', 'Move to', 'Insert before', 'Insert after', 'Delete'],
    });
  });
});

test.describe('link page menu schema settings', () => {
  test('supported options', async ({ page, mockPage }) => {
    await mockPage({ type: 'link', name: 'link page' }).goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.locator('.ant-layout-header').getByText('link page', { exact: true }).hover();
        await page.getByRole('button', { name: 'designer-schema-settings-' }).hover();
      },
      supportedOptions: ['Edit', 'Move to', 'Insert before', 'Insert after', 'Delete'],
    });
  });
});

test.describe('single page menu schema settings', () => {
  test('supported options', async ({ page, mockPage }) => {
    await mockPage({ name: 'single page' }).goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.locator('.ant-layout-header').getByText('single page', { exact: true }).hover();
        await page.getByRole('button', { name: 'designer-schema-settings-' }).hover();
      },
      supportedOptions: ['Edit', 'Move to', 'Insert before', 'Insert after', 'Delete'],
    });
  });
});

async function showSettingsInSide(page: Page, pageName: string) {
  await page.locator('.ant-layout-sider').getByText(pageName, { exact: true }).hover();
  await page.getByRole('button', { name: 'designer-schema-settings-' }).hover();
}

async function showSettings(page: Page, pageName: string) {
  await page.locator('.ant-layout-header').getByText(pageName, { exact: true }).hover();
  await page.getByRole('button', { name: 'designer-schema-settings-' }).hover();
}

async function createSubPage({ page, name, type }: { page: Page; name: string; type: PageConfig['type'] }) {
  const typeToOptionName = {
    group: 'Group',
    page: 'Page',
    link: 'Link',
  };

  await page.getByTestId('schema-initializer-Menu-side').hover();
  await page.getByRole('menuitem', { name: typeToOptionName[type], exact: true }).click();
  await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').click();
  await page.getByLabel('block-item-Input-Menu item title').getByRole('textbox').fill(name);
  await page.getByRole('button', { name: 'OK', exact: true }).click();
}
