import {
  expect,
  oneEmptyDetailsBlock,
  oneEmptyTableBlockWithActions,
  oneEmptyTableBlockWithCustomizeActions,
  test,
} from '@nocobase/test/e2e';

test.describe('TableActionColumnInitializers & DetailsActionInitializers & ReadPrettyFormActionInitializers should add duplication action', () => {
  test('duplication action in TableActionColumnInitializers', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneEmptyTableBlockWithCustomizeActions).waitForInit();
    await mockRecords('general', 3);
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Actions' }).hover();
    await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-general').hover();
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();
    await expect(page.getByLabel('action-Action.Link-Duplicate-duplicate-general-table-0')).toBeVisible();
  });
  test('duplication action in DetailsActionInitializers', async ({ page, mockPage }) => {
    await mockPage(oneEmptyDetailsBlock).goto();
    await page.getByLabel('schema-initializer-ActionBar-DetailsActionInitializers-general').click();
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();
    await expect(page.getByLabel('action-Action-Duplicate-duplicate-general-details')).toBeVisible();
  });
  test('duplicate action in ReadPrettyFormActionInitializers', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();
    await page.getByLabel('view').click();
    await page.getByLabel('schema-initializer-Grid-RecordBlockInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'form Details' }).click();
    await page.getByLabel('schema-initializer-ActionBar-ReadPrettyFormActionInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();
    await expect(page.getByLabel('action-Action-Duplicate-duplicate-general-form')).toBeVisible();
  });
});
