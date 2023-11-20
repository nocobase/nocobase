import { Page, expect, oneTableBlockWithAddNewAndViewAndEditAndBasicFields, test } from '@nocobase/test/client';
import { testDisplayTitle, testEditDescription, testEditFieldTitle, testRequired } from '../commonTesting';

test.describe('color', () => {
  const showMenu = async (page: Page, mockPage) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel('block-item-CollectionField-general-form-general.color-color').hover();
    await page.getByLabel('designer-schema-settings-CollectionField-FormItem.Designer-general-general.color').hover();
  };

  test('edit field title', async ({ page, mockPage }) => {
    await showMenu(page, mockPage);
    await testEditFieldTitle(page);
  });

  test('display title', async ({ page, mockPage }) => {
    await showMenu(page, mockPage);
    // 默认情况下是开启状态
    await testDisplayTitle(page, 'color');
  });

  test('edit description', async ({ page, mockPage }) => {
    await showMenu(page, mockPage);
    await testEditDescription(page);
  });

  // TODO: BUG，现在没有该选项
  test.skip('edit tooltip', async ({ page, mockPage }) => {});

  test('required', async ({ page, mockPage }) => {
    await showMenu(page, mockPage);
    await testRequired(page);
  });

  test('pattern', async ({ page, mockPage }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Add new' }).click();

    // 默认情况下显示颜色选择框
    await page.getByLabel('color-picker-normal').hover();
    await expect(page.getByRole('button', { name: 'right Recommended', exact: true })).toBeVisible();

    await page.getByLabel('block-item-CollectionField-general-form-general.color-color').hover();
    await page.getByLabel('designer-schema-settings-CollectionField-FormItem.Designer-general-general.color').hover();
    await page.getByRole('menuitem', { name: 'Pattern' }).click();
    await page.getByRole('option', { name: 'Readonly' }).click();

    // 只读模式下，不会显示颜色弹窗
    await page.getByLabel('color-picker-normal').hover();
    await expect(page.getByRole('button', { name: 'right Recommended', exact: true })).not.toBeVisible();
    await page.getByLabel('designer-schema-settings-CollectionField-FormItem.Designer-general-general.color').hover();

    await page.getByRole('menuitem', { name: 'Pattern' }).click();
    await page.getByRole('option', { name: 'Easy-reading' }).click();
    await expect(page.getByLabel('color-picker-read-pretty')).toBeVisible();
  });
});
test.describe('email', () => {});
test.describe('icon', () => {});
test.describe('single line text', () => {});
test.describe('integer', () => {});
test.describe('number', () => {});
test.describe('password', () => {});
test.describe('percent', () => {});
test.describe('phone', () => {});
test.describe('long text', () => {});
test.describe('URL', () => {});
