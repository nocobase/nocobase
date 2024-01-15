import {
  expect,
  expectSettingsMenu,
  oneTableBlockWithAddNewAndViewAndEditAndMediaFields,
  test,
} from '@nocobase/test/e2e';
import { createColumnItem, showSettingsMenu, testDefaultValue, testPattern, testSetValidationRules } from '../../utils';

test.describe('form item & create form', () => {
  test('supported options', async ({ page, mockPage }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndMediaFields).waitForInit();
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByRole('button', { name: 'Add new' }).click();
        await page.getByLabel(`block-item-CollectionField-general-form-general.markdown-markdown`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.markdown`)
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
        'Set validation rules',
      ],
    });
  });

  test('set default value', async ({ page, mockPage, mockRecord }) => {
    await testDefaultValue({
      page,
      gotoPage: async () => {
        await mockPage(oneTableBlockWithAddNewAndViewAndEditAndMediaFields).goto();
      },
      openDialog: async () => {
        await page.getByRole('button', { name: 'Add new' }).click();
      },
      closeDialog: () => page.getByLabel('drawer-Action.Container-general-Add record-mask').click(),
      showMenu: async () => {
        await page
          .getByLabel(`block-item-CollectionField-general-form-general.markdown-markdown`, { exact: true })
          .hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.markdown`, {
            exact: true,
          })
          .hover();
      },
      supportVariables: ['Constant', 'Current user', 'Date variables', 'Current form'],
      constantValue: 'test markdown',
      expectConstantValue: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.markdown-markdown').getByRole('textbox'),
        ).toHaveValue('test markdown');
      },
    });
  });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    await testPattern({
      page,
      gotoPage: async () => {
        await mockPage(oneTableBlockWithAddNewAndViewAndEditAndMediaFields).goto();
      },
      openDialog: async () => {
        await page.getByRole('button', { name: 'Add new' }).click();
      },
      showMenu: async () => {
        await page
          .getByLabel(`block-item-CollectionField-general-form-general.markdown-markdown`, { exact: true })
          .hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.markdown`, {
            exact: true,
          })
          .hover();
      },
      expectEditable: async () => {
        await page
          .getByLabel('block-item-CollectionField-general-form-general.markdown-markdown')
          .getByRole('textbox')
          .click();
        await page
          .getByLabel('block-item-CollectionField-general-form-general.markdown-markdown')
          .getByRole('textbox')
          .fill('test markdown pattern');
      },
      expectReadonly: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.markdown-markdown').getByRole('textbox'),
        ).toBeDisabled();
      },
      expectEasyReading: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.markdown-markdown').getByRole('textbox'),
        ).not.toBeVisible();
        await expect(page.getByLabel('block-item-CollectionField-general-form-general.markdown-markdown')).toHaveText(
          `markdown:test markdown pattern`,
        );
      },
    });
  });

  test('Set validation rules', async ({ page, mockPage }) => {
    await testSetValidationRules({
      page,
      gotoPage: async () => {
        const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndMediaFields).waitForInit();
        await nocoPage.goto();
      },
      openDialog: async () => {
        await page.getByRole('button', { name: 'Add new' }).click();
      },
      showMenu: async () => {
        await page
          .getByLabel(`block-item-CollectionField-general-form-general.markdown-markdown`, { exact: true })
          .hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.markdown`, {
            exact: true,
          })
          .hover();
      },
    });
  });
});

test.describe('form item & edit form', () => {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndMediaFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
    // 等待弹窗内容渲染完成
    await page.waitForTimeout(1000);
    await page.getByLabel(`block-item-CollectionField-general-form-general.markdown-markdown`, { exact: true }).hover();
    await page
      .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.markdown`, {
        exact: true,
      })
      .hover();

    await expectSettingsMenu({
      page,
      showMenu: async () => {},
      supportedOptions: [
        'Edit field title',
        'Display title',
        'Edit description',
        'Required',
        'Set validation rules',
        'Pattern',
        'Delete',
      ],
      unsupportedOptions: ['Set default value'],
    });
  });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    let record: any = null;
    await testPattern({
      page,
      gotoPage: async () => {
        const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndMediaFields).waitForInit();
        record = await mockRecord('general');
        await nocoPage.goto();
      },
      openDialog: async () => {
        await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
        // 等待弹窗内容渲染完成
        await page.waitForTimeout(1000);
      },
      showMenu: async () => {
        await page
          .getByLabel(`block-item-CollectionField-general-form-general.markdown-markdown`, { exact: true })
          .hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.markdown`, {
            exact: true,
          })
          .hover();
      },
      expectEditable: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.markdown-markdown').getByRole('textbox'),
        ).toHaveValue(record.markdown);
      },
      expectReadonly: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.markdown-markdown').getByRole('textbox'),
        ).toBeDisabled();
      },
      expectEasyReading: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.markdown-markdown').getByRole('textbox'),
        ).not.toBeVisible();
        await expect(page.getByLabel('block-item-CollectionField-general-form-general.markdown-markdown')).toHaveText(
          `markdown:${record.markdown}`,
        );
      },
    });
  });

  test('Set validation rules', async ({ page, mockPage, mockRecord }) => {
    await testSetValidationRules({
      page,
      gotoPage: async () => {
        const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndMediaFields).waitForInit();
        await mockRecord('general');
        await nocoPage.goto();
      },
      openDialog: async () => {
        await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
        // 等待弹窗内容渲染完成
        await page.waitForTimeout(1000);
      },
      showMenu: async () => {
        await page
          .getByLabel(`block-item-CollectionField-general-form-general.markdown-markdown`, { exact: true })
          .hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.markdown`, {
            exact: true,
          })
          .hover();
      },
    });
  });
});

test.describe('form item & view form', () => {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndMediaFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();
        await page.getByLabel(`block-item-CollectionField-general-form-general.markdown-markdown`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.markdown`)
          .hover();
      },
      supportedOptions: ['Edit field title', 'Display title', 'Delete', 'Edit tooltip'],
      unsupportedOptions: ['Set default value'],
    });
  });
});

test.describe('table column & table', () => {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndMediaFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await createColumnItem(page, 'markdown');
        await showSettingsMenu(page, 'markdown');
      },
      supportedOptions: ['Custom column title', 'Column width', 'Delete'],
    });
  });
});
