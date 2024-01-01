import { expect, test } from '@nocobase/test/e2e';
import { T2187 } from '../templatesOfBug';

// fix https://nocobase.height.app/T-2187
test('in the Duplicate mode, the Roles field should not have a value after clicking it because it is not selected', async ({
  page,
  mockPage,
}) => {
  await mockPage(T2187).goto();

  await page.getByLabel('action-Action.Link-Duplicate-duplicate-users-table-0').click();
  await expect(page.getByRole('textbox')).toHaveValue('Super Admin');
  await expect(page.getByTestId('select-object-multiple')).toHaveText('');
});
