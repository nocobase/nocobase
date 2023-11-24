import { Page, expect, oneTableBlockWithAddNewAndViewAndEditAndDatetimeFields, test } from '@nocobase/test/client';
import dayjs from 'dayjs';
import { commonTesting, testDefaultValue, testPattern } from '../commonTesting';

const gotoPage = async (mockPage) => {
  const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndDatetimeFields).waitForInit();
  await nocoPage.goto();
};

const openDialog = async (page: Page) => {
  await page.getByRole('button', { name: 'Add new' }).click();
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
  await gotoPage(mockPage);
  await openDialog(page);
  await showMenu(page, fieldName);
};

test.describe('datetime', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'datetime', blockType: 'creating', mode: 'options' });

  test('set default value', async ({ page, mockPage, mockRecord }) => {
    await testDefaultValue({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      closeDialog: () => page.getByLabel('drawer-Action.Container-general-Add record-mask').click(),
      showMenu: () => showMenu(page, 'datetime'),
      supportVariables: ['Constant', 'Current user', 'Date variables', 'Current form'],
      inputConstantValue: async () => {
        await page.getByLabel('block-item-VariableInput-').getByPlaceholder('Select date').click();
        await page.getByText('Today').click();
      },
      expectConstantValue: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.datetime-datetime')
            .getByPlaceholder('Select date'),
        ).toHaveValue(dayjs().format('YYYY-MM-DD'));
      },
    });
  });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    await testPattern({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'datetime'),
      expectEditable: async () => {
        await page
          .getByLabel('block-item-CollectionField-general-form-general.datetime-datetime')
          .getByPlaceholder('Select date')
          .click();
        await page.getByText('Today').click();
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
          `datetime:${dayjs().format('YYYY-MM-DD')}`,
        );
      },
    });
  });

  test('date display format', async ({ page, mockPage, mockRecord }) => {
    await openDialogAndShowMenu({ page, mockPage, mockRecord, fieldName: 'datetime' });
    await page.getByRole('menuitem', { name: 'Date display format' }).click();
    await page.getByLabel('YYYY/MM/DD').click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 输入一个值，然后验证格式是否正确
    await page
      .getByLabel('block-item-CollectionField-general-form-general.datetime-datetime')
      .getByPlaceholder('Select date')
      .click();
    await page.getByText('Today').click();

    await expect(
      page
        .getByLabel('block-item-CollectionField-general-form-general.datetime-datetime')
        .getByPlaceholder('Select date'),
    ).toHaveValue(dayjs().format('YYYY/MM/DD'));
  });
});
test.describe('time', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'time', blockType: 'creating', mode: 'options' });

  test('set default value', async ({ page, mockPage, mockRecord }) => {
    await testDefaultValue({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      closeDialog: () => page.getByLabel('drawer-Action.Container-general-Add record-mask').click(),
      showMenu: () => showMenu(page, 'time'),
      supportVariables: ['Constant', 'Current user', 'Date variables', 'Current form'],
      inputConstantValue: async () => {
        await page.getByLabel('block-item-VariableInput-').getByPlaceholder('Select time').click();
        await page.getByText('Now').click();
      },
      expectConstantValue: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.time-time').getByPlaceholder('Select time'),
        ).toHaveValue(new RegExp(dayjs().format('HH:mm:'))); // 去掉后面的秒，是因为可能因为延迟导致秒数不一致
      },
    });
  });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    await testPattern({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'time'),
      expectEditable: async () => {
        await page
          .getByLabel('block-item-CollectionField-general-form-general.time-time')
          .getByPlaceholder('Select time')
          .click();
        await page.getByText('Now').click();
      },
      expectReadonly: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.time-time').getByPlaceholder('Select time'),
        ).toBeDisabled();
      },
      expectEasyReading: async () => {
        await expect(page.getByLabel('block-item-CollectionField-general-form-general.time-time')).toHaveText(
          new RegExp(`time:${dayjs().format('HH:mm:')}`),
        );
      },
    });
  });
});
