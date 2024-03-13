import { expectSettingsMenu, test, expect } from '@nocobase/test/e2e';
import { createTable } from './utils';
import { tableSelectorDataScopeVariable } from './templatesOfBug';

test.describe('table data selector schema settings', () => {
  test('supported options', async ({ page, mockPage }) => {
    await createTable({ page, mockPage, fieldName: 'manyToOne' });

    await expectSettingsMenu({
      page,
      showMenu: () => showSettingsMenu(page),
      supportedOptions: ['Set the data scope', 'Set default sorting rules', 'Records per page', 'Delete'],
    });
  });

  test('should have a parent record variable', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(tableSelectorDataScopeVariable).waitForInit();
    const record = await mockRecord('table-selector-data-scope-variable');
    await nocoPage.goto();

    await page.getByLabel('action-Action.Link-View-view-table-selector-data-scope-variable-table-0').click();
    await page.getByTestId('select-data-picker').click();
    await page
      .getByTestId('drawer-AssociationField.Selector-table-selector-data-scope-variable-Select record')
      .getByLabel('block-item-CardItem-table-')
      .hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:tableSelector-table-selector-').hover();
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();

    // 使用 `上级记录` 设置数据范围
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByRole('menuitemcheckbox', { name: 'singleLineText' }).click();
    await page.getByTestId('select-filter-operator').click();
    await page.getByRole('option', { name: 'is', exact: true }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Parent record right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'singleLineText' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 保存数据范围之后，表格选择器中应该只显示一条数据，且该数据与页面表格的第一行数据相同
    await expect(
      page
        .getByTestId('drawer-AssociationField.Selector-table-selector-data-scope-variable-Select record')
        .getByLabel('block-item-CardItem-table-')
        .getByRole('row'),
    ).toHaveCount(2); // 这里之所以是 2，是因为表头也是一个 row
    await expect(
      page
        .getByTestId('drawer-AssociationField.Selector-table-selector-data-scope-variable-Select record')
        .getByLabel('block-item-CardItem-table-')
        .getByText(record['singleLineText']),
    ).toBeVisible();
  });
});

async function showSettingsMenu(page) {
  await page.getByLabel('block-item-CardItem-users-table-selector').hover();
  await page.getByLabel('designer-schema-settings-CardItem-blockSettings:tableSelector-users').hover();
}
