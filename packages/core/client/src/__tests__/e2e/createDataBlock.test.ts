import { expect, test } from '@nocobase/test/client';

test.describe('create data block', () => {
  test('table', async ({ page, mockPage }) => {
    await mockPage().goto();

    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();

    await expect(page.getByText('Configure columns')).toBeVisible();
  });

  test('form', async ({ page, mockPage }) => {
    await mockPage().goto();

    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'Form' }).first().hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();
    await page.mouse.move(300, 0);

    await expect(page.getByText('Configure fields')).toBeVisible();
  });

  test('details', async ({ page, mockPage }) => {
    await mockPage().goto();

    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'Details' }).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();

    await expect(page.getByText('Configure fields')).toBeVisible();
  });

  test('list', async ({ page, mockPage }) => {
    await mockPage().goto();

    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'ordered-list List' }).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();

    await expect(page.getByText('Configure fields').first()).toBeVisible();
  });

  test('grid card', async ({ page, mockPage }) => {
    await mockPage().goto();

    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'Grid Card' }).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();

    await expect(page.getByText('Configure fields').first()).toBeVisible();
  });
});
