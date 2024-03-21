import { expect, test } from '@nocobase/test/e2e';
import { T2183, T2186 } from '../templatesOfBug';

// fix https://nocobase.height.app/T-2183
test('should save conditions', async ({ page, mockPage }) => {
  await mockPage(T2183).goto();
  await page.getByLabel('action-Filter.Action-Filter-filter-users-table').click();
  await page.getByText('Add condition', { exact: true }).click();
  await page.getByTestId('select-filter-field').click();
  await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
  await page.getByRole('button', { name: 'Save conditions' }).click();

  await page.reload();
  await page.getByLabel('action-Filter.Action-Filter-filter-users-table').click();

  // After refreshing the browser, the set field and operator should still be visible
  await expect(page.getByTestId('select-filter-field').getByText('ID')).toBeVisible();
  await expect(page.getByTestId('select-filter-operator').getByText('is')).toBeVisible();
});

// fix https://nocobase.height.app/T-2186
test('the input box displayed should correspond to the field type', async ({ page, mockPage }) => {
  await mockPage(T2186).goto();

  await page.getByLabel('action-Filter.Action-Filter-filter-users-table').click();
  await page.getByTestId('select-filter-field').click();
  await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();

  // 应该显示数字输入框
  await expect(page.getByRole('spinbutton')).toBeVisible();
});
