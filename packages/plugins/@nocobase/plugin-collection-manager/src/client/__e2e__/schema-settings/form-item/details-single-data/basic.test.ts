import { Page, oneTableBlockWithAddNewAndViewAndEditAndBasicFields, test } from '@nocobase/test/e2e';
import { commonTesting } from '../commonTesting';

test.describe('color', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'color', blockType: 'viewing' });
});

test.describe('email', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'email', blockType: 'viewing', mode: 'options' });
});

test.describe('icon', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'icon', blockType: 'viewing', mode: 'options' });
});

test.describe('single line text', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'singleLineText', blockType: 'viewing', mode: 'options' });
});

test.describe('integer', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'integer', blockType: 'viewing', mode: 'options' });
});

test.describe('number', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'number', blockType: 'viewing', mode: 'options' });
});

test.describe('password', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'password', blockType: 'viewing', mode: 'options' });
});

test.describe('percent', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'percent', blockType: 'viewing', mode: 'options' });
});

test.describe('phone', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'phone', blockType: 'viewing', mode: 'options' });
});

test.describe('long text', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'longText', blockType: 'viewing', mode: 'options' });
});

test.describe('URL', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'url', blockType: 'viewing', mode: 'options' });
});

const gotoPage = async (mockPage, mockRecord) => {
  const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
  const record = await mockRecord('general');
  await nocoPage.goto();

  return record;
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
