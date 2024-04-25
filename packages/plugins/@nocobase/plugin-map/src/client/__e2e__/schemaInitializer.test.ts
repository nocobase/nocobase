import { expect, test } from '@nocobase/test/e2e';
import { oneTableWithMap } from './templates';

test.describe('where map block can be added', () => {
  test('page & popup', async ({ page, mockPage }) => {
    const nocoPage = await mockPage(oneTableWithMap).waitForInit();
    await nocoPage.goto();

    // 1. 在页面中添加地图区块，因为没有配置 Access key 等信息，所以会显示错误提示
    await page.getByLabel('schema-initializer-Grid-page:').hover();
    await page.getByRole('menuitem', { name: 'table Map right' }).hover();
    await page.getByRole('menuitem', { name: 'map', exact: true }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(
      page
        .getByLabel('block-item-CardItem-map-map')
        .getByText('Please configure the AccessKey and SecurityJsCode first'),
    ).toBeVisible();

    // 2. 点击跳转按钮去配置页面，配置好后返回刚才的页面，应该能正常显示地图
    await page.getByRole('button', { name: 'Go to the configuration page' }).click();
    if (await page.getByRole('button', { name: 'Edit' }).isVisible()) {
      await page.getByRole('button', { name: 'Edit' }).click();
    }
    await page.getByLabel('Access key').click();
    await page.getByLabel('Access key').fill('9717a70e44273882bcf5489f72b4e261');
    await page.getByLabel('securityJsCode or serviceHost').click();
    await page.getByLabel('securityJsCode or serviceHost').fill('6876ed2d3a6168b75c4fba852e16c99c');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.locator('.ant-message-notice').getByText('Saved successfully')).toBeVisible();
    await nocoPage.goto();
    await expect(page.getByLabel('block-item-CardItem-map-map').locator('.amap-layer')).toBeVisible();

    // 3. 在弹窗中添加地图区块，应该能正常显示地图
    await page.getByLabel('block-item-CardItem-map-table').getByLabel('action-Action-Add new-create-').click();
    await page.getByLabel('schema-initializer-Grid-form:').hover();
    await page.getByRole('menuitem', { name: 'point' }).click();
    await expect(page.getByLabel('block-item-CollectionField-').locator('.amap-layer')).toBeVisible();

    // 4. 最后把地图的设置清空，以免影响到其它测试
    await page.goto('/admin/settings/map');
    await page.getByRole('button', { name: 'Edit' }).click();
    await page.getByLabel('Access key').clear();
    await page.getByLabel('securityJsCode or serviceHost').clear();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.locator('.ant-message-notice').getByText('Saved successfully')).toBeVisible();
  });
});
