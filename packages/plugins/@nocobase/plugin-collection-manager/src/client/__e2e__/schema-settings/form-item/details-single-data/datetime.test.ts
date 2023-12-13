import { Page, expect, oneTableBlockWithAddNewAndViewAndEditAndDatetimeFields, test } from '@nocobase/test/client';
import dayjs from 'dayjs';
import { commonTesting } from '../commonTesting';

test.describe('datetime', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'datetime', blockType: 'viewing', mode: 'options' });

  test('date display format', async ({ page, mockPage, mockRecord }) => {
    const record = await openDialogAndShowMenu({ page, mockPage, mockRecord, fieldName: 'datetime' });
    await page.getByRole('menuitem', { name: 'Date display format' }).click();
    await page.getByLabel('YYYY/MM/DD').click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await expect(page.getByLabel('block-item-CollectionField-general-form-general.datetime-datetime')).toHaveText(
      `datetime:${dayjs(record.datetime).format('YYYY/MM/DD')}`,
    );
  });
});

test.describe('time', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'time', blockType: 'viewing', mode: 'options' });
});

const gotoPage = async (mockPage, mockRecord) => {
  const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndDatetimeFields).waitForInit();
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
  const record = await gotoPage(mockPage, mockRecord);
  await openDialog(page);
  await showMenu(page, fieldName);

  return record;
}
