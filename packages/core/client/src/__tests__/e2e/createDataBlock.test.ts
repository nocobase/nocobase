import { expect, test } from '@nocobase/test/client';

test.describe('create data block', () => {
  test('table', async ({ page, mockPage }) => {
    await mockPage().goto();

    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-table', { exact: true }).hover();
    await page.getByLabel('dataBlocks-table-Users').click();

    await expect(page.getByText('Configure columns')).toBeVisible();
  });

  test('form', async ({ page, mockPage }) => {
    await mockPage().goto();

    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-form', { exact: true }).hover();
    await page.getByLabel('dataBlocks-form-Users').click();

    await expect(page.getByText('Configure fields')).toBeVisible();
  });

  test('details', async ({ page, mockPage }) => {
    await mockPage().goto();

    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-details', { exact: true }).hover();
    await page.getByLabel('dataBlocks-details-Users').click();

    await expect(page.getByText('Configure fields')).toBeVisible();
  });

  test('list', async ({ page, mockPage }) => {
    await mockPage().goto();

    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-List', { exact: true }).hover();
    await page.getByLabel('dataBlocks-List-Users').click();

    await expect(page.getByText('Configure fields').first()).toBeVisible();
  });

  test('grid card', async ({ page, mockPage }) => {
    await mockPage().goto();

    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByLabel('dataBlocks-GridCard', { exact: true }).hover();
    await page.getByLabel('dataBlocks-GridCard-Users').click();

    await expect(page.getByText('Configure fields').first()).toBeVisible();
  });
});
