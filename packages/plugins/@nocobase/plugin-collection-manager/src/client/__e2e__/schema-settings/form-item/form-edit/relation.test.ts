import { Page, expect, oneTableBlockWithAddNewAndViewAndEditAndAssociationFields, test } from '@nocobase/test/client';
import { commonTesting, testPattern } from '../commonTesting';

test.describe('many to many', () => {
  commonTesting({
    openDialogAndShowMenu,
    fieldName: 'manyToMany',
    fieldType: 'relation',
    mode: 'options',
    blockType: 'editing',
  });

  test('pattern', async ({ page, mockPage, mockRecords }) => {
    let record;
    await testPattern({
      page,
      gotoPage: async () => {
        record = (await gotoPage(mockPage, mockRecords)).record;
      },
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'manyToMany'),
      expectEditable: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.manyToMany-manyToMany')
            .getByTestId('select-object-multiple'),
        ).toHaveText(`${record.manyToMany.map((item) => item.id).join('')}`);
      },
      expectReadonly: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.manyToMany-manyToMany')
            .getByTestId('select-object-multiple'),
        ).toHaveClass(/ant-select-disabled/);
        // 在这里等待一下，防止因闪烁导致下面的断言失败
        await page.waitForTimeout(100);
      },
      expectEasyReading: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.manyToMany-manyToMany'),
        ).toHaveText(`manyToMany:${record.manyToMany.map((item) => item.id).join(',')}`);
      },
    });
  });

  test('Set the data scope', async ({ page, mockPage, mockRecords }) => {
    const { recordsOfUser } = await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'manyToMany');
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
    await page.getByRole('spinbutton').click();
    await page.getByRole('spinbutton').fill(String(recordsOfUser[0].id));
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 再次打开弹窗，设置的值应该还在
    await showMenu(page, 'manyToMany');
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await expect(page.getByTestId('select-filter-field')).toHaveText('ID');
    await expect(page.getByRole('spinbutton')).toHaveValue(String(recordsOfUser[0].id));
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();

    // 数据应该被过滤了
    await page
      .getByLabel('block-item-CollectionField-general-form-general.manyToMany-manyToMany')
      .getByTestId('select-object-multiple')
      .click();
    await expect(page.getByRole('option', { name: String(recordsOfUser[0].id), exact: true })).toBeVisible();
  });

  test('set default sorting rules', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'manyToMany');
    await page.getByRole('menuitem', { name: 'Set default sorting rules' }).click();

    // 配置
    await page.getByRole('button', { name: 'Add sort field' }).click();
    await page.getByTestId('select-single').click();
    await page.getByRole('option', { name: 'ID', exact: true }).click();
    await page.getByText('DESC', { exact: true }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 再次打开弹窗，设置的值应该还在
    await showMenu(page, 'manyToMany');
    await page.getByRole('menuitem', { name: 'Set default sorting rules' }).click();
    await expect(page.getByRole('dialog').getByTestId('select-single')).toHaveText('ID');
  });

  test('field component', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'manyToMany');
    await page.getByRole('menuitem', { name: 'Field component' }).click();

    // 断言支持的选项
    await expect(page.getByRole('option', { name: 'Select', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Record picker', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Sub-table', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Sub-form', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Sub-form(Popover)', exact: true })).toBeVisible();
  });

  test('quick create', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'manyToMany');

    await expect(page.getByRole('menuitem', { name: 'Quick create' })).toBeVisible();
  });

  test('allow multiple', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'manyToMany');
    await expect(page.getByRole('menuitem', { name: 'Allow multiple' })).toBeVisible();
  });

  test('title field', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'manyToMany');
    await expect(page.getByRole('menuitem', { name: 'Title field' })).toBeVisible();
  });
});

test.describe('many to one', () => {
  commonTesting({
    openDialogAndShowMenu,
    fieldName: 'manyToOne',
    fieldType: 'relation',
    mode: 'options',
    blockType: 'editing',
  });

  test('pattern', async ({ page, mockPage, mockRecords }) => {
    let record;
    await testPattern({
      page,
      gotoPage: async () => {
        record = (await gotoPage(mockPage, mockRecords)).record;
      },
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'manyToOne'),
      expectEditable: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.manyToOne-manyToOne')
            .getByTestId(/select-object/),
        ).toHaveText(`${record.manyToOne.id}`);
      },
      expectReadonly: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.manyToOne-manyToOne')
            .getByTestId(/select-object/),
        ).toHaveClass(/ant-select-disabled/);
        // 在这里等待一下，防止因闪烁导致下面的断言失败
        await page.waitForTimeout(100);
      },
      expectEasyReading: async () => {
        await expect(page.getByLabel('block-item-CollectionField-general-form-general.manyToOne-manyToOne')).toHaveText(
          `manyToOne:${record.manyToOne.id}`,
        );
      },
    });
  });

  test('Set the data scope', async ({ page, mockPage, mockRecords }) => {
    const { recordsOfUser } = await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'manyToOne');
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
    await page.getByRole('spinbutton').click();
    await page.getByRole('spinbutton').fill(String(recordsOfUser[0].id));
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 再次打开弹窗，设置的值应该还在
    await showMenu(page, 'manyToOne');
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await expect(page.getByTestId('select-filter-field')).toHaveText('ID');
    await expect(page.getByRole('spinbutton')).toHaveValue(String(recordsOfUser[0].id));
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();

    // 数据应该被过滤了
    await page
      .getByLabel('block-item-CollectionField-general-form-general.manyToOne-manyToOne')
      .getByTestId(/select-object/)
      .click();
    await expect(page.getByRole('option', { name: String(recordsOfUser[0].id), exact: true })).toBeVisible();
    await expect(page.getByRole('option')).toHaveCount(2);
  });

  test('field component', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'manyToOne');
    await page.getByRole('menuitem', { name: 'Field component' }).click();

    // 断言支持的选项
    await expect(page.getByRole('option', { name: 'Select', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Record picker', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Sub-form', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Sub-form(Popover)', exact: true })).toBeVisible();
  });

  test('quick create', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'manyToOne');

    await expect(page.getByRole('menuitem', { name: 'Quick create' })).toBeVisible();
  });

  test('title field', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'manyToOne');
    await expect(page.getByRole('menuitem', { name: 'Title field' })).toBeVisible();
  });
});

test.describe('one to many', () => {
  commonTesting({
    openDialogAndShowMenu,
    fieldName: 'oneToMany',
    fieldType: 'relation',
    mode: 'options',
    blockType: 'editing',
  });

  test('pattern', async ({ page, mockPage, mockRecords }) => {
    let record;
    await testPattern({
      page,
      gotoPage: async () => {
        record = (await gotoPage(mockPage, mockRecords)).record;
      },
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'oneToMany'),
      expectEditable: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.oneToMany-oneToMany')
            .getByTestId('select-object-multiple'),
        ).toHaveText(`${record.oneToMany.map((item) => item.id).join('')}`);
      },
      expectReadonly: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.oneToMany-oneToMany')
            .getByTestId('select-object-multiple'),
        ).toHaveClass(/ant-select-disabled/);
        // 在这里等待一下，防止因闪烁导致下面的断言失败
        await page.waitForTimeout(100);
      },
      expectEasyReading: async () => {
        await expect(page.getByLabel('block-item-CollectionField-general-form-general.oneToMany-oneToMany')).toHaveText(
          `oneToMany:${record.oneToMany.map((item) => item.id).join(',')}`,
        );
      },
    });
  });

  test('Set the data scope', async ({ page, mockPage, mockRecords }) => {
    const { record } = await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'oneToMany');
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
    await page.getByRole('spinbutton').click();
    await page.getByRole('spinbutton').fill('1');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 再次打开弹窗，设置的值应该还在
    await showMenu(page, 'oneToMany');
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await expect(page.getByTestId('select-filter-field')).toHaveText('ID');
    await expect(page.getByRole('spinbutton')).toHaveValue('1');
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();

    // 数据应该被过滤了
    await page
      .getByLabel('block-item-CollectionField-general-form-general.oneToMany-oneToMany')
      .getByTestId('select-object-multiple')
      .click();
    // 但是在编辑模式下，本身已经有数据，所以需要加上已有数据的个数
    await expect(page.getByRole('option')).toHaveCount(1 + record.oneToMany.length);
  });

  test('field component', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'oneToMany');
    await page.getByRole('menuitem', { name: 'Field component' }).click();

    // 断言支持的选项
    await expect(page.getByRole('option', { name: 'Select', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Record picker', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Sub-table', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Sub-form', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Sub-form(Popover)', exact: true })).toBeVisible();
  });

  test('quick create', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'oneToMany');

    await expect(page.getByRole('menuitem', { name: 'Quick create' })).toBeVisible();
  });

  test('allow multiple', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'oneToMany');
    await expect(page.getByRole('menuitem', { name: 'Allow multiple' })).toBeVisible();
  });

  test('title field', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'oneToMany');
    await expect(page.getByRole('menuitem', { name: 'Title field' })).toBeVisible();
  });
});

test.describe('one to one (belongs to)', () => {
  commonTesting({
    openDialogAndShowMenu,
    fieldName: 'oneToOneBelongsTo',
    fieldType: 'relation',
    mode: 'options',
    blockType: 'editing',
  });

  test('pattern', async ({ page, mockPage, mockRecords }) => {
    let record;
    await testPattern({
      page,
      gotoPage: async () => {
        record = (await gotoPage(mockPage, mockRecords)).record;
      },
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'oneToOneBelongsTo'),
      expectEditable: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.oneToOneBelongsTo-oneToOneBelongsTo')
            .getByTestId(/select-object/),
        ).toHaveText(`${record.oneToOneBelongsTo.id}`);
      },
      expectReadonly: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.oneToOneBelongsTo-oneToOneBelongsTo')
            .getByTestId(/select-object/),
        ).toHaveClass(/ant-select-disabled/);
        // 在这里等待一下，防止因闪烁导致下面的断言失败
        await page.waitForTimeout(100);
      },
      expectEasyReading: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.oneToOneBelongsTo-oneToOneBelongsTo'),
        ).toHaveText(`oneToOneBelongsTo:${record.oneToOneBelongsTo.id}`);
      },
    });
  });

  test('Set the data scope', async ({ page, mockPage, mockRecords }) => {
    const { recordsOfUser } = await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'oneToOneBelongsTo');
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
    await page.getByRole('spinbutton').click();
    await page.getByRole('spinbutton').fill(String(recordsOfUser[0].id));
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 再次打开弹窗，设置的值应该还在
    await showMenu(page, 'oneToOneBelongsTo');
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await expect(page.getByTestId('select-filter-field')).toHaveText('ID');
    await expect(page.getByRole('spinbutton')).toHaveValue(String(recordsOfUser[0].id));
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();

    // 数据应该被过滤了
    await page
      .getByLabel('block-item-CollectionField-general-form-general.oneToOneBelongsTo-oneToOneBelongsTo')
      .getByTestId(/select-object/)
      .click();
    await expect(page.getByRole('option', { name: String(recordsOfUser[0].id), exact: true })).toBeVisible();
    await expect(page.getByRole('option')).toHaveCount(2);
  });

  test('field component', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'oneToOneBelongsTo');
    await page.getByRole('menuitem', { name: 'Field component' }).click();

    // 断言支持的选项
    await expect(page.getByRole('option', { name: 'Select', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Record picker', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Sub-form', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Sub-form(Popover)', exact: true })).toBeVisible();
  });

  test('quick create', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'oneToOneBelongsTo');

    await expect(page.getByRole('menuitem', { name: 'Quick create' })).toBeVisible();
  });

  test('title field', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'oneToOneBelongsTo');
    await expect(page.getByRole('menuitem', { name: 'Title field' })).toBeVisible();
  });
});

test.describe('one to one (has one)', () => {
  commonTesting({
    openDialogAndShowMenu,
    fieldName: 'oneToOneHasOne',
    fieldType: 'relation',
    mode: 'options',
    blockType: 'editing',
  });

  test('pattern', async ({ page, mockPage, mockRecords }) => {
    let record;
    await testPattern({
      page,
      gotoPage: async () => {
        record = (await gotoPage(mockPage, mockRecords)).record;
      },
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'oneToOneHasOne'),
      expectEditable: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.oneToOneHasOne-oneToOneHasOne')
            .getByTestId(/select-object/),
        ).toHaveText(`${record.oneToOneHasOne.id}`);
      },
      expectReadonly: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.oneToOneHasOne-oneToOneHasOne')
            .getByTestId(/select-object/),
        ).toHaveClass(/ant-select-disabled/);
        // 在这里等待一下，防止因闪烁导致下面的断言失败
        await page.waitForTimeout(100);
      },
      expectEasyReading: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.oneToOneHasOne-oneToOneHasOne'),
        ).toHaveText(`oneToOneHasOne:${record.oneToOneHasOne.id}`);
      },
    });
  });

  test('Set the data scope', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'oneToOneHasOne');
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
    await page.getByRole('spinbutton').click();
    await page.getByRole('spinbutton').fill('1');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 再次打开弹窗，设置的值应该还在
    await showMenu(page, 'oneToOneHasOne');
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await expect(page.getByTestId('select-filter-field')).toHaveText('ID');
    await expect(page.getByRole('spinbutton')).toHaveValue('1');
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();

    // 数据应该被过滤了
    await page
      .getByLabel('block-item-CollectionField-general-form-general.oneToOneHasOne-oneToOneHasOne')
      .getByTestId(/select-object/)
      .click();
    await expect(page.getByRole('option')).toHaveCount(2);
  });

  test('field component', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'oneToOneHasOne');
    await page.getByRole('menuitem', { name: 'Field component' }).click();

    // 断言支持的选项
    await expect(page.getByRole('option', { name: 'Select', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Record picker', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Sub-form', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Sub-form(Popover)', exact: true })).toBeVisible();
  });

  test('quick create', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'oneToOneHasOne');

    await expect(page.getByRole('menuitem', { name: 'Quick create' })).toBeVisible();
  });

  test('title field', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'oneToOneHasOne');
    await expect(page.getByRole('menuitem', { name: 'Title field' })).toBeVisible();
  });
});

const gotoPage = async (mockPage, mockRecords) => {
  const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).waitForInit();
  const recordsOfUser = await mockRecords('users', 3);
  const record = (await mockRecords('general', 1))[0];
  await nocoPage.goto();

  return { record, recordsOfUser };
};

const openDialog = async (page: Page) => {
  await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
};

const showMenu = async (page: Page, fieldName: string) => {
  await page.getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`).hover();
  await page
    .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`)
    .hover();
};

async function openDialogAndShowMenu({
  page,
  mockPage,
  mockRecords,
  fieldName,
}: {
  page: Page;
  mockPage;
  mockRecord;
  mockRecords;
  fieldName: string;
}) {
  await gotoPage(mockPage, mockRecords);
  await openDialog(page);
  await showMenu(page, fieldName);
}
