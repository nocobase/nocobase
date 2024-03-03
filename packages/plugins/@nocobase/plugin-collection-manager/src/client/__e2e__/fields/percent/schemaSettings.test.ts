import {
  Page,
  expect,
  expectSettingsMenu,
  oneTableBlockWithAddNewAndViewAndEditAndBasicFields,
  test,
} from '@nocobase/test/e2e';
import { createColumnItem, showSettingsMenu, testDefaultValue, testPattern, testSetValidationRules } from '../../utils';

test.describe('form item & create form', () => {
  test('supported options', async ({ page, mockPage }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByRole('button', { name: 'Add new' }).click();
        await page.getByLabel(`block-item-CollectionField-general-form-general.percent-percent`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.percent`)
          .hover();
      },
      supportedOptions: [
        'Edit field title',
        'Display title',
        'Edit description',
        'Pattern',
        'Delete',
        'required',
        'Set default value',
        'Set validation rules',
      ],
    });
  });

  test('set default value', async ({ page, mockPage }) => {
    await testDefaultValue({
      page,
      gotoPage: () =>
        (async (mockPage) => {
          const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
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
        })(page, 'percent'),
      supportVariables: ['Constant', 'Current user', 'Date variables', 'Current form'],
      inputConstantValue: async () => {
        await page.getByLabel('block-item-VariableInput-').getByRole('spinbutton').click();
        await page.getByLabel('block-item-VariableInput-').getByRole('spinbutton').fill('11.22');
      },
      variableValue: ['Current user', 'ID'], // 值为 1
      expectConstantValue: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.percent-percent').getByRole('spinbutton'),
        ).toHaveValue('11.22');
      },
      expectVariableValue: async () => {
        // 数字 1 转换为百分比后为 100%
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.percent-percent').getByRole('spinbutton'),
        ).toHaveValue('100');
      },
    });
  });

  // TODO: percent 类型的字段，当输入了小数，然后把 Pattern 切换成 Easy-reading 模式，小数点不应该被去掉；
  test.skip('pattern', async ({ page, mockPage }) => {
    await testPattern({
      page,
      gotoPage: () =>
        (async (mockPage) => {
          const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
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
        })(page, 'percent'),
      expectEditable: async () => {
        // 默认情况下可以编辑
        await page
          .getByLabel('block-item-CollectionField-general-form-general.percent-percent')
          .getByRole('spinbutton')
          .click();
        await page
          .getByLabel('block-item-CollectionField-general-form-general.percent-percent')
          .getByRole('spinbutton')
          .fill('11.22');
      },
      expectReadonly: async () => {
        // 只读模式下，输入框会被禁用
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.percent-percent').getByRole('spinbutton'),
        ).toBeDisabled();
      },
      expectEasyReading: async () => {
        // 输入框会消失，只剩下值
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.percent-percent').getByRole('spinbutton'),
        ).not.toBeVisible();
        await expect(page.getByLabel('block-item-CollectionField-general-form-general.percent-percent')).toHaveText(
          'percent:11.22%',
        );
      },
    });
  });

  test('set validation rules', async ({ page, mockPage }) => {
    await testSetValidationRules({
      page,
      gotoPage: () =>
        (async (mockPage) => {
          const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
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
        })(page, 'percent'),
    });
  });
});

test.describe('form item & edit form', () => {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
        await page.getByLabel(`block-item-CollectionField-general-form-general.percent-percent`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.percent`)
          .hover();
      },
      supportedOptions: [
        'Edit field title',
        'Display title',
        'Edit description',
        'Required',
        'Set validation rules',
        'Pattern',
        'Delete',
      ],
    });
  });

  // TODO: percent 类型的字段，当输入了小数，然后把 Pattern 切换成 Easy-reading 模式，小数点不应该被去掉；
  test.skip('pattern', async ({ page, mockPage, mockRecord }) => {
    let record = null;
    await testPattern({
      page,
      gotoPage: async () => {
        record = await (async (mockPage, mockRecord) => {
          const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
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
        })(page, 'percent'),
      expectEditable: async () => {
        // 应该显示 record 中的值
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.percent-percent').getByRole('spinbutton'),
        ).toHaveValue(String(record.percent));

        // 默认情况下可以编辑
        await page
          .getByLabel('block-item-CollectionField-general-form-general.percent-percent')
          .getByRole('spinbutton')
          .click();
        await page
          .getByLabel('block-item-CollectionField-general-form-general.percent-percent')
          .getByRole('spinbutton')
          .fill('11.22');
      },
      expectReadonly: async () => {
        // 只读模式下，输入框会被禁用
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.percent-percent').getByRole('spinbutton'),
        ).toBeDisabled();
      },
      expectEasyReading: async () => {
        // 输入框会消失，只剩下值
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.percent-percent').getByRole('spinbutton'),
        ).not.toBeVisible();
        await expect(page.getByLabel('block-item-CollectionField-general-form-general.percent-percent')).toHaveText(
          'percent:11.22%',
        );
      },
    });
  });

  test('set validation rules', async ({ page, mockPage, mockRecord }) => {
    await testSetValidationRules({
      page,
      gotoPage: () =>
        (async (mockPage, mockRecord) => {
          const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
          const record = await mockRecord('general');
          await nocoPage.goto();

          return record;
        })(mockPage, mockRecord),
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
        })(page, 'percent'),
    });
  });
});

test.describe('form item & view form', () => {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();
        await page.getByLabel(`block-item-CollectionField-general-form-general.percent-percent`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.percent`)
          .hover();
      },
      supportedOptions: ['Edit field title', 'Display title', 'Delete', 'Edit tooltip'],
      unsupportedOptions: ['Set default value'],
    });
  });
});

test.describe('table column & table', () => {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await createColumnItem(page, 'percent');
        await showSettingsMenu(page, 'percent');
      },
      supportedOptions: ['Custom column title', 'Column width', 'Sortable', 'Delete'],
    });
  });
});
