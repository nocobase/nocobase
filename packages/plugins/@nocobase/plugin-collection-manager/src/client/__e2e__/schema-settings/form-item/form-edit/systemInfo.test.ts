import { Page, expect, oneTableBlockWithAddNewAndViewAndEditAndSystemInfoFields, test } from '@nocobase/test/e2e';
import { commonTesting } from '../commonTesting';

test.describe('created at', () => {
  commonTesting({
    openDialogAndShowMenu,
    fieldName: 'createdAt',
    fieldType: 'system',
    mode: 'options',
    blockType: 'editing',
  });

  test('options', async ({ page, mockPage, mockRecord }) => {
    await openDialogAndShowMenu({ page, mockPage, mockRecord, fieldName: 'createdAt' });
    await expect(page.getByRole('menuitem', { name: 'Edit tooltip' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Date display format' })).toBeVisible();
  });
});
test.describe('created by', () => {
  commonTesting({
    openDialogAndShowMenu,
    fieldName: 'createdBy',
    fieldType: 'system',
    mode: 'options',
    blockType: 'editing',
  });

  test('options', async ({ page, mockPage, mockRecord }) => {
    await openDialogAndShowMenu({ page, mockPage, mockRecord, fieldName: 'createdBy' });
    await expect(page.getByRole('menuitem', { name: 'Edit tooltip' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Enable link' })).toBeVisible();
  });
});
test.describe('id', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'id', fieldType: 'system', mode: 'options', blockType: 'editing' });

  test('options', async ({ page, mockPage, mockRecord }) => {
    await openDialogAndShowMenu({ page, mockPage, mockRecord, fieldName: 'id' });
    await expect(page.getByRole('menuitem', { name: 'Edit tooltip' })).toBeVisible();
  });
});
test.describe('table oid', () => {
  commonTesting({
    openDialogAndShowMenu,
    fieldName: 'tableoid',
    fieldType: 'system',
    mode: 'options',
    blockType: 'editing',
  });

  test('options', async ({ page, mockPage, mockRecord }) => {
    await openDialogAndShowMenu({ page, mockPage, mockRecord, fieldName: 'tableoid' });
    await expect(page.getByRole('menuitem', { name: 'Edit tooltip' })).toBeVisible();
  });
});
test.describe('last updated at', () => {
  commonTesting({
    openDialogAndShowMenu,
    fieldName: 'updatedAt',
    fieldType: 'system',
    mode: 'options',
    blockType: 'editing',
  });
});
test.describe('last updated by', () => {
  commonTesting({
    openDialogAndShowMenu,
    fieldName: 'updatedBy',
    fieldType: 'system',
    mode: 'options',
    blockType: 'editing',
  });

  test('options', async ({ page, mockPage, mockRecord }) => {
    await openDialogAndShowMenu({ page, mockPage, mockRecord, fieldName: 'updatedBy' });
    await expect(page.getByRole('menuitem', { name: 'Edit tooltip' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Enable link' })).toBeVisible();
  });
});

const gotoPage = async (mockPage, mockRecord) => {
  const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndSystemInfoFields).waitForInit();
  const record = await mockRecord('general');
  await nocoPage.goto();

  return record;
};

const openDialog = async (page: Page) => {
  await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
};

const showMenu = async (page: Page, fieldName: string) => {
  await page.getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-`).hover();
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
