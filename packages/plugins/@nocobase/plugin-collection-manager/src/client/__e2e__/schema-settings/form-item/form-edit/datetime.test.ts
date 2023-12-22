import { Page, expect, oneTableBlockWithAddNewAndViewAndEditAndDatetimeFields, test } from '@nocobase/test/e2e';
import dayjs from 'dayjs';
import { commonTesting, testPattern } from '../commonTesting';

test.describe('datetime', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'datetime', blockType: 'editing', mode: 'options' });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    let record = null;
    await testPattern({
      page,
      gotoPage: async () => {
        record = await gotoPage(mockPage, mockRecord);
      },
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'datetime'),
      expectEditable: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.datetime-datetime')
            .getByPlaceholder('Select date'),
        ).toHaveValue(dayjs(record.datetime).format('YYYY-MM-DD'));
      },
      expectReadonly: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.datetime-datetime')
            .getByPlaceholder('Select date'),
        ).toBeDisabled();
      },
      expectEasyReading: async () => {
        await expect(page.getByLabel('block-item-CollectionField-general-form-general.datetime-datetime')).toHaveText(
          `datetime:${dayjs(record.datetime).format('YYYY-MM-DD')}`,
        );
      },
    });
  });

  test('date display format', async ({ page, mockPage, mockRecord }) => {
    const record = await openDialogAndShowMenu({ page, mockPage, mockRecord, fieldName: 'datetime' });
    await page.getByRole('menuitem', { name: 'Date display format' }).click();
    await page.getByLabel('YYYY/MM/DD').click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await expect(
      page
        .getByLabel('block-item-CollectionField-general-form-general.datetime-datetime')
        .getByPlaceholder('Select date'),
    ).toHaveValue(dayjs(record.datetime).format('YYYY/MM/DD'));
  });
});

test.describe('time', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'time', blockType: 'editing', mode: 'options' });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    let record = null;
    await testPattern({
      page,
      gotoPage: async () => {
        record = await gotoPage(mockPage, mockRecord);
      },
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'time'),
      expectEditable: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.time-time').getByPlaceholder('Select time'),
        ).toHaveValue(record.time);
      },
      expectReadonly: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.time-time').getByPlaceholder('Select time'),
        ).toBeDisabled();
      },
      expectEasyReading: async () => {
        await expect(page.getByLabel('block-item-CollectionField-general-form-general.time-time')).toHaveText(
          new RegExp(`time:${record.time}`),
        );
      },
    });
  });
});

const gotoPage = async (mockPage, mockRecord) => {
  const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndDatetimeFields).waitForInit();
  const record = await mockRecord('general');
  await nocoPage.goto();

  return record;
};

const openDialog = async (page: Page) => {
  await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
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
