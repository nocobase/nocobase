import { expect, oneEmptyForm, test } from '@nocobase/test/client';

test.describe('save as block template: form block', () => {
  test('basic usage', async ({ page, mockPage, mockRecords }) => {
    await mockPage(oneEmptyForm).goto();

    // 先保存为模板 ------------------------------------------------------------------------
    await showSettingsMenu(page);
    await page.getByRole('menuitem', { name: 'Save as block template' }).click();
    // 输入框中应该有一个默认的名字
    await expect(page.getByRole('dialog').getByRole('textbox')).toHaveValue('General_Form');
    // 设置一个新的名字
    await page.getByRole('dialog').getByRole('textbox').click();
    await page.getByRole('dialog').getByRole('textbox').fill('new_form_template');
    await page.getByRole('dialog').getByRole('button', { name: 'OK', exact: true }).click();

    // 区块左上角应该显示一个文案
    await page.getByLabel('block-item-CardItem-general-form').hover();
    await expect(
      page
        .getByLabel('block-item-CardItem-general-form')
        .getByText('Reference template: new_form_template (Fields only)'),
    ).toBeVisible();

    // settings 菜单中 Save as block template 应该变为 Convert reference to duplicate
    await showSettingsMenu(page);
    await expect(page.getByRole('menuitem', { name: 'Save as block template' })).toBeHidden();
    await expect(page.getByRole('menuitem', { name: 'Convert reference to duplicate' })).toBeVisible();

    // 创建区块的时候，可以选择刚才保存的模板 --------------------------------------------------
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'form Form right' }).first().hover();
    await page.getByRole('menuitem', { name: 'General right' }).hover();

    // Duplicate template
    await page.getByRole('menuitem', { name: 'Duplicate template right' }).hover();
    await page.getByRole('menuitem', { name: 'new_form_template (Fields only)' }).click();

    // Reference template
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'form Form right' }).first().hover();
    await page.getByRole('menuitem', { name: 'General right' }).hover();
    await page.getByRole('menuitem', { name: 'General right' }).click();
    await page.getByRole('menuitem', { name: 'Reference template right' }).click();
    await page.getByRole('menuitem', { name: 'new_form_template (Fields only)' }).click();

    // 页面中的区块应该成功被创建
    await expect(page.getByLabel('block-item-CardItem-general-form')).toHaveCount(3);

    // 保存为模板之后，应该在 ui-schema-storage 页面显示出来 -----------------------------------------
    await page.goto('/admin/settings/ui-schema-storage');
    await expect(page.getByRole('row', { name: 'new_form_template' })).toBeVisible();
  });
});

async function showSettingsMenu(page) {
  await page.getByLabel('block-item-CardItem-general-form').hover();
  await page.getByLabel('designer-schema-settings-CardItem-FormV2.Designer-general').hover();
}
