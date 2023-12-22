import { Page, oneTableBlockWithAddNewAndViewAndEditAndAdvancedFields, test } from '@nocobase/test/e2e';
import { commonTesting } from '../commonTesting';

test.describe('collection', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'collection', blockType: 'viewing', mode: 'options' });
});

test.describe('JSON', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'JSON', blockType: 'viewing', mode: 'options' });
});

test.describe('formula', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'formula', blockType: 'viewing', mode: 'options' });
});

test.describe('sequence', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'sequence', blockType: 'viewing', mode: 'options' });
});

const gotoPage = async (mockPage, mockRecord) => {
  const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAdvancedFields).waitForInit();
  await mockRecord('general');
  await nocoPage.goto();
};

const openDialog = async (page: Page) => {
  await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();
};

const showMenu = async (page: Page, fieldName: string) => {
  await page.getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`).hover();
  await page
    .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`)
    .hover();
};

async function openDialogAndShowMenu({
  page,
  mockPage,
  mockRecord,
  fieldName,
}: {
  page: Page;
  mockPage;
  mockRecord;
  fieldName: string;
}) {
  await gotoPage(mockPage, mockRecord);
  await openDialog(page);
  await showMenu(page, fieldName);
}
