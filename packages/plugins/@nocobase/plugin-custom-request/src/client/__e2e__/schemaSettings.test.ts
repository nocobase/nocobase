import { test, expect, oneEmptyTable } from '@nocobase/test/e2e';

test('edit button', async ({ page, mockPage, mockRecord }) => {
  await mockPage(oneEmptyTable).goto();
  await mockRecord('t_unp4scqamw9');

  // 新建一个 custom request action
  await page.getByRole('button', { name: 'Actions', exact: true }).hover();
  await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-').hover();
  await page.getByRole('menuitem', { name: 'Customize right' }).hover();
  await page.getByRole('menuitem', { name: 'Custom request' }).click();

  // 打开编辑按钮弹窗
  await page.getByLabel('action-CustomRequestAction-').hover();
  await page.getByLabel('designer-schema-settings-CustomRequestAction-actionSettings:customRequest-').hover();
  await page.getByRole('menuitem', { name: 'Edit button' }).click();

  // 应该只显示标题输入框
  await expect(page.getByText('Button title')).toBeVisible();
  await expect(page.getByText('Button icon')).not.toBeVisible();
  await expect(page.getByText('Button background color')).not.toBeVisible();
});
