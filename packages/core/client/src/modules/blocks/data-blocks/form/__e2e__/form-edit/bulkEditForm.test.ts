import { expect, test } from '@nocobase/test/e2e';
import { T3924 } from './templatesOfBug';

test.describe('bulk edit form', () => {
  // https://nocobase.height.app/T-3924/description
  test('should be required when switching to "Changed to"', async ({ page, mockPage, mockRecord }) => {
    await mockPage(T3924).goto();

    // 1. 打开弹窗，显示出批量编辑表单
    await page.getByLabel('action-Action-Bulk edit-').click();

    // 默认为 "Changed to" 模式，此时应该显示字段是必填的
    await expect(page.getByLabel('block-item-BulkEditField-').getByText('*')).toBeVisible();

    // 2. 切换为其它模式，此时应该不显示字段是必填的
    await page.getByLabel('block-item-BulkEditField-').locator('.ant-select-selector').click();
    await page.getByRole('option', { name: 'Remains the same' }).click();
    await expect(page.getByLabel('block-item-BulkEditField-').getByText('*')).toBeHidden();

    // 3. 再切换为 "Changed to" 模式，此时应该显示字段是必填的
    await page.getByLabel('block-item-BulkEditField-').locator('.ant-select-selector').click();
    await page.getByRole('option', { name: 'Changed to' }).click();
    await expect(page.getByLabel('block-item-BulkEditField-').getByText('*')).toBeVisible();

    // 4. 点击提交按钮，应该提示一个错误
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByLabel('block-item-BulkEditField-').getByText('The field value is required')).toBeVisible();

    // 5. 输入值后，再次点击提交按钮，应该不再提示错误
    await page.getByLabel('block-item-BulkEditField-').getByRole('textbox').fill('123');
    // 将鼠标指针移除 Submit 按钮，防止显示右上角的图标，不然影响 Locator 的定位
    await page.mouse.move(-300, 0);
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByLabel('block-item-BulkEditField-').getByText('The field value is required')).toBeHidden();
  });
});
