import { expect, test, oneEmptyDetailsBlock, oneEmptyTableBlockWithCustomizeActions } from '@nocobase/test/client';
import { oneEmptyGantt } from './utils';

test.describe('places where duplicate action can be created', () => {
  test('duplicate action in table block', async ({ page, mockPage, mockCollections, mockRecords }) => {
    const nocoPage = await mockPage(oneEmptyTableBlockWithCustomizeActions).waitForInit();
    await mockRecords('general', 3);
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Actions' }).hover();
    await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-general').hover();
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();
    await expect(await page.getByLabel('action-Action.Link-Duplicate-duplicate-general-table-0')).toBeVisible();
  });
  test('duplicate action in gantt block', async ({ page, mockPage, mockCollections, mockRecords }) => {
    const nocoPage = await mockPage(oneEmptyGantt).waitForInit();
    await mockRecords('general', 3);
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Actions' }).hover();
    await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-general').hover();
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();
    await expect(await page.getByLabel('action-Action.Link-Duplicate-duplicate-general-table-0')).toBeVisible();
  });
  test('duplicate action in detail block', async ({ page, mockPage }) => {
    await mockPage(oneEmptyDetailsBlock).goto();
    await page.getByLabel('schema-initializer-ActionBar-DetailsActionInitializers-general').click();
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();
    await expect(page.getByLabel('action-Action-Duplicate-duplicate-general-details')).toBeVisible();
  });
});
