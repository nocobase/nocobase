import { Page, oneTableBlockWithAddNewAndViewAndEditAndBasicFields, test } from '@nocobase/test/client';
import { commonTesting } from '../commonTesting';

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

test.describe('color', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'color', blockType: 'viewing' });
});

test.describe('email', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'email', blockType: 'viewing' });
});

test.describe('icon', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'icon', blockType: 'viewing' });
});

test.describe('single line text', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'singleLineText', blockType: 'viewing' });
});

test.describe('integer', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'integer', blockType: 'viewing' });
});

test.describe('number', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'number', blockType: 'viewing' });
});

test.describe('password', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'password', blockType: 'viewing' });
});

test.describe('percent', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'percent', blockType: 'viewing' });
});

test.describe('phone', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'phone', blockType: 'viewing' });
});

test.describe('long text', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'longText', blockType: 'viewing' });
});

test.describe('URL', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'url', blockType: 'viewing' });
});
