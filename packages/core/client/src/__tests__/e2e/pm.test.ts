import { expect, test } from '@nocobase/test/client';

test.describe('add config in front', () => {
  test('add plugin npm registry,then remove plugin', async ({ page, mockPage }) => {
    await mockPage().goto();
    await page.getByTestId('pm-button').click();
    await expect(await page.getByLabel('sample-custom-collection-template')).not.toBeVisible();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page
      .getByRole('button', { name: '* Npm package name :' })
      .getByRole('textbox')
      .fill('@nocobase/plugin-sample-custom-collection-template');
    await page.getByTestId('submit-action').click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(20000);
    await page.getByPlaceholder('Search plugin').fill('sample-custom-collection-template');
    await expect(await page.getByLabel('sample-custom-collection-template')).toBeVisible();
    //将添加的插件删除
    await await page
      .getByLabel('sample-custom-collection-template')
      .getByRole('button', { name: 'delete Remove' })
      .click();
    await page.getByRole('button', { name: 'Yes' }).click();
    await page.waitForLoadState('load');
    await page.getByPlaceholder('Search plugin').fill('sample-custom-collection-template');
    await expect(await page.getByLabel('sample-custom-collection-template')).not.toBeVisible();
  });
  test.skip('add plugin local upload', async ({ page, mockPage }) => {});
  test.skip('add plugin  file url', async ({ page, mockPage }) => {});
});

test.describe('remove plugin', () => {
  test('remove plugin,then add plugin', async ({ page, mockPage }) => {
    await mockPage().goto();
    await page.getByTestId('pm-button').click();
    await page.getByPlaceholder('Search plugin').fill('hello');
    await expect(await page.getByLabel('hello')).toBeVisible();
    //未启用的插件可以remove
    const isActive = await page.getByLabel('hello').getByLabel('plugin-enabled').isChecked();
    await expect(isActive).toBe(false);
    await await page.getByLabel('hello').getByRole('button', { name: 'delete Remove' }).click();
    await page.getByRole('button', { name: 'Yes' }).click();
    await page.waitForLoadState('load');
    await page.getByPlaceholder('Search plugin').fill('hello');
    await expect(await page.getByLabel('hello')).not.toBeVisible();
    //将删除的插件加回来
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByTestId('packageName-item').getByRole('textbox').fill('@nocobase/plugin-sample-hello');
    await page.getByTestId('submit-action').click();
    await page.waitForLoadState('load');
    await page.getByPlaceholder('Search plugin').fill('hello');
    await expect(await page.getByLabel('hello')).toBeVisible();
  });
});

test.describe('enable plugin', () => {
  test('enable plugin', async ({ page, mockPage }) => {
    await mockPage().goto();
    await page.getByTestId('pm-button').click();
    await page.getByPlaceholder('Search plugin').fill('hello');
    await expect(await page.getByLabel('hello')).toBeVisible();
    const isActive = await page.getByLabel('hello').getByLabel('plugin-enabled').isChecked();
    await expect(isActive).toBe(false);
    await page.waitForTimeout(1000); // 等待1秒钟
    await page.getByLabel('hello').getByLabel('plugin-enabled').setChecked(true);
    await page.waitForLoadState('load');
    await expect(await page.getByLabel('hello').getByLabel('plugin-enabled').isChecked()).toBe(true);
    //将激活的插件禁用
    await page.getByLabel('hello').getByLabel('plugin-enabled').setChecked(false);
    await page.waitForLoadState('load');
    await expect(await page.getByLabel('hello').getByLabel('plugin-enabled').isChecked()).toBe(false);
  });
});

test.describe('activate plugin', () => {
  test('activate plugin', async ({ page, mockPage }) => {});
});

test.describe('enabled plugin', () => {
  test('enabled plugin', async ({ page, mockPage }) => {});
});
test.describe('update plugin', () => {
  test('update plugin', async ({ page, mockPage }) => {});
});
