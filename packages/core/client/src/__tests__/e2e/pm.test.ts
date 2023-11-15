import { expect, test } from '@nocobase/test/client';

async function waitForModalToBeHidden(page) {
  test.slow();
  await page.waitForFunction(() => {
    const modal = document.querySelector('.ant-modal');
    if (modal) {
      const computedStyle = window.getComputedStyle(modal);
      return computedStyle.display === 'none' || computedStyle.visibility === 'hidden';
    }
    return true; // 如果找不到modal，也算作不可见
  });
}

test.describe('add plugin in front', () => {
  test('add plugin npm registry,then remove plugin', async ({ page, mockPage }) => {
    await mockPage().goto();
    await page.getByTestId('plugin-manager-button').click();
    await expect(page.getByLabel('sample-custom-collection-template')).not.toBeVisible();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page
      .getByLabel('block-item-Input-Npm package name')
      .getByRole('textbox')
      .fill('@nocobase/plugin-sample-custom-collection-template');
    await page.getByLabel('Submit').click();
    await page.waitForTimeout(1000); // 等待1秒钟
    //等待页面刷新结束
    await page.waitForFunction(() => {
      const modal = document.querySelector('.ant-modal');
      if (modal) {
        const computedStyle = window.getComputedStyle(modal);
        return computedStyle.display === 'none' || computedStyle.visibility === 'hidden';
      }
      return true; // 如果找不到modal，也算作不可见
    });
    await page.waitForLoadState('load');
    await page.getByPlaceholder('Search plugin').fill('sample-custom-collection-template');
    await expect(page.getByLabel('sample-custom-collection-template')).toBeVisible();
    //将添加的插件删除
    await page.getByLabel('sample-custom-collection-template').getByText('Remove').click();
    await page.getByRole('button', { name: 'Yes' }).click();
    await page.waitForTimeout(2000); // 等待2秒钟
    //等待页面刷新结束
    await waitForModalToBeHidden(page);
    await page.waitForLoadState('load');
    await page.getByPlaceholder('Search plugin').fill('sample-custom-collection-template');
    await expect(page.getByLabel('sample-custom-collection-template')).not.toBeVisible();
  });
  test.skip('add plugin local upload', async ({ page, mockPage }) => {});
  test.skip('add plugin  file url', async ({ page, mockPage }) => {});
});

test.describe('remove plugin', () => {
  test('remove plugin,then add plugin', async ({ page, mockPage }) => {
    await mockPage().goto();
    await page.getByTestId('plugin-manager-button').click();
    //hello插件默认安装未启用
    await page.getByPlaceholder('Search plugin').fill('Hello');
    await expect(page.getByLabel('Hello')).toBeVisible();
    const isActive = await page.getByLabel('Hello').getByLabel('enable').isChecked();
    expect(isActive).toBe(false);
    //将hello插件remove
    await page.getByLabel('Hello').getByText('Remove').click();
    await page.getByRole('button', { name: 'Yes' }).click();
    //等待页面刷新结束
    await waitForModalToBeHidden(page);
    await page.waitForLoadState('load');
    await page.getByPlaceholder('Search plugin').fill('hello');
    await expect(page.getByLabel('Hello')).not.toBeVisible();
    //将删除的插件加回来
    await page.getByRole('button', { name: 'Add new' }).click();
    await page
      .getByLabel('block-item-Input-Npm package name')
      .getByRole('textbox')
      .fill('@nocobase/plugin-sample-hello');
    await page.getByLabel('Submit').click();
    await page.waitForTimeout(1000);
    //等待弹窗消失和页面刷新结束
    await page.waitForFunction(() => {
      const modal = document.querySelector('.ant-modal');
      if (modal) {
        const computedStyle = window.getComputedStyle(modal);
        return computedStyle.display === 'none' || computedStyle.visibility === 'hidden';
      }
      return true; // 如果找不到modal，也算作不可见
    });
    await page.waitForLoadState('load');
    await page.getByPlaceholder('Search plugin').fill('hello');
    await expect(page.getByLabel('Hello')).toBeVisible();
    //已启用的插件不能remove，如ACL
    await page.getByPlaceholder('Search plugin').fill('ACL');
    await expect(page.getByLabel('ACL')).toBeVisible();
    const isAclActive = await page.getByLabel('ACL').getByLabel('enable').isChecked();
    expect(isAclActive).toBe(true);
    await expect(page.getByLabel('ACL').getByText('Remove')).not.toBeVisible();
  });
});

test.describe('enable & disabled plugin', () => {
  test('enable plugin', async ({ page, mockPage }) => {
    await mockPage().goto();
    await page.getByTestId('plugin-manager-button').click();
    await page.getByPlaceholder('Search plugin').fill('hello');
    await expect(page.getByLabel('Hello')).toBeVisible();
    const isActive = await page.getByLabel('Hello').getByLabel('enable').isChecked();
    expect(isActive).toBe(false);
    // 激活插件
    await page.getByLabel('Hello').getByLabel('enable').click();
    await page.waitForTimeout(1000); // 等待1秒钟
    //等待弹窗消失和页面刷新结束
    await waitForModalToBeHidden(page);
    await page.waitForLoadState('load');
    await page.getByPlaceholder('Search plugin').fill('hello');
    await expect(await page.getByLabel('Hello').getByLabel('enable').isChecked()).toBe(true);
    //将激活的插件禁用
    await page.getByLabel('Hello').getByLabel('enable').click();
    await page.waitForTimeout(1000); // 等待1秒钟
    //等待弹窗消失和页面刷新结束
    await waitForModalToBeHidden(page);
    await page.waitForLoadState('load');
    await expect(await page.getByLabel('Hello').getByLabel('enable').isChecked()).toBe(false);
  });
});
