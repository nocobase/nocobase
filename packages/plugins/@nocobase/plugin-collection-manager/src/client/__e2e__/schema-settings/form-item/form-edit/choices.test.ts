import { Page, expect, oneTableBlockWithAddNewAndViewAndEditAndChoicesFields, test } from '@nocobase/test/client';
import { commonTesting, testPattern } from '../commonTesting';

test.describe('checkbox', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'checkbox', blockType: 'editing', mode: 'options' });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    let record = null;
    await testPattern({
      page,
      gotoPage: async () => {
        record = await gotoPage(mockPage, mockRecord);
      },
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'checkbox'),
      expectEditable: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.checkbox-checkbox').getByRole('checkbox'),
        ).toBeChecked({ checked: record.checkbox });
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
        ).toBeVisible({ visible: record.checkbox });
      },
    });
  });
});

test.describe('checkbox group', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'checkboxGroup', blockType: 'editing', mode: 'options' });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    let record = null;
    await testPattern({
      page,
      gotoPage: async () => {
        record = await gotoPage(mockPage, mockRecord);
      },
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'checkboxGroup'),
      expectEditable: async () => {
        for (const option of record.checkboxGroup) {
          await expect(
            page
              .getByLabel('block-item-CollectionField-general-form-general.checkboxGroup-checkboxGroup')
              .getByRole('checkbox', { name: option }),
          ).toBeChecked();
        }
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
        // checkbox 应该被隐藏，然后只显示标签
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.checkboxGroup-checkboxGroup')
            .getByRole('checkbox', { name: 'Option1' }),
        ).not.toBeVisible();
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.checkboxGroup-checkboxGroup'),
        ).toHaveText(`checkboxGroup:${record.checkboxGroup.join('')}`, { ignoreCase: true });
      },
    });
  });
});

test.describe('china region', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'chinaRegion', blockType: 'editing', mode: 'options' });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    let record = null;
    await testPattern({
      page,
      gotoPage: async () => {
        record = await gotoPage(mockPage, mockRecord);
      },
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
  commonTesting({ openDialogAndShowMenu, fieldName: 'multipleSelect', blockType: 'editing', mode: 'options' });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    let record = null;
    await testPattern({
      page,
      gotoPage: async () => {
        record = await gotoPage(mockPage, mockRecord);
      },
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'multipleSelect'),
      expectEditable: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.multipleSelect-multipleSelect')
            .getByTestId('select-multiple'),
        ).toHaveText(`${record.multipleSelect.join('')}`, { ignoreCase: true });
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
        ).toHaveText(`multipleSelect:${record.multipleSelect.join('')}`, { ignoreCase: true });
      },
    });
  });
});

test.describe('radio group', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'radioGroup', blockType: 'editing', mode: 'options' });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    let record = null;
    await testPattern({
      page,
      gotoPage: async () => {
        record = await gotoPage(mockPage, mockRecord);
      },
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'radioGroup'),
      expectEditable: async () => {
        if (record.radioGroup) {
          await expect(
            page
              .getByLabel('block-item-CollectionField-general-form-general.radioGroup-radioGroup')
              .getByLabel(record.radioGroup),
          ).toBeChecked();
        }
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
        ).toHaveText(`radioGroup:${record.radioGroup}`, { ignoreCase: true });
      },
    });
  });
});

test.describe('single select', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'singleSelect', blockType: 'editing', mode: 'options' });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    let record = null;
    await testPattern({
      page,
      gotoPage: async () => {
        record = await gotoPage(mockPage, mockRecord);
      },
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'singleSelect'),
      expectEditable: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.singleSelect-singleSelect')
            .getByTestId('select-single'),
        ).toHaveText(record.singleSelect, { ignoreCase: true });
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
        ).toHaveText(`singleSelect:${record.singleSelect}`, { ignoreCase: true });
      },
    });
  });
});

const gotoPage = async (mockPage, mockRecord) => {
  const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndChoicesFields).waitForInit();
  const record = await mockRecord('general');
  await nocoPage.goto();

  return record;
};

const openDialog = async (page: Page) => {
  await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
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

async function openDialogAndShowMenu({
  page,
  mockPage,
  mockRecord,
  fieldName,
}: {
  page: Page;
  mockPage;
  mockRecord;
  fieldName: string;
}) {
  await gotoPage(mockPage, mockRecord);
  await openDialog(page);
  await showMenu(page, fieldName);
}
