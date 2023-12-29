import {
  Page,
  expect,
  expectSettingsMenu,
  oneTableBlockWithAddNewAndViewAndEditAndBasicFields,
  test,
} from '@nocobase/test/e2e';
import { createColumnItem, showSettingsMenu, testDefaultValue, testPattern } from '../../utils';

test.describe('form item & create form', () => {
  test('supported options', async ({ page, mockPage }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByRole('button', { name: 'Add new' }).click();
        await page.getByLabel(`block-item-CollectionField-general-form-general.url-url`).hover();
        await page.getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.url`).hover();
      },
      supportedOptions: [
        'Edit field title',
        'Display title',
        'Edit description',
        'Pattern',
        'Delete',
        'required',
        'Set default value',
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
      closeDialog: async () => {
        await page.getByLabel('drawer-Action.Container-general-Add record-mask').click();
      },
      showMenu: () =>
        (async (page: Page, fieldName: string) => {
          await page.getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`).hover();
          await page
            .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`)
            .hover();
        })(page, 'url'),
      supportVariables: ['Constant', 'Current user', 'Date variables', 'Current form'],
      constantValue: 'https://nocobase.com',
      variableValue: ['Current user', 'Email'], // 值为 admin@nocobase.com
      expectConstantValue: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.url-url').getByRole('textbox'),
        ).toHaveValue('https://nocobase.com');
      },
      expectVariableValue: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.url-url').getByRole('textbox'),
        ).toHaveValue('admin@nocobase.com');
      },
    });
  });

  test('pattern', async ({ page, mockPage }) => {
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
        })(page, 'url'),
      expectEditable: async () => {
        // 默认情况下可以编辑
        await page.getByLabel('block-item-CollectionField-general-form-general.url-url').getByRole('textbox').click();
        await page
          .getByLabel('block-item-CollectionField-general-form-general.url-url')
          .getByRole('textbox')
          .fill('https://nocobase.com');
      },
      expectReadonly: async () => {
        // 只读模式下，输入框会被禁用
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.url-url').getByRole('textbox'),
        ).toBeDisabled();
      },
      expectEasyReading: async () => {
        // 输入框会消失，只剩下值
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.url-url').getByRole('textbox'),
        ).not.toBeVisible();
        await expect(page.getByLabel('block-item-CollectionField-general-form-general.url-url')).toHaveText(
          'url:https://nocobase.com',
        );
      },
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
        await page.getByLabel(`block-item-CollectionField-general-form-general.url-url`).hover();
        await page.getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.url`).hover();
      },
      supportedOptions: ['Edit field title', 'Display title', 'Edit description', 'Required', 'Pattern', 'Delete'],
    });
  });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    let record: any = null;
    await testPattern({
      page,
      gotoPage: async () => {
        const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
        record = await mockRecord('general');
        await nocoPage.goto();
      },
      openDialog: async () => {
        await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
      },
      showMenu: async () => {
        await page.getByLabel(`block-item-CollectionField-general-form-general.url-url`).hover();
        await page.getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.url`).hover();
      },
      expectEditable: async () => {
        // 默认情况下可以编辑
        await page.getByLabel('block-item-CollectionField-general-form-general.url-url').getByRole('textbox').click();
        await page
          .getByLabel('block-item-CollectionField-general-form-general.url-url')
          .getByRole('textbox')
          .fill('https://nocobase.com');
      },
      expectReadonly: async () => {
        // 只读模式下，输入框会被禁用
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.url-url').getByRole('textbox'),
        ).toBeDisabled();
      },
      expectEasyReading: async () => {
        // url 类型数据不会被 mock，所以这里不会显示值
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.url-url').getByRole('textbox'),
        ).not.toBeVisible();
        await expect(page.getByLabel('block-item-CollectionField-general-form-general.url-url')).toHaveText(
          'url:https://nocobase.com',
        );
      },
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
        await page.getByLabel(`block-item-CollectionField-general-form-general.url-url`).hover();
        await page.getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.url`).hover();
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
        await createColumnItem(page, 'url');
        await showSettingsMenu(page, 'url');
      },
      supportedOptions: ['Custom column title', 'Column width', 'Delete'],
    });
  });
});
