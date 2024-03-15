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

  test('should have a current form variable', async ({ page, mockPage, mockRecord }) => {
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

    // 使用 `当前表单` 设置数据范围
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByRole('menuitemcheckbox', { name: 'singleLineText' }).click();
    await page.getByTestId('select-filter-operator').click();
    await page.getByRole('option', { name: 'is', exact: true }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Current form right' }).click();
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

  test('should have a current object variable', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(tableSelectorDataScopeVariable).waitForInit();
    const record = await mockRecord('table-selector-data-scope-variable');
    await nocoPage.goto();

    await page.getByLabel('action-Action.Link-View-view-table-selector-data-scope-variable-table-0').click();

    // 1. 将一个关系字段的 Select 组件改为子表单
    await page
      .getByLabel(
        'block-item-CollectionField-table-selector-data-scope-variable-form-table-selector-data-scope-variable.manyToMany-manyToMany',
        { exact: true },
      )
      .hover();
    await page
      .getByLabel(
        'designer-schema-settings-CollectionField-fieldSettings:FormItem-table-selector-data-scope-variable-table-selector-data-scope-variable.manyToMany',
        { exact: true },
      )
      .hover();
    await page.getByText('Field componentRecord picker').click();
    await page.getByRole('option', { name: 'Sub-form', exact: true }).click();
    // 使菜单消失
    await page.getByRole('menuitem', { name: 'Delete' }).hover();
    await page.mouse.move(-300, 0);

    // 2. 在子表单中创建一个关系字段，并切换成数据选择器组件
    await page.getByLabel('schema-initializer-Grid-form:').first().hover();
    await page.getByRole('menuitem', { name: 'manyToMany' }).click();
    await page.getByRole('menuitem', { name: 'singleLineText' }).click();
    await page.getByLabel('block-item-CollectionField-').nth(1).hover();
    await page
      .getByLabel('designer-schema-settings-CollectionField-fieldSettings:FormItem-table-selector-')
      .nth(1)
      .hover();
    await page.getByRole('menuitem', { name: 'Field component Select' }).click();
    await page.getByRole('option', { name: 'Record picker' }).click();
    // 使菜单消失
    await page.getByRole('menuitem', { name: 'Delete' }).hover();
    await page.mouse.move(-300, 0);

    await page.getByLabel('block-item-CollectionField-').nth(1).click();

    // 3. 创建 Table 区块
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'form Table' }).click();

    // 4. 设置数据范围
    await page.getByLabel('block-item-CardItem-table-selector-data-scope-variable-table-selector').hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:tableSelector-table-selector-').hover();
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();

    // 使用 `当前对象` 设置数据范围
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByRole('menuitemcheckbox', { name: 'singleLineText' }).click();
    await page.getByTestId('select-filter-operator').click();
    await page.getByRole('option', { name: 'is', exact: true }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Current object right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'singleLineText' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // Table 中显示 singleLineText 字段
    await page.getByLabel('schema-initializer-TableV2.').hover();
    await page.getByRole('menuitem', { name: 'singleLineText' }).click();
    await page.mouse.move(300, 0);

    // 保存数据范围之后，表格选择器中应该只显示一条数据，且该数据与页面表格的第一行数据相同
    await expect(
      page.getByLabel('block-item-CardItem-table-selector-data-scope-variable-table-selector').getByRole('row'),
    ).toHaveCount(2); // 这里之所以是 2，是因为表头也是一个 row
    await expect(
      page
        .getByLabel('block-item-CardItem-table-selector-data-scope-variable-table-selector')
        .getByRole('row')
        .getByText(record['manyToMany'][0]['singleLineText']),
    ).toBeVisible();
  });
});

async function showSettingsMenu(page) {
  await page.getByLabel('block-item-CardItem-users-table-selector').hover();
  await page.getByLabel('designer-schema-settings-CardItem-blockSettings:tableSelector-users').hover();
}
