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
        await page.getByLabel(`block-item-CollectionField-general-form-general.datetime-datetime`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.datetime`)
          .hover();
      },
      supportedOptions: [
        'Edit field title',
        'Display title',
        'Edit description',
        'Required',
        'Set default value',
        'Pattern',
        'Date display format',
        'Delete',
      ],
    });
  });

  test('set default value', async ({ page, mockPage, mockRecord }) => {
    await testDefaultValue({
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
      closeDialog: () => page.getByLabel('drawer-Action.Container-general-Add record-mask').click(),
      showMenu: () =>
        (async (page: Page, fieldName: string) => {
          await page.getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`).hover();
          await page
            .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`)
            .hover();
        })(page, 'datetime'),
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
        })(page, 'datetime'),
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
    await (async (mockPage) => {
      const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndDatetimeFields).waitForInit();
      await nocoPage.goto();
    })(mockPage);
    await (async (page: Page) => {
      await page.getByRole('button', { name: 'Add new' }).click();
    })(page);
    await (async (page: Page, fieldName: string) => {
      await page.getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`).hover();
      await page
        .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`)
        .hover();
    })(page, 'datetime');
    await page.getByRole('menuitem', { name: 'Date display format' }).click();
    await page.getByRole('button', { name: 'DD/MM/YYYY' }).click();
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
    ).toHaveValue(dayjs().format('DD/MM/YYYY'));
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
        await page.getByLabel(`block-item-CollectionField-general-form-general.datetime-datetime`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.datetime`)
          .hover();
      },
      supportedOptions: [
        'Edit field title',
        'Display title',
        'Edit description',
        'Required',
        'Pattern',
        'Date display format',
        'Delete',
      ],
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
        })(page, 'datetime'),
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
    const record = await (async (mockPage, mockRecord) => {
      const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndDatetimeFields).waitForInit();
      const record = await mockRecord('general');
      await nocoPage.goto();

      return record;
    })(mockPage, mockRecord);
    await (async (page: Page) => {
      await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
    })(page);
    await (async (page: Page, fieldName: string) => {
      await page.getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`).hover();
      await page
        .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`)
        .hover();
    })(page, 'datetime');
    await page.getByRole('menuitem', { name: 'Date display format' }).click();
    await page.getByRole('button', { name: 'DD/MM/YYYY' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await expect(
      page
        .getByLabel('block-item-CollectionField-general-form-general.datetime-datetime')
        .getByPlaceholder('Select date'),
    ).toHaveValue(dayjs(record.datetime).format('DD/MM/YYYY'));
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
        await page.getByLabel(`block-item-CollectionField-general-form-general.datetime-datetime`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.datetime`)
          .hover();
      },
      supportedOptions: ['Edit field title', 'Display title', 'Delete', 'Edit tooltip', 'Date display format'],
      unsupportedOptions: ['Set default value'],
    });
  });

  test('date display format', async ({ page, mockPage, mockRecord }) => {
    const record = await (async (mockPage, mockRecord) => {
      const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndDatetimeFields).waitForInit();
      const record = await mockRecord('general');
      await nocoPage.goto();

      return record;
    })(mockPage, mockRecord);
    await (async (page: Page) => {
      await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();
    })(page);
    await (async (page: Page, fieldName: string) => {
      await page.getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`).hover();
      await page
        .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`)
        .hover();
    })(page, 'datetime');
    await page.getByRole('menuitem', { name: 'Date display format' }).click();
    await page.getByRole('button', { name: 'DD/MM/YYYY' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await expect(page.getByLabel('block-item-CollectionField-general-form-general.datetime-datetime')).toHaveText(
      `datetime:${dayjs(record.datetime).format('DD/MM/YYYY')}`,
    );
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
        await createColumnItem(page, 'datetime');
        await showSettingsMenu(page, 'datetime');
      },
      supportedOptions: ['Custom column title', 'Column width', 'Sortable', 'Date display format', 'Delete'],
    });
  });

  test('date display format', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndDatetimeFields).waitForInit();
    const records = await mockRecords('general', 1);
    await nocoPage.goto();

    await createColumnItem(page, 'datetime');
    await showSettingsMenu(page, 'datetime');
    await page.getByRole('menuitem', { name: 'Date display format' }).click();
    await page.getByRole('button', { name: 'DD/MM/YYYY' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(
      page.getByRole('cell', { name: dayjs(records[0].datetime).format('DD/MM/YYYY'), exact: true }),
    ).toBeVisible();
  });
});
