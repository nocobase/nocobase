import {
  expect,
  oneTableBlockWithAddNewAndViewAndEditAndBasicFields,
  oneTableBlockWithAddNewAndViewAndEditAndRelationFields,
  test,
} from '@nocobase/test/client';

test.describe('set default value', () => {
  test('basic fields', async ({ page, mockPage }) => {
    await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).goto();

    const openDialog = async (fieldName: string) => {
      await page.getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`).hover();
      await page
        .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`)
        .hover();
      await page.getByRole('menuitem', { name: 'Set default value', exact: true }).click();
    };

    await page.getByRole('button', { name: 'Add new' }).click();
    await openDialog('singleLineText');
    await page.getByLabel('Set default value').getByRole('textbox').click();
    await page.getByLabel('Set default value').getByRole('textbox').fill('test default value');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 关闭弹窗在打开，应该显示默认值
    await page.getByLabel('drawer-Action.Container-general-Add record-mask').click();
    await page.getByRole('button', { name: 'Add new' }).click();
    await expect(
      page
        .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
        .getByRole('textbox'),
    ).toHaveValue('test default value');

    // 为 longText 设置一个变量默认值: {{ currentForm.singleLineText }}
    await openDialog('longText');
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Current form' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'singleLineText' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await page.getByLabel('drawer-Action.Container-general-Add record-mask').click();
    await page.getByRole('button', { name: 'Add new' }).click();
    // 值应该和 singleLineText 一致
    await expect(
      page.getByLabel('block-item-CollectionField-general-form-general.longText-longText').getByRole('textbox'),
    ).toHaveValue('test default value');

    // 更改变量的值，longText 的值也应该跟着变化
    await page
      .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
      .getByRole('textbox')
      .fill('new value');
    await expect(
      page.getByLabel('block-item-CollectionField-general-form-general.longText-longText').getByRole('textbox'),
    ).toHaveValue('new value');
  });

  test('subform: basic fields', async ({ page, mockPage }) => {
    await mockPage(oneTableBlockWithAddNewAndViewAndEditAndRelationFields).goto();

    await page.getByRole('button', { name: 'Add new' }).click();

    // 先切换为子表单
    await page.getByLabel('block-item-CollectionField-general-form-general.manyToOne-manyToOne').hover();
    await page
      .getByLabel('designer-schema-settings-CollectionField-FormItem.Designer-general-general.manyToOne')
      .hover();
    await page.getByRole('menuitem', { name: 'Field component' }).click();
    await page.getByRole('option', { name: 'Sub-form', exact: true }).click();

    // 关闭下拉菜单
    await page.getByLabel('block-item-CollectionField-general-form-general.manyToOne-manyToOne').hover();
    await page
      .getByLabel('designer-schema-settings-CollectionField-FormItem.Designer-general-general.manyToOne')
      .hover();
    await page.mouse.move(100, 0);

    await page.getByLabel('schema-initializer-Grid-FormItemInitializers-users').hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await page.getByRole('menuitem', { name: 'Username' }).click();

    // 子表单状态下，没有默认值选项
    await page.getByLabel('block-item-CollectionField-general-form-general.manyToOne-manyToOne').hover();
    await expect(page.getByRole('menuitem', { name: 'Set default value' })).not.toBeVisible();

    // 测试子表单字段默认值 ------------------------------------------------------------------------------------------
    await page.getByLabel(`block-item-CollectionField-users-form-users.nickname-Nickname`).hover();
    await page.getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-users-users.Nickname`).hover();
    await page.getByRole('menuitem', { name: 'Set default value', exact: true }).click();
    await page.getByLabel('Set default value').getByRole('textbox').click();
    await page.getByLabel('Set default value').getByRole('textbox').fill('test default value');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 关闭弹窗在打开，应该显示默认值
    await page.getByLabel('drawer-Action.Container-general-Add record-mask').click();
    await page.getByRole('button', { name: 'Add new' }).click();
    await expect(
      page.getByLabel('block-item-CollectionField-users-form-users.nickname-Nickname').getByRole('textbox'),
    ).toHaveValue('test default value');

    // 为 username 设置一个变量默认值: {{ currentObject.nickname }}
    await page.getByLabel(`block-item-CollectionField-users-form-users.username-Username`).hover();
    await page.getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-users-users.Username`).hover();
    await page.getByRole('menuitem', { name: 'Set default value', exact: true }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Current object' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Nickname' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await page.getByLabel('drawer-Action.Container-general-Add record-mask').click();
    await page.getByRole('button', { name: 'Add new' }).click();
    // 值应该和 Nickname 一致
    await expect(
      page.getByLabel('block-item-CollectionField-users-form-users.username-Username').getByRole('textbox'),
    ).toHaveValue('test default value');

    // 更改变量的值，longText 的值也应该跟着变化
    await page
      .getByLabel('block-item-CollectionField-users-form-users.nickname-Nickname')
      .getByRole('textbox')
      .fill('new value');
    await expect(
      page.getByLabel('block-item-CollectionField-users-form-users.username-Username').getByRole('textbox'),
    ).toHaveValue('new value');
  });

  test('subtable: basic fields', async ({ page, mockPage }) => {
    await mockPage(oneTableBlockWithAddNewAndViewAndEditAndRelationFields).goto();

    await page.getByRole('button', { name: 'Add new' }).click();

    // 先切换为子表格
    await page.getByLabel('block-item-CollectionField-general-form-general.oneToMany-oneToMany').hover();
    await page
      .getByLabel('designer-schema-settings-CollectionField-FormItem.Designer-general-general.oneToMany')
      .hover();
    await page.getByRole('menuitem', { name: 'Field component' }).click();
    await page.getByRole('option', { name: 'Sub-table' }).click();

    // 关闭下拉菜单
    await page.getByLabel('block-item-CollectionField-general-form-general.oneToMany-oneToMany').hover();
    await page
      .getByLabel('designer-schema-settings-CollectionField-FormItem.Designer-general-general.oneToMany')
      .hover();
    await page.mouse.move(100, 0);

    await page.getByLabel('schema-initializer-AssociationField.SubTable-TableColumnInitializers-users').hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await page.getByRole('menuitem', { name: 'Username' }).click();

    // 子表格状态下，没有默认值选项
    await page.getByLabel('block-item-CollectionField-general-form-general.oneToMany-oneToMany').hover();
    await expect(page.getByRole('menuitem', { name: 'Set default value' })).not.toBeVisible();

    // 测试子表格字段默认值 ------------------------------------------------------------------------------------------
    await page.getByRole('button', { name: 'Nickname', exact: true }).hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-TableV2.Column-TableV2.Column.Designer-users' })
      .hover();
    await page.getByRole('menuitem', { name: 'Set default value', exact: true }).click();
    await page.getByLabel('Set default value').getByRole('textbox').click();
    await page.getByLabel('Set default value').getByRole('textbox').fill('test default value');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 当新增一行时，应该显示默认值
    await page.getByRole('button', { name: 'plus' }).click();
    await expect(
      page
        .getByRole('cell', { name: 'block-item-CollectionField-users-form-users.nickname-Nickname' })
        .getByRole('textbox'),
    ).toHaveValue('test default value');

    // 为 username 设置一个变量默认值: {{ currentObject.nickname }}
    await page.getByRole('button', { name: 'Username', exact: true }).hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-TableV2.Column-TableV2.Column.Designer-users' })
      .hover();
    await page.getByRole('menuitem', { name: 'Set default value', exact: true }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Current object' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Nickname' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 值应该和 Nickname 一致
    await expect(
      page
        .getByRole('cell', { name: 'block-item-CollectionField-users-form-users.username-Username' })
        .getByRole('textbox'),
    ).toHaveValue('test default value');

    // 更改变量的值，longText 的值也应该跟着变化
    await page
      .getByRole('cell', { name: 'block-item-CollectionField-users-form-users.username-Username' })
      .getByRole('textbox')
      .fill('new value');
    await expect(
      page
        .getByRole('cell', { name: 'block-item-CollectionField-users-form-users.username-Username' })
        .getByRole('textbox'),
    ).toHaveValue('new value');
  });
});
