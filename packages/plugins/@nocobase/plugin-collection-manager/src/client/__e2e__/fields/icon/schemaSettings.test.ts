import {
  Page,
  expect,
  expectSettingsMenu,
  oneTableBlockWithAddNewAndViewAndEditAndBasicFields,
  test,
} from '@nocobase/test/client';
import { createColumnItem, showSettingsMenu, testDefaultValue, testPattern } from '../utils';

test.describe('form item & create form', () => {
  test('supported options', async ({ page, mockPage }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByRole('button', { name: 'Add new' }).click();
        await page.getByLabel(`block-item-CollectionField-general-form-general.icon-icon`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.icon`)
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
        })(page, 'icon'),
      supportVariables: ['Constant', 'Current user', 'Date variables', 'Current form'],
      inputConstantValue: async () => {
        await page.getByLabel('block-item-VariableInput-').getByRole('button', { name: 'Select icon' }).click();
        await page.getByLabel('account-book').locator('svg').click();
      },
      expectConstantValue: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.icon-icon')
            .getByRole('button', { name: 'account-book' }),
        ).toBeVisible();
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
        })(page, 'icon'),
      expectEditable: async () => {
        // 默认情况下可以编辑图标
        await page.getByRole('button', { name: 'Select icon' }).click();
        await page.getByLabel('account-book').locator('svg').click();
      },
      expectReadonly: async () => {
        // 只读模式下，选择图标按钮会被禁用
        await expect(page.getByRole('button', { name: 'account-book' })).toBeDisabled();
      },
      expectEasyReading: async () => {
        // 按钮会消失，只剩下图标
        await expect(page.getByRole('button', { name: 'account-book' })).not.toBeVisible();
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.icon-icon').getByLabel('account-book'),
        ).toBeVisible();
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
        await page.getByLabel(`block-item-CollectionField-general-form-general.icon-icon`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.icon`)
          .hover();
      },
      supportedOptions: ['Edit field title', 'Display title', 'Edit description', 'Required', 'Pattern', 'Delete'],
    });
  });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
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
        })(page, 'icon'),
      expectEditable: async () => {
        // 默认情况下可以编辑图标
        await page.getByRole('button', { name: 'Select icon' }).click();
        await page.getByLabel('account-book').locator('svg').click();
      },
      expectReadonly: async () => {
        // 只读模式下，选择图标按钮会被禁用
        if (record.icon) {
          await expect(page.getByRole('button', { name: record.icon })).toBeDisabled();
        } else {
          await expect(page.getByRole('button', { name: 'Select icon' })).toBeDisabled();
        }
      },
      expectEasyReading: async () => {
        // 按钮会消失，只剩下图标
        if (record.icon) {
          await expect(page.getByRole('button', { name: record.icon })).not.toBeVisible();
          await expect(
            page.getByLabel('block-item-CollectionField-general-form-general.icon-icon').getByLabel(record.icon),
          ).toBeVisible();
        } else {
          await expect(page.getByRole('button', { name: 'Select icon' })).not.toBeVisible();
        }
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
        await page.getByLabel(`block-item-CollectionField-general-form-general.icon-icon`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.icon`)
          .hover();
      },
      supportedOptions: ['Edit field title', 'Display title', 'Delete', 'Edit tooltip'],
      unsupportedOptions: ['Set default value'],
    });
  });
});

test.describe('form item & filter form', () => {
  test('supported options', async ({ page }) => {});
});

test.describe('table column & table', () => {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await createColumnItem(page, 'icon');
        await showSettingsMenu(page, 'icon');
      },
      supportedOptions: ['Custom column title', 'Column width', 'Delete'],
    });
  });
});

test.describe('table column & table & record picker', () => {
  test('supported options', async ({ page }) => {});
});

test.describe('table column & table & Relationship block', () => {
  test('supported options', async ({ page }) => {});
});

test.describe('table column & sub table & create from', () => {
  test('supported options', async ({ page }) => {});
});

test.describe('table column & sub table & edit from', () => {
  test('supported options', async ({ page }) => {});
});

test.describe('table column & sub table & view from', () => {
  test('supported options', async ({ page }) => {});
});
