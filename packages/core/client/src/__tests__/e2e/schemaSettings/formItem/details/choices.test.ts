import { Page, oneTableBlockWithAddNewAndViewAndEditAndChoicesFields, test } from '@nocobase/test/client';
import { commonTesting } from '../commonTesting';

const gotoPage = async (mockPage, mockRecord) => {
  const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndChoicesFields).waitForInit();
  const record = await mockRecord('general');
  await nocoPage.goto();

  return record;
};

const openDialog = async (page: Page) => {
  await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();
};

const showMenu = async (page: Page, fieldName: string) => {
  await page
    .getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`, { exact: true })
    .hover();
  await page
    .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`, {
      exact: true,
    })
    .hover();
};

const openDialogAndShowMenu = async ({
  page,
  mockPage,
  mockRecord,
  fieldName,
}: {
  page: Page;
  mockPage;
  mockRecord;
  fieldName: string;
}) => {
  await gotoPage(mockPage, mockRecord);
  await openDialog(page);
  await showMenu(page, fieldName);
};

test.describe('checkbox', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'checkbox', blockType: 'viewing', mode: 'options' });
});

test.describe('checkbox group', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'checkboxGroup', blockType: 'viewing', mode: 'options' });
});

test.describe('china region', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'chinaRegion', blockType: 'viewing', mode: 'options' });
});

test.describe('multiple select', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'multipleSelect', blockType: 'viewing', mode: 'options' });
});

test.describe('radio group', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'radioGroup', blockType: 'viewing', mode: 'options' });
});

test.describe('single select', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'singleSelect', blockType: 'viewing', mode: 'options' });
});
