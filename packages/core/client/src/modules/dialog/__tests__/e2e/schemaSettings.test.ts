import { Page, oneEmptyTableBlockWithActions, test } from '@nocobase/test/client';

test.describe('tabs settings', () => {
  async function showSettings(page: Page) {
    await page.getByTestId('drawer-Action.Container-general-Add record').getByText('Add new').hover();
    await page.getByLabel('designer-schema-settings-Tabs.TabPane-Tabs.Designer-general').hover();
  }

  test('edit', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTableBlockWithActions).goto();
    await page.getByRole('button', { name: 'Add new' }).click();

    await showSettings(page);
    await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('block-item-Input-general-Tab name').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-general-Tab name').getByRole('textbox').fill('new name of dialog tab');
    await page.getByRole('button', { name: 'Select icon' }).click();
    await page.getByLabel('account-book').locator('svg').click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await expect(page.getByText('new name of dialog tab')).toBeVisible();
    await expect(page.getByLabel('account-book').locator('svg')).toBeVisible();
  });

  test('delete', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTableBlockWithActions).goto();
    await page.getByRole('button', { name: 'Add new' }).click();

    await showSettings(page);
    await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await expect(page.getByTestId('drawer-Action.Container-general-Add record').getByText('Add new')).toBeHidden();
  });
});
