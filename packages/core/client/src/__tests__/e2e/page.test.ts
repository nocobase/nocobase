import { expect, test } from '@nocobase/test/client';

test.describe('page header', () => {
  test('disabled & enabled page header', async ({ page, mockPage }) => {
    const pageTitle = 'page header';
    await mockPage({ name: pageTitle }).goto();
    //默认开启
    await expect(page.getByTitle(pageTitle)).toBeVisible();
    await page.getByTitle(pageTitle).click();
    await page.getByLabel('designer-schema-settings-Page').hover();
    await expect(page.getByLabel('Enable page header').getByRole('switch')).toBeChecked();
    //关闭
    await page.getByLabel('Enable page header').getByRole('switch').click();
    await expect(await page.locator('.ant-page-header')).not.toBeVisible();
    await expect(page.getByLabel('Enable page header').getByRole('switch')).not.toBeChecked();
    //开启
    await page.getByRole('main').locator('span').nth(1).click();
    await page.getByLabel('designer-schema-settings-Page').hover();
    await page.getByLabel('Enable page header').getByRole('switch').click();
    await expect(await page.locator('.ant-page-header').getByTitle(pageTitle)).toBeVisible();
  });
});

test.describe('page title', () => {
  test('disable & not disable page title', async ({ page, mockPage }) => {
    const pageTitle = 'page title';
    await mockPage({ name: pageTitle }).goto();
    //默认显示
    await expect(page.getByTitle(pageTitle)).toBeVisible();
    await page.getByTitle(pageTitle).click();
    await page.getByLabel('designer-schema-settings-Page').hover();
    await expect(page.getByLabel('Display page title').getByRole('switch')).toBeChecked();
    //不显示
    await page.getByLabel('Display page title').getByRole('switch').click();
    await expect(page.locator('.ant-page-header')).toBeVisible();
    await expect(page.locator('.ant-page-header').getByTitle(pageTitle)).not.toBeVisible();
    await expect(page.getByLabel('Display page title').getByRole('switch')).not.toBeChecked();
    //开启
    await page.locator('.ant-page-header').click();
    await page.getByLabel('designer-schema-settings-Page').hover();
    await page.getByLabel('Display page title').getByRole('switch').click();
    await expect(page.locator('.ant-page-header').getByTitle(pageTitle)).toBeVisible();
  });
  test('edit page title', async ({ page, mockPage }) => {
    await mockPage({ name: 'page title1' }).goto();

    await expect(page.getByTitle('page title1')).toBeVisible();
    await page.getByTitle('page title1').click();
    await page.getByLabel('designer-schema-settings-Page').hover();
    await page.getByText('Edit page title').click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('page title2');
    await page.getByRole('button', { name: 'OK' }).click();
    await page.getByText('page title2').click();
    await expect(page.getByText('page title2')).toBeVisible();
    //菜单栏不调整
    await expect(page.getByLabel('page title1')).toBeVisible();
  });
});

test.describe('page tabs', () => {
  test('enable & disabled page tab', async ({ page, mockPage }) => {
    await mockPage({ name: 'page tab' }).goto();
    await page.getByTitle('page tab').click();
    await page.getByLabel('designer-schema-settings-Page').hover();
    //默认不启用
    await expect(page.getByLabel('Enable page tabs').getByRole('switch')).not.toBeChecked();
    //启用标签
    await page.getByLabel('Enable page tabs').click();
    await expect(page.getByRole('tab').locator('div').filter({ hasText: 'Unnamed' })).toBeVisible();
    await expect(page.getByLabel('schema-initializer-Page-tabs')).toBeVisible();
    await page.getByRole('tab').locator('div').filter({ hasText: 'Unnamed' }).click();
    await expect(page.getByLabel('schema-initializer-Grid-BlockInitializers')).toBeVisible();

    //添加新的tab
    await page.getByLabel('schema-initializer-Page-tabs').click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('page tab 1');
    await page.getByRole('button', { name: 'OK' }).click();
    await page.getByText('page tab 1').click();
    await page.getByLabel('schema-initializer-Page-tabs').click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('page tab 2');
    await page.getByRole('button', { name: 'OK' }).click();
    await page.getByText('page tab 2').click();

    await page.waitForTimeout(1000); // 等待1秒钟
    const tabMenuItem = await page.getByRole('tab').locator('div > span').filter({ hasText: 'page tab 2' });
    const tabMenuItemActivedColor = await tabMenuItem.evaluate((element) => {
      const computedStyle = window.getComputedStyle(element);
      return computedStyle.color;
    });
    //激活的tab样式符合预期
    await expect(page.getByText('page tab 1')).toBeVisible();
    await expect(page.getByText('page tab 2')).toBeVisible();
    await expect(page.getByLabel('schema-initializer-Grid-BlockInitializers')).toBeVisible();
    await expect(tabMenuItemActivedColor).toBe('rgb(22, 119, 255)');

    //修改tab名称
    await page.getByText('Unnamed').click();
    await page.getByRole('button', { name: 'designer-schema-settings-Page-tab' }).click();
    await page.getByLabel('Edit', { exact: true }).click();
    await page.getByRole('textbox').fill('page tab');
    await page.getByRole('button', { name: 'OK' }).click();

    const tabMenuItem1 = await page.getByRole('tab').getByText('page tab', { exact: true });
    const tabMenuItemActivedColor1 = await tabMenuItem1.evaluate((element) => {
      const computedStyle = window.getComputedStyle(element);
      return computedStyle.color;
    });
    await expect(tabMenuItem1).toBeVisible();
    await expect(page.getByLabel('schema-initializer-Grid-BlockInitializers')).toBeVisible();
    await expect(tabMenuItemActivedColor1).toBe('rgb(22, 119, 255)');

    //删除 tab
    await page.getByRole('tab').getByText('page tab', { exact: true }).hover();
    await page.getByRole('button', { name: 'designer-schema-settings-Page-tab' }).click();
    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByRole('tab').getByText('page tab', { exact: true })).not.toBeVisible();
    await page.getByRole('tab').getByText('page tab 1').click();

    //禁用标签
    await page
      .locator('div')
      .filter({ hasText: /^page tab$/ })
      .nth(1)
      .click();
    await page.getByLabel('designer-schema-settings-Page', { exact: true }).click();
    await page.getByLabel('Enable page tabs').getByRole('switch').setChecked(false);
    await expect(page.getByText('page tab 2')).not.toBeVisible();
  });
  test('drag page tab sorting', async ({ page, mockPage }) => {
    await mockPage({
      pageSchema: {
        'x-uid': 'h8q2mcgo3cq',
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Page',
        'x-component-props': {
          enablePageTabs: true,
        },
        properties: {
          bi8ep3svjee: {
            'x-uid': '9kr7xm9x4ln',
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'BlockInitializers',
            title: 'tab 1',
            'x-async': false,
            'x-index': 1,
          },
          rw91udnzpr3: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            title: 'tab 2',
            'x-component': 'Grid',
            'x-initializer': 'BlockInitializers',
            'x-uid': 'o5vp90rqsjx',
            'x-async': false,
            'x-index': 2,
          },
        },
        'x-async': true,
        'x-index': 1,
      },
    }).goto();

    const sourceElement = await page.locator('span:has-text("tab 2")');
    await sourceElement.hover();
    const source = await page.getByRole('button', { name: 'drag' });
    await source.hover();
    const targetElement = await page.locator('span:has-text("tab 1")');
    const sourceBoundingBox = await sourceElement.boundingBox();
    const targetBoundingBox = await targetElement.boundingBox();
    //拖拽标签调整排序 拖拽前 1-2
    expect(targetBoundingBox.x).toBeLessThan(sourceBoundingBox.x);
    await source.dragTo(targetElement);
    await sourceElement.dragTo(targetElement);
    const tab2 = await page.locator('span:has-text("tab 2")').boundingBox();
    const tab1 = await page.locator('span:has-text("tab 1")').boundingBox();
    //拖拽后 2-1
    await expect(tab2.x).toBeLessThan(tab1.x);
  });
});
