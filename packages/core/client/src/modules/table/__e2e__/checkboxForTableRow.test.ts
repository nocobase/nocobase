import { checkboxForTableRow, expect, test } from '@nocobase/test/e2e';

test('selects the checkbox of a table row and deletes the selected row', async ({ page, mockPage, mockRecords }) => {
  const nocoPage = await mockPage(checkboxForTableRow).waitForInit();
  const records = await mockRecords('t_fhdhd0nk7b9', 3);
  await nocoPage.goto();

  await expect(page.getByText(records[0].f_vbrlno0zej9)).toBeVisible();

  await page.getByLabel('table-index-1').hover();
  await page.getByRole('checkbox', { name: 'checkbox' }).click();
  await page.getByLabel('action-Action-Delete-destroy-t_fhdhd0nk7b9-table').click();

  // 显示确认弹窗
  await expect(page.getByText('Are you sure you want to delete it?')).toBeVisible();

  // 点击确认
  await page.getByRole('button', { name: 'OK', exact: true }).click();

  // 确认内容已被删除
  await expect(page.getByText(records[0].f_vbrlno0zej9)).not.toBeVisible();
});
