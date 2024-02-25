import {
  Page,
  expect,
  expectSettingsMenu,
  oneTableBlockWithAddNewAndViewAndEditAndBasicFields,
  test,
} from '@nocobase/test/e2e';
import {
  clickDeleteAndOk,
  createColumnItem,
  showSettingsMenu,
  testDisplayTitle,
  testEditDescription,
  testEditFieldTitle,
  testPattern,
  testRequired,
} from '../../utils';

test.describe('form item & create form', () => {
  test('set default value', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel(`block-item-CollectionField-general-form-general.color-color`).hover();
    await page.getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.color`).hover();
    // 简单测试下是否有选项，值的话无法选中，暂时测不了
    await expect(page.getByRole('menuitem', { name: 'Set default value' })).toBeVisible();
  });

  test('pattern', async ({ page, mockPage }) => {
    await testPattern({
      page,
      gotoPage: async () => {
        const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
        await nocoPage.goto();
      },
      openDialog: async () => {
        await page.getByRole('button', { name: 'Add new' }).click();
      },
      showMenu: async () => {
        await page.getByLabel(`block-item-CollectionField-general-form-general.color-color`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.color`)
          .hover();
      },
      expectEditable: async () => {
        // 默认情况下显示颜色选择框
        await page.getByLabel('color-picker-normal').hover();
        await expect(page.getByRole('button', { name: 'right Recommended', exact: true })).toBeVisible();
      },
      expectReadonly: async () => {
        // 只读模式下，不会显示颜色弹窗
        await page.getByLabel('color-picker-normal').hover();
        await expect(page.getByRole('button', { name: 'right Recommended', exact: true })).not.toBeVisible();
      },
      expectEasyReading: async () => {
        await expect(page.getByLabel('color-picker-read-pretty')).toBeVisible();
      },
    });
  });

  test('edit field title', async ({ page, mockPage, mockRecord, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel(`block-item-CollectionField-general-form-general.color-color`).hover();
    await page.getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.color`).hover();

    await testEditFieldTitle(page);
  });

  test('display title', async ({ page, mockPage, mockRecord, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel(`block-item-CollectionField-general-form-general.color-color`).hover();
    await page.getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.color`).hover();

    await testDisplayTitle(page, 'color');
  });

  test('delete', async ({ page, mockPage, mockRecord, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel(`block-item-CollectionField-general-form-general.color-color`).hover();
    await page.getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.color`).hover();

    await clickDeleteAndOk(page);
    await expect(page.getByText(`color:`)).not.toBeVisible();
  });

  test('edit description', async ({ page, mockPage, mockRecord, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel(`block-item-CollectionField-general-form-general.color-color`).hover();
    await page.getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.color`).hover();

    await testEditDescription(page);
  });

  test('required', async ({ page, mockPage, mockRecord, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel(`block-item-CollectionField-general-form-general.color-color`).hover();
    await page.getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.color`).hover();

    await testRequired(page);
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
        await page.getByLabel(`block-item-CollectionField-general-form-general.color-color`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.color`)
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
        })(page, 'color'),
      expectEditable: async () => {
        // 默认情况下显示颜色选择框
        await page.getByLabel('color-picker-normal').hover();
        await expect(page.getByRole('button', { name: 'right Recommended', exact: true })).toBeVisible();
      },
      expectReadonly: async () => {
        // 只读模式下，不会显示颜色弹窗
        await page.getByLabel('color-picker-normal').hover();
        await expect(page.getByRole('button', { name: 'right Recommended', exact: true })).not.toBeVisible();
      },
      expectEasyReading: async () => {
        await expect(page.getByLabel('color-picker-read-pretty')).toBeVisible();
      },
    });
  });
});

test.describe('form item & view form', () => {
  test('edit field title', async ({ page, mockPage, mockRecord, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();
    await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();
    await page.getByLabel(`block-item-CollectionField-general-form-general.color-color`).hover();
    await page.getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.color`).hover();
    await testEditFieldTitle(page);
  });

  test('display title', async ({ page, mockPage, mockRecord, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();
    await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();
    await page.getByLabel(`block-item-CollectionField-general-form-general.color-color`).hover();
    await page.getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.color`).hover();
    await testDisplayTitle(page, 'color');
  });

  test('delete', async ({ page, mockPage, mockRecord, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();
    await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();
    await page.getByLabel(`block-item-CollectionField-general-form-general.color-color`).hover();
    await page.getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.color`).hover();
    await clickDeleteAndOk(page);
    await expect(page.getByText(`color:`)).not.toBeVisible();
  });

  test('edit tooltip', async ({ page, mockPage, mockRecord, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();
    await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();
    await page.getByLabel(`block-item-CollectionField-general-form-general.color-color`).hover();
    await page.getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.color`).hover();

    await page.getByRole('menuitem', { name: 'Edit tooltip' }).click();
    await page.getByRole('dialog').getByRole('textbox').click();
    await page.getByRole('dialog').getByRole('textbox').fill('testing edit tooltip');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await page
      .getByLabel('block-item-CollectionField-general-form-general.color-color')
      .getByRole('img', { name: 'question-circle' })
      .hover();
    await expect(page.getByText('testing edit tooltip')).toBeVisible();
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
        await createColumnItem(page, 'color');
        await showSettingsMenu(page, 'color');
      },
      supportedOptions: ['Custom column title', 'Column width', 'Delete'],
    });
  });
});
