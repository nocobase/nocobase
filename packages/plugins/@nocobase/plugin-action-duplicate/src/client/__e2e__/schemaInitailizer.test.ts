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
    await page.getByRole('button', { name: 'Actions', exact: true }).hover();
    await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-general').hover();
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();
    await expect(page.getByLabel('action-Action.Link-Duplicate-duplicate-general-table-0')).toBeVisible();
  });
});
