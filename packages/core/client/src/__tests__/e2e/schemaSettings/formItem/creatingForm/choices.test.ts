import { Page, expect, oneTableBlockWithAddNewAndViewAndEditAndChoicesFields, test } from '@nocobase/test/client';
import { commonTesting, testDefaultValue, testPattern } from '../commonTesting';

const gotoPage = async (mockPage) => {
  const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndChoicesFields).waitForInit();
  await nocoPage.goto();
};

const openDialog = async (page: Page) => {
  await page.getByRole('button', { name: 'Add new' }).click();
};

const showMenu = async (page: Page, fieldName: string) => {
  await page
    .getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`, { exact: true })
    .hover();
  await page
    .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`, {
      exact: true,
    })
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

test.describe('checkbox', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'checkbox', mode: 'options' });

  test('set default value', async ({ page, mockPage }) => {
    await testDefaultValue({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      closeDialog: () => page.getByLabel('drawer-Action.Container-general-Add record-mask').click(),
      showMenu: () => showMenu(page, 'checkbox'),
      supportVariables: ['Constant', 'Current user', 'Date variables', 'Current form'],
      inputConstantValue: async () => {
        // 默认应该是没有被选中的，点击后应该被选中
        await page.getByLabel('block-item-VariableInput-').getByRole('checkbox').click();
      },
      expectConstantValue: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.checkbox-checkbox').getByRole('checkbox'),
        ).toBeChecked();
      },
    });
  });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    await testPattern({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'checkbox'),
      expectEditable: async () => {
        // 默认是未选中的状态，所以先选中
        await page
          .getByLabel('block-item-CollectionField-general-form-general.checkbox-checkbox')
          .getByRole('checkbox')
          .click();
      },
      expectReadonly: async () => {
        // checkbox 应该被禁用
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.checkbox-checkbox').getByRole('checkbox'),
        ).toBeDisabled();
      },
      expectEasyReading: async () => {
        // checkbox 应该被隐藏，然后只显示一个图标
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.checkbox-checkbox').getByRole('checkbox'),
        ).not.toBeVisible();
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.checkbox-checkbox')
            .getByRole('img', { name: 'check' }),
        ).toBeVisible();
      },
    });
  });
});

test.describe('checkbox group', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'checkboxGroup', mode: 'options' });

  test('set default value', async ({ page, mockPage }) => {
    await testDefaultValue({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      closeDialog: () => page.getByLabel('drawer-Action.Container-general-Add record-mask').click(),
      showMenu: () => showMenu(page, 'checkboxGroup'),
      supportVariables: ['Constant', 'Current user', 'Date variables', 'Current form'],
      inputConstantValue: async () => {
        await page.getByLabel('block-item-VariableInput-').getByLabel('Option1').click();
      },
      expectConstantValue: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.checkboxGroup-checkboxGroup')
            .getByRole('checkbox', { name: 'Option1' }),
        ).toBeChecked();
      },
    });
  });

  test('pattern', async ({ page, mockPage }) => {
    await testPattern({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'checkboxGroup'),
      expectEditable: async () => {
        // 默认是未选中的状态，所以先选中
        await page
          .getByLabel('block-item-CollectionField-general-form-general.checkboxGroup-checkboxGroup')
          .getByRole('checkbox', { name: 'Option1' })
          .click();
      },
      expectReadonly: async () => {
        // checkbox 应该被禁用
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.checkboxGroup-checkboxGroup')
            .getByRole('checkbox', { name: 'Option1' }),
        ).toBeDisabled();
      },
      expectEasyReading: async () => {
        // checkbox 应该被隐藏，然后只显示一个标签
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.checkboxGroup-checkboxGroup')
            .getByRole('checkbox', { name: 'Option1' }),
        ).not.toBeVisible();
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.checkboxGroup-checkboxGroup')
            .getByText('Option1'),
        ).toBeVisible();
      },
    });
  });
});

test.describe('china region', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'chinaRegion', mode: 'options' });

  test('set default value', async ({ page, mockPage }) => {
    await testDefaultValue({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      closeDialog: () => page.getByLabel('drawer-Action.Container-general-Add record-mask').click(),
      showMenu: () => showMenu(page, 'chinaRegion'),
      supportVariables: ['Constant', 'Current user', 'Date variables', 'Current form'],
      inputConstantValue: async () => {
        await page.getByLabel('block-item-VariableInput-').getByLabel('Search').click();
        await page.getByRole('menuitemcheckbox', { name: '北京市' }).click();
        await page.getByRole('menuitemcheckbox', { name: '市辖区' }).click();
        await page.getByRole('menuitemcheckbox', { name: '东城区' }).click();
      },
      expectConstantValue: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.chinaRegion-chinaRegion'),
        ).toHaveText('chinaRegion:北京市/市辖区/东城区');
      },
    });
  });

  test('pattern', async ({ page, mockPage }) => {
    await testPattern({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'chinaRegion'),
      expectEditable: async () => {
        await page
          .getByLabel('block-item-CollectionField-general-form-general.chinaRegion-chinaRegion')
          .getByRole('combobox', { name: 'Search' })
          .click();
        await page.getByRole('menuitemcheckbox', { name: '北京市' }).click();
        await page.getByRole('menuitemcheckbox', { name: '市辖区' }).click();
        await page.getByRole('menuitemcheckbox', { name: '东城区' }).click();
      },
      expectReadonly: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.chinaRegion-chinaRegion')
            .getByRole('combobox', { name: 'Search' }),
        ).toBeDisabled();
      },
      expectEasyReading: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.chinaRegion-chinaRegion')
            .getByRole('combobox', { name: 'Search' }),
        ).not.toBeVisible();
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.chinaRegion-chinaRegion'),
        ).toHaveText('chinaRegion:北京市 / 市辖区 / 东城区');
      },
    });
  });
});

test.describe('multiple select', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'multipleSelect', mode: 'options' });

  test('set default value', async ({ page, mockPage }) => {
    await testDefaultValue({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      closeDialog: () => page.getByLabel('drawer-Action.Container-general-Add record-mask').click(),
      showMenu: () => showMenu(page, 'multipleSelect'),
      supportVariables: ['Constant', 'Current user', 'Date variables', 'Current form'],
      inputConstantValue: async () => {
        await page.getByLabel('block-item-VariableInput-').getByTestId('select-multiple').click();
        await page.getByRole('option', { name: 'Option1' }).click();
        await page.getByRole('option', { name: 'Option2' }).click();
        await page.getByRole('option', { name: 'Option3' }).click();
      },
      expectConstantValue: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.multipleSelect-multipleSelect'),
        ).toHaveText('multipleSelect:Option1Option2Option3');
      },
    });
  });

  test('pattern', async ({ page, mockPage }) => {
    await testPattern({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'multipleSelect'),
      expectEditable: async () => {
        await page
          .getByLabel('block-item-CollectionField-general-form-general.multipleSelect-multipleSelect')
          .getByTestId('select-multiple')
          .click();
        await page.getByRole('option', { name: 'Option1' }).click();
        await page.getByRole('option', { name: 'Option2' }).click();
        await page.getByRole('option', { name: 'Option3' }).click();
      },
      expectReadonly: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.multipleSelect-multipleSelect')
            .getByTestId('select-multiple'),
        ).toHaveClass(/ant-select-disabled/);
      },
      expectEasyReading: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.multipleSelect-multipleSelect')
            .getByTestId('select-multiple'),
        ).not.toBeVisible();
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.multipleSelect-multipleSelect'),
        ).toHaveText('multipleSelect:Option1Option2Option3');
      },
    });
  });
});

test.describe('radio group', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'radioGroup', mode: 'options' });

  test('set default value', async ({ page, mockPage }) => {
    await testDefaultValue({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      closeDialog: () => page.getByLabel('drawer-Action.Container-general-Add record-mask').click(),
      showMenu: () => showMenu(page, 'radioGroup'),
      supportVariables: ['Constant', 'Current user', 'Date variables', 'Current form'],
      inputConstantValue: async () => {
        await page.getByLabel('block-item-VariableInput-').getByLabel('Option2').click();
      },
      expectConstantValue: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.radioGroup-radioGroup')
            .getByLabel('Option2'),
        ).toBeChecked();
      },
    });
  });

  test('pattern', async ({ page, mockPage }) => {
    await testPattern({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'radioGroup'),
      expectEditable: async () => {
        await page
          .getByLabel('block-item-CollectionField-general-form-general.radioGroup-radioGroup')
          .getByLabel('Option2')
          .click();
      },
      expectReadonly: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.radioGroup-radioGroup')
            .getByLabel('Option2'),
        ).toBeDisabled();
      },
      expectEasyReading: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.radioGroup-radioGroup')
            .getByLabel('Option2'),
        ).not.toBeVisible();
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.radioGroup-radioGroup'),
        ).toHaveText('radioGroup:Option2');
      },
    });
  });
});

test.describe('single select', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'singleSelect', mode: 'options' });

  test('set default value', async ({ page, mockPage }) => {
    await testDefaultValue({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      closeDialog: () => page.getByLabel('drawer-Action.Container-general-Add record-mask').click(),
      showMenu: () => showMenu(page, 'singleSelect'),
      supportVariables: ['Constant', 'Current user', 'Date variables', 'Current form'],
      inputConstantValue: async () => {
        await page.getByLabel('block-item-VariableInput-').getByLabel('Search').click();
        await page.getByRole('option', { name: 'Option1' }).click();
      },
      expectConstantValue: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.singleSelect-singleSelect'),
        ).toHaveText('singleSelect:Option1');
      },
    });
  });

  test('pattern', async ({ page, mockPage }) => {
    await testPattern({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'singleSelect'),
      expectEditable: async () => {
        await page
          .getByLabel('block-item-CollectionField-general-form-general.singleSelect-singleSelect')
          .getByTestId('select-single')
          .click();
        await page.getByRole('option', { name: 'Option1' }).click();
      },
      expectReadonly: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.singleSelect-singleSelect')
            .getByTestId('select-single'),
        ).toHaveClass(/ant-select-disabled/);
      },
      expectEasyReading: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.singleSelect-singleSelect')
            .getByTestId('select-single'),
        ).not.toBeVisible();
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.singleSelect-singleSelect'),
        ).toHaveText('singleSelect:Option1');
      },
    });
  });
});
