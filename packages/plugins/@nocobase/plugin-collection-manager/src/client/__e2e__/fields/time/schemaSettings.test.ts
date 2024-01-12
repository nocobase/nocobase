import {
  Page,
  expect,
  expectSettingsMenu,
  oneTableBlockWithAddNewAndViewAndEditAndDatetimeFields,
  test,
} from '@nocobase/test/e2e';
import dayjs from 'dayjs';
import { createColumnItem, showSettingsMenu, testDefaultValue, testPattern } from '../../utils';

test.describe('form item & create form', () => {
  test('supported options', async ({ page, mockPage }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndDatetimeFields).waitForInit();
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByRole('button', { name: 'Add new' }).click();
        await page.getByLabel(`block-item-CollectionField-general-form-general.time-time`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.time`)
          .hover();
      },
      supportedOptions: [
        'Edit field title',
        'Display title',
        'Edit description',
        'Required',
        'Set default value',
        'Pattern',
        'Delete',
      ],
    });
  });

  test('set default value', async ({ page, mockPage, mockRecord }) => {
    let nowTime;
    await testDefaultValue({
      page,
      gotoPage: async () => {
        const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndDatetimeFields).waitForInit();
        await nocoPage.goto();
      },
      openDialog: async () => {
        await page.getByRole('button', { name: 'Add new' }).click();
      },
      closeDialog: () => page.getByLabel('drawer-Action.Container-general-Add record-mask').click(),
      showMenu: async () => {
        await page.getByLabel(`block-item-CollectionField-general-form-general.time-time`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.time`)
          .hover();
      },
      supportVariables: ['Constant', 'Current user', 'Date variables', 'Current form'],
      inputConstantValue: async () => {
        await page.getByLabel('block-item-VariableInput-').getByPlaceholder('Select time').click();
        await page.getByText('Now').click();
        nowTime = dayjs();
      },
      expectConstantValue: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.time-time').getByPlaceholder('Select time'),
        ).toHaveValue(new RegExp(nowTime.format('HH:')));
      },
    });
  });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    await testPattern({
      page,
      gotoPage: () =>
        (async (mockPage) => {
          const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndDatetimeFields).waitForInit();
          await nocoPage.goto();
        })(mockPage),
      openDialog: () =>
        (async (page: Page) => {
          await page.getByRole('button', { name: 'Add new' }).click();
        })(page),
      showMenu: () =>
        (async (page: Page, fieldName: string) => {
          await page.getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`).hover();
          await page
            .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`)
            .hover();
        })(page, 'time'),
      expectEditable: async () => {
        await page
          .getByLabel('block-item-CollectionField-general-form-general.time-time')
          .getByPlaceholder('Select time')
          .click();
        await page.getByText('Now', { exact: true }).click();
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

test.describe('form item & edit form', () => {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndDatetimeFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
        await page.getByLabel(`block-item-CollectionField-general-form-general.time-time`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.time`)
          .hover();
      },
      supportedOptions: ['Edit field title', 'Display title', 'Edit description', 'Required', 'Pattern', 'Delete'],
      unsupportedOptions: ['Set default value'],
    });
  });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    let record = null;
    await testPattern({
      page,
      gotoPage: async () => {
        record = await (async (mockPage, mockRecord) => {
          const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndDatetimeFields).waitForInit();
          const record = await mockRecord('general');
          await nocoPage.goto();

          return record;
        })(mockPage, mockRecord);
      },
      openDialog: () =>
        (async (page: Page) => {
          await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
        })(page),
      showMenu: () =>
        (async (page: Page, fieldName: string) => {
          await page.getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`).hover();
          await page
            .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`)
            .hover();
        })(page, 'time'),
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

test.describe('form item & view form', () => {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndDatetimeFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();
        await page.getByLabel(`block-item-CollectionField-general-form-general.time-time`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.time`)
          .hover();
      },
      supportedOptions: ['Edit field title', 'Display title', 'Delete', 'Edit tooltip'],
      unsupportedOptions: ['Set default value'],
    });
  });
});

test.describe('table column & table', () => {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndDatetimeFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await createColumnItem(page, 'time');
        await showSettingsMenu(page, 'time');
      },
      supportedOptions: ['Custom column title', 'Column width', 'Sortable', 'Delete'],
    });
  });
});
