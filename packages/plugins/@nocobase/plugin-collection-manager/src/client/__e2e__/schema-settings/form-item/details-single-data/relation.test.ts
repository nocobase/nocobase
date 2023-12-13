import { Page, expect, oneTableBlockWithAddNewAndViewAndEditAndAssociationFields, test } from '@nocobase/test/client';
import { commonTesting } from '../commonTesting';

test.describe('many to many', () => {
  commonTesting({
    openDialogAndShowMenu,
    fieldName: 'manyToMany',
    fieldType: 'relation',
    mode: 'options',
    blockType: 'viewing',
  });

  test('field component', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'manyToMany');
    await page.getByRole('menuitem', { name: 'Field component' }).click();

    // 断言支持的选项
    await expect(page.getByRole('option', { name: 'Title', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Tag', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Sub-details', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Sub-table', exact: true })).toBeVisible();
  });

  test('title field', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'manyToMany');
    await expect(page.getByRole('menuitem', { name: 'Title field' })).toBeVisible();
  });

  test('enable link', async ({ page, mockPage, mockRecords }) => {
    test.fail();
    const record = await gotoPage(mockPage, mockRecords);
    await openDialog(page);

    // 初始状态是一个可点击的链接
    await expect(
      page
        .getByLabel('block-item-CollectionField-general-form-general.manyToMany-manyToMany')
        .locator('a')
        .filter({ hasText: record.manyToMany[0].id }),
    ).toBeVisible();

    await showMenu(page, 'manyToMany');

    // 默认情况下是开启状态
    await expect(page.getByRole('menuitem', { name: 'Enable link' }).getByRole('switch')).toBeChecked();
    await page.getByRole('menuitem', { name: 'Enable link' }).click();
    await expect(page.getByRole('menuitem', { name: 'Enable link' }).getByRole('switch')).not.toBeChecked();

    // 应变为非链接状态
    await expect(
      page
        .getByLabel('block-item-CollectionField-general-form-general.manyToMany-manyToMany')
        .locator('a')
        .filter({ hasText: record.manyToMany[0].id }),
    ).not.toBeVisible();

    // 再次开启链接状态
    await page.getByRole('menuitem', { name: 'Enable link' }).click();
    await expect(page.getByRole('menuitem', { name: 'Enable link' }).getByRole('switch')).toBeChecked();
    await expect(
      page
        .getByLabel('block-item-CollectionField-general-form-general.manyToMany-manyToMany')
        .locator('a')
        .filter({ hasText: record.manyToMany[0].id }),
    ).toBeVisible();
  });
});

test.describe('many to one', () => {
  commonTesting({
    openDialogAndShowMenu,
    fieldName: 'manyToOne',
    fieldType: 'relation',
    mode: 'options',
    blockType: 'viewing',
  });

  test('field component', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'manyToOne');
    await page.getByRole('menuitem', { name: 'Field component' }).click();

    // 断言支持的选项
    await expect(page.getByRole('option', { name: 'Title', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Tag', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Sub-details', exact: true })).toBeVisible();
  });

  test('title field', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'manyToOne');
    await expect(page.getByRole('menuitem', { name: 'Title field' })).toBeVisible();
  });

  test('enable link', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'manyToOne');

    await expect(page.getByRole('menuitem', { name: 'Enable link' }).getByRole('switch')).toBeChecked();
  });
});

test.describe('one to many', () => {
  commonTesting({
    openDialogAndShowMenu,
    fieldName: 'oneToMany',
    fieldType: 'relation',
    mode: 'options',
    blockType: 'viewing',
  });

  test('field component', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'oneToMany');
    await page.getByRole('menuitem', { name: 'Field component' }).click();

    // 断言支持的选项
    await expect(page.getByRole('option', { name: 'Title', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Tag', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Sub-table', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Sub-details', exact: true })).toBeVisible();
  });

  test('title field', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'oneToMany');
    await expect(page.getByRole('menuitem', { name: 'Title field' })).toBeVisible();
  });

  test('enable link', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'oneToMany');

    await expect(page.getByRole('menuitem', { name: 'Enable link' }).getByRole('switch')).toBeChecked();
  });
});

test.describe('one to one (belongs to)', () => {
  commonTesting({
    openDialogAndShowMenu,
    fieldName: 'oneToOneBelongsTo',
    fieldType: 'relation',
    mode: 'options',
    blockType: 'viewing',
  });

  test('field component', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'oneToOneBelongsTo');
    await page.getByRole('menuitem', { name: 'Field component' }).click();

    // 断言支持的选项
    await expect(page.getByRole('option', { name: 'Title', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Tag', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Sub-details', exact: true })).toBeVisible();
  });

  test('title field', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'oneToOneBelongsTo');
    await expect(page.getByRole('menuitem', { name: 'Title field' })).toBeVisible();
  });

  test('enable link', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'oneToOneBelongsTo');

    await expect(page.getByRole('menuitem', { name: 'Enable link' }).getByRole('switch')).toBeChecked();
  });
});

test.describe('one to one (has one)', () => {
  commonTesting({
    openDialogAndShowMenu,
    fieldName: 'oneToOneHasOne',
    fieldType: 'relation',
    mode: 'options',
    blockType: 'viewing',
  });

  test('field component', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'oneToOneHasOne');
    await page.getByRole('menuitem', { name: 'Field component' }).click();

    // 断言支持的选项
    await expect(page.getByRole('option', { name: 'Title', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Tag', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Sub-details', exact: true })).toBeVisible();
  });

  test('title field', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'oneToOneHasOne');
    await expect(page.getByRole('menuitem', { name: 'Title field' })).toBeVisible();
  });

  test('enable link', async ({ page, mockPage, mockRecords }) => {
    await gotoPage(mockPage, mockRecords);
    await openDialog(page);
    await showMenu(page, 'oneToOneHasOne');

    await expect(page.getByRole('menuitem', { name: 'Enable link' }).getByRole('switch')).toBeChecked();
  });
});

const gotoPage = async (mockPage, mockRecords) => {
  const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).waitForInit();
  const record = (await mockRecords('general', 1))[0];
  await nocoPage.goto();

  return record;
};

const openDialog = async (page: Page) => {
  await page.getByLabel('action-Action.Link-View record-view-general-table-0').click();
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
