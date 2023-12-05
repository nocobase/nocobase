import { Page, expect, test } from '@nocobase/test/client';

test.describe('page tabs', () => {
  test('edit', async ({ page, mockPage }) => {
    await mockPage().goto();
    await enablePageTabs(page);

    await showSettings(page);
    await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
    await page.getByLabel('block-item-Input-Tab name').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-Tab name').getByRole('textbox').fill('new name of page tab');
    await page.getByRole('button', { name: 'Select icon' }).click();
    await page.getByLabel('account-book').locator('svg').click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await expect(page.getByText('new name of page tab')).toBeVisible();
    await expect(page.getByLabel('account-book').locator('svg')).toBeVisible();
  });

  test('delete', async ({ page, mockPage }) => {
    await mockPage().goto();
    await enablePageTabs(page);

    await showSettings(page);
    await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await expect(page.getByText('Unnamed')).toBeHidden();
  });
});

async function showSettings(page: Page) {
  await page.getByText('Unnamed').hover();
  await page.getByRole('tab').getByLabel('designer-schema-settings-Page').hover();
}

async function enablePageTabs(page) {
  await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
  await page.getByRole('button', { name: 'designer-schema-settings-Page' }).hover();
  await page.getByRole('menuitem', { name: 'Enable page tabs' }).click();
  await page.mouse.move(300, 0);
}
