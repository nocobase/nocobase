import {
  Page,
  expect,
  expectSettingsMenu,
  oneTableBlockWithAddNewAndViewAndEditAndBasicFields,
  oneTableBlockWithAddNewAndViewAndEditAndBasicFieldsAndSubTable,
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
        await page.getByLabel(`block-item-CollectionField-general-form-general.singleLineText-singleLineText`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.singleLineText`)
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
      gotoPage: async () => {
        const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
        await nocoPage.goto();
      },
      openDialog: async () => {
        await page.getByRole('button', { name: 'Add new' }).click();
      },
      closeDialog: () => page.getByLabel('drawer-Action.Container-general-Add record-mask').click(),
      showMenu: async () => {
        await page.getByLabel(`block-item-CollectionField-general-form-general.singleLineText-singleLineText`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.singleLineText`)
          .hover();
      },
      supportVariables: ['Constant', 'Current user', 'Date variables', 'Current form'],
      constantValue: 'test single line text',
      variableValue: ['Current user', 'Email'], // 值为 admin@nocobase.com
      expectConstantValue: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
            .getByRole('textbox'),
        ).toHaveValue('test single line text');
      },
      expectVariableValue: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
            .getByRole('textbox'),
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
        })(page, 'singleLineText'),
      expectEditable: async () => {
        // 默认情况下可以编辑
        await page
          .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
          .getByRole('textbox')
          .click();
        await page
          .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
          .getByRole('textbox')
          .fill('test single line text');
      },
      expectReadonly: async () => {
        // 只读模式下，输入框会被禁用
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
            .getByRole('textbox'),
        ).toBeDisabled();
      },
      expectEasyReading: async () => {
        // 输入框会消失，只剩下值
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
            .getByRole('textbox'),
        ).not.toBeVisible();
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText'),
        ).toHaveText('singleLineText:test single line text');
      },
    });
  });

  test('Set validation rules', async ({ page, mockPage }) => {
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
        })(page, 'singleLineText'),
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
        await page.getByLabel(`block-item-CollectionField-general-form-general.singleLineText-singleLineText`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.singleLineText`)
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
        })(page, 'singleLineText'),
      expectEditable: async () => {
        // 应该显示 record 中的值
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
            .getByRole('textbox'),
        ).toHaveValue(record.singleLineText);
      },
      expectReadonly: async () => {
        // 只读模式下，输入框会被禁用
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
            .getByRole('textbox'),
        ).toBeDisabled();
      },
      expectEasyReading: async () => {
        // 输入框会消失，只剩下值
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
            .getByRole('textbox'),
        ).not.toBeVisible();
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText'),
        ).toHaveText(`singleLineText:${record.singleLineText}`);
      },
    });
  });

  test('Set validation rules', async ({ page, mockPage, mockRecord }) => {
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
        })(page, 'singleLineText'),
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
        await page.getByLabel(`block-item-CollectionField-general-form-general.singleLineText-singleLineText`).hover();
        await page
          .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.singleLineText`)
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
        await createColumnItem(page, 'singleLineText');
        await showSettingsMenu(page, 'singleLineText');
      },
      supportedOptions: ['Custom column title', 'Column width', 'Sortable', 'Delete'],
    });
  });

  test('custom column title', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecords('general');
    await nocoPage.goto();

    await createColumnItem(page, 'singleLineText');
    await showSettingsMenu(page, 'singleLineText');
    await page.getByRole('menuitem', { name: 'Custom column title' }).click();

    // 显示出原字段名称
    await expect(page.getByRole('dialog').getByText('Original field title: singleLineText')).toBeVisible();
    // 输入新字段名称
    await page.getByLabel('block-item-Input-general-column title').getByRole('textbox').click();
    await page.getByLabel('block-item-Input-general-column title').getByRole('textbox').fill('new column title');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 新名称应该显示出来
    await expect(page.getByRole('button', { name: 'new column title', exact: true })).toBeVisible();
  });

  test('column width', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecords('general');
    await nocoPage.goto();

    await createColumnItem(page, 'singleLineText');
    await showSettingsMenu(page, 'singleLineText');
    await page.getByRole('menuitem', { name: 'Column width' }).click();
    await page.getByRole('dialog').getByRole('spinbutton').click();
    await page.getByRole('dialog').getByRole('spinbutton').fill('600');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    const columnHeadSize = await page.getByRole('columnheader', { name: 'singleLineText' }).boundingBox();
    expect(Math.floor(columnHeadSize.width)).toBe(600);
  });

  test('sortable', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecords('general', [{ singleLineText: 'a' }, { singleLineText: 'b' }]);
    await nocoPage.goto();

    await createColumnItem(page, 'singleLineText');
    await showSettingsMenu(page, 'singleLineText');

    // 默认不可排序
    await expect(page.getByRole('menuitem', { name: 'Sortable' }).getByRole('switch')).not.toBeChecked();

    // 开启排序
    await page.getByRole('menuitem', { name: 'Sortable' }).click();
    // TODO: 此处菜单在点击后不应该消失
    // await expect(page.getByRole('menuitem', { name: 'Sortable' }).getByRole('switch')).toBeChecked();

    // 鼠标 hover 时，有提示
    await page.getByRole('columnheader', { name: 'singleLineText' }).hover();
    await expect(page.getByRole('tooltip', { name: 'Click to sort ascending' })).toBeVisible();

    // 点击第一下，升序
    await page.getByRole('columnheader', { name: 'singleLineText' }).click();
    let sizeA = await page.getByRole('cell', { name: 'a', exact: true }).boundingBox();
    let sizeB = await page.getByRole('cell', { name: 'b', exact: true }).boundingBox();
    expect(sizeA.y).toBeLessThan(sizeB.y);

    // 点击第二下，降序
    await page.getByRole('columnheader', { name: 'singleLineText' }).click();
    sizeA = await page.getByRole('cell', { name: 'a', exact: true }).boundingBox();
    sizeB = await page.getByRole('cell', { name: 'b', exact: true }).boundingBox();
    expect(sizeA.y).toBeGreaterThan(sizeB.y);
  });

  test('delete', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await mockRecords('general');
    await nocoPage.goto();

    await createColumnItem(page, 'singleLineText');
    await showSettingsMenu(page, 'singleLineText');
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByRole('columnheader', { name: 'singleLineText' })).toBeHidden();
  });
});

test.describe('table column & sub-table in edit form', () => {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFieldsAndSubTable).waitForInit();
    await mockRecord('subTable');
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('action-Action.Link-Edit record-update-subTable-table-0').click();
        await page.getByRole('button', { name: 'singleLineText', exact: true }).hover();
        await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.Column.Designer-general').hover();
      },
      supportedOptions: ['Custom column title', 'Column width', 'Required', 'Pattern', 'Set default value', 'Delete'],
    });
  });

  test('set default value', async ({ page, mockPage, mockRecord }) => {
    let record;
    await testDefaultValue({
      page,
      gotoPage: async () => {
        const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFieldsAndSubTable).waitForInit();
        record = await mockRecord('subTable');
        await nocoPage.goto();
      },
      openDialog: async () => {
        await page.getByLabel('action-Action.Link-Edit record-update-subTable-table-0').click();
      },
      closeDialog: async () => {
        await page.getByLabel('drawer-Action.Container-subTable-Edit record-mask').click();
      },
      showMenu: async () => {
        await page.getByRole('button', { name: 'singleLineText', exact: true }).hover();
        await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.Column.Designer-general').hover();
      },
      supportVariables: [
        'Constant',
        'Current user',
        'Current role',
        'Current form',
        'Current object',
        'Current record',
      ],
      variableValue: ['Current user', 'Nickname'],
      expectVariableValue: async () => {
        await page.getByRole('button', { name: 'Add new' }).click();
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
            .nth(0)
            .getByRole('textbox'),
        ).toHaveValue(record.manyToMany[0].singleLineText);

        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
            .nth(record.manyToMany.length) // 最后一行
            .getByRole('textbox'),
        ).toHaveValue('Super Admin');
      },
    });
  });
});
