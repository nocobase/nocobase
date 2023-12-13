import { NocoPage, Page, PageConfig, oneFormBlockWithAllAssociationFieldsAndSelectorMode } from '@nocobase/test/client';

export async function createTable({
  page,
  mockPage,
  fieldName,
}: {
  fieldName: string;
  page: Page;
  mockPage: (config?: PageConfig) => NocoPage;
}) {
  await mockPage(oneFormBlockWithAllAssociationFieldsAndSelectorMode).goto();

  // open dialog
  await page
    .getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`)
    .getByTestId('select-data-picker')
    .click();

  // create a table block
  await page.getByLabel('schema-initializer-Grid-TableSelectorInitializers-users').hover();
  await page.getByRole('menuitem', { name: 'form Table' }).click();
  await page.mouse.move(300, 0);
}
