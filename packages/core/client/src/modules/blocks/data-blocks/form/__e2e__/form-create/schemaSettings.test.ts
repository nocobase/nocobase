import {
  Page,
  expect,
  expectSettingsMenu,
  oneEmptyForm,
  oneEmptyFormWithActions,
  oneTableBlockWithActionsAndFormBlocks,
  oneTableBlockWithAddNewAndViewAndEditAndAssociationFields,
  oneTableBlockWithAddNewAndViewAndEditAndBasicFields,
  test,
} from '@nocobase/test/e2e';
import { T2165, T2174, T3251, T3806 } from './templatesOfBug';

const clickOption = async (page: Page, optionName: string) => {
  await page.getByLabel('block-item-CardItem-general-form').hover();
  await page.getByLabel('designer-schema-settings-CardItem-FormV2.Designer-general').hover();
  await page.getByRole('menuitem', { name: optionName }).click();
};

test.describe('creation form block schema settings', () => {
  test('edit block title', async ({ page, mockPage }) => {
    await mockPage(oneTableBlockWithActionsAndFormBlocks).goto();
    await page.getByRole('button', { name: 'Add new' }).click();

    // 打开编辑弹窗
    await clickOption(page, 'Edit block title');
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('Block title 123');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    const runExpect = async () => {
      // 设置成功后，显示在区块顶部
      await expect(
        page.getByLabel('block-item-CardItem-general-form').getByText('Block title 123', { exact: true }),
      ).toBeVisible();

      // 再次打开编辑弹窗时，显示的是上次设置的值
      await clickOption(page, 'Edit block title');
      await expect(page.getByRole('textbox')).toHaveValue('Block title 123');
    };

    await runExpect();

    // 刷新页面后，显示的应该依然是上次设置的值
    await page.reload();
    await page.getByRole('button', { name: 'Add new' }).click();
    await runExpect();
  });

  test.describe('linkage rules', () => {
    test('basic usage', async ({ page, mockPage }) => {
      const openLinkageRules = async () => {
        await page.getByLabel('designer-schema-settings-CardItem-FormV2.Designer-general').hover();
        await page.getByRole('menuitem', { name: 'Linkage rules' }).click();
      };

      await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).goto();

      await page.getByRole('button', { name: 'Add new' }).click();

      // 设置第一组规则 --------------------------------------------------------------------------
      // 打开联动规则弹窗
      await page.getByLabel('block-item-CardItem-general-form').hover();
      await openLinkageRules();

      // 增加一组规则
      // 条件：singleLineText 字段的值包含 123 时
      await page.getByRole('button', { name: 'plus Add linkage rule' }).click();
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('select-filter-field').click();
      await page.getByRole('menuitemcheckbox', { name: 'singleLineText' }).click();
      await page.getByLabel('Linkage rules').locator('input[type="text"]').click();
      await page.getByLabel('Linkage rules').locator('input[type="text"]').fill('123');

      // action：禁用 longText 字段
      await page.getByText('Add property').click();
      await page.getByTestId('select-linkage-property-field').click();
      await page.getByRole('tree').getByText('longText').click();
      await page.getByTestId('select-linkage-action-field').click();
      await page.getByRole('option', { name: 'Disabled' }).click();

      // 保存规则
      await page.getByRole('button', { name: 'OK' }).click();

      // 验证第一组规则 --------------------------------------------------------------------------
      // 初始状态下，longText 字段是可编辑的
      await expect(
        page.getByLabel('block-item-CollectionField-general-form-general.longText-longText').getByRole('textbox'),
      ).toBeEditable();

      // 输入 123，longText 字段被禁用
      await page
        .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
        .getByRole('textbox')
        .click();
      await page
        .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
        .getByRole('textbox')
        .fill('123');
      await expect(
        page.getByLabel('block-item-CollectionField-general-form-general.longText-longText').getByRole('textbox'),
      ).toBeDisabled();

      // 清空输入，longText 字段应该恢复成可编辑状态
      await page
        .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
        .getByRole('textbox')
        .clear();
      await expect(
        page.getByLabel('block-item-CollectionField-general-form-general.longText-longText').getByRole('textbox'),
      ).toBeEditable();

      // 修改第一组规则，使其条件中包含一个变量 --------------------------------------------------------------------------
      // 当 singleLineText 字段的值包含 longText 字段的值时，禁用 longText 字段
      await openLinkageRules();
      await page.getByLabel('variable-button').click();
      await page.getByRole('menuitemcheckbox', { name: 'Current form' }).click();
      await page.getByRole('menuitemcheckbox', { name: 'longText' }).click();
      await page.getByRole('button', { name: 'OK' }).click();

      // singleLineText 字段和 longText 字段都为空的情况下，longText 字段应该是可编辑的
      await expect(
        page.getByLabel('block-item-CollectionField-general-form-general.longText-longText').getByRole('textbox'),
      ).toBeEditable();

      // 先为 longText 字段填入 123，然后为 singleLineText 字段填入 1，longText 字段应该是可编辑的
      await page
        .getByLabel('block-item-CollectionField-general-form-general.longText-longText')
        .getByRole('textbox')
        .fill('123');
      await page
        .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
        .getByRole('textbox')
        .fill('1');
      await expect(
        page.getByLabel('block-item-CollectionField-general-form-general.longText-longText').getByRole('textbox'),
      ).toBeEditable();

      // 改变变量的值：即将 longText 字段的值改为 1，longText 字段应该是禁用的
      await page
        .getByLabel('block-item-CollectionField-general-form-general.longText-longText')
        .getByRole('textbox')
        .click();
      await page.keyboard.press('Backspace');
      await page.keyboard.press('Backspace');
      await expect(
        page.getByLabel('block-item-CollectionField-general-form-general.longText-longText').getByRole('textbox'),
      ).toBeDisabled();

      // 添加第二组规则 -------------------------------------------------------------------------------------------
      await openLinkageRules();

      // 增加一条规则：当 number 字段的值等于 123 时
      await page.getByRole('button', { name: 'plus Add linkage rule' }).click();
      await page.locator('.ant-collapse-header').nth(1).getByRole('img', { name: 'right' }).click();

      await page.getByLabel('Linkage rules').getByRole('tabpanel').getByText('Add condition', { exact: true }).click();
      await page.getByRole('button', { name: 'Select field' }).click();
      await page.getByRole('menuitemcheckbox', { name: 'number' }).click();
      await page.getByLabel('Linkage rules').getByRole('spinbutton').click();
      await page.getByLabel('Linkage rules').getByRole('spinbutton').fill('123');

      // action：使 longText 字段可编辑
      await page.getByLabel('Linkage rules').getByRole('tabpanel').getByText('Add property').click();
      await page.getByRole('button', { name: 'Select field' }).click();
      await page.getByRole('tree').getByText('longText').click();
      await page.getByRole('button', { name: 'action', exact: true }).click();
      await page.getByRole('option', { name: 'Editable' }).click();

      // action: 为 longText 字段赋上常量值
      await page.getByLabel('Linkage rules').getByRole('tabpanel').getByText('Add property').click();
      await page.getByRole('button', { name: 'Select field' }).click();
      await page.getByRole('tree').getByText('longText').click();
      await page.getByRole('button', { name: 'action', exact: true }).click();
      await page.getByRole('option', { name: 'Value', exact: true }).click();
      await page.getByLabel('dynamic-component-linkage-rules').getByRole('textbox').fill('456');

      // action: 为 integer 字段附上一个表达式，使其值等于 number 字段的值
      await page.getByLabel('Linkage rules').getByRole('tabpanel').getByText('Add property').click();

      await page.getByRole('button', { name: 'Select field' }).click();
      await page.getByRole('tree').getByText('integer').click();
      await page.getByRole('button', { name: 'action', exact: true }).click();
      await page.getByRole('option', { name: 'Value', exact: true }).click();
      await page.getByTestId('select-linkage-value-type').nth(1).click();
      await page.getByText('Expression').click();

      await page.getByText('xSelect a variable').click();
      await page.getByRole('menuitemcheckbox', { name: 'Current form right' }).click();
      await page.getByRole('menuitemcheckbox', { name: 'number' }).click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();

      // 验证第二组规则 -------------------------------------------------------------------------------------------
      // 此时 longText 字段是禁用状态，当满足第二组规则时，longText 字段应该是可编辑的
      await page
        .getByLabel('block-item-CollectionField-general-form-general.number-number')
        .getByRole('spinbutton')
        .fill('123');
      await expect(
        page.getByLabel('block-item-CollectionField-general-form-general.longText-longText').getByRole('textbox'),
      ).toBeEditable();

      // 并且 longText 字段的值应该是 456
      await expect(
        page.getByLabel('block-item-CollectionField-general-form-general.longText-longText').getByRole('textbox'),
      ).toHaveValue('456');

      // integer 字段的值应该等于 number 字段的值
      await expect(
        page.getByLabel('block-item-CollectionField-general-form-general.integer-integer').getByRole('spinbutton'),
      ).toHaveValue('123');
    });

    // https://nocobase.height.app/T-2165
    test('variable labels should be displayed normally', async ({ page, mockPage }) => {
      await mockPage(T2165).goto();

      await page.getByLabel('block-item-CardItem-users-form').hover();
      await page.getByLabel('designer-schema-settings-CardItem-FormV2.Designer-users').hover();
      await page.getByRole('menuitem', { name: 'Linkage rules' }).click();

      await expect(page.getByText('Current form / Nickname')).toBeVisible();
      await expect(page.getByText('Current form / Phone')).toBeVisible();
    });

    // https://nocobase.height.app/T-3251
    test('nested conditions', async ({ page, mockPage }) => {
      await mockPage(T3251).goto();

      // 一开始 email 字段是可编辑的
      await expect(
        page.getByLabel('block-item-CollectionField-users-form-users.email-Email').getByRole('textbox'),
      ).toBeEditable();

      // 满足联动规则条件时，email 字段应该是禁用的
      await page
        .getByLabel('block-item-CollectionField-users-form-users.nickname-Nickname')
        .getByRole('textbox')
        .fill('nickname');
      await page
        .getByLabel('block-item-CollectionField-users-form-users.username-Username')
        .getByRole('textbox')
        .fill('username');
      await expect(
        page.getByLabel('block-item-CollectionField-users-form-users.email-Email').getByRole('textbox'),
      ).toBeDisabled();

      // 再次改成不满足条件时，email 字段应该是可编辑的
      await page
        .getByLabel('block-item-CollectionField-users-form-users.nickname-Nickname')
        .getByRole('textbox')
        .clear();
      await expect(
        page.getByLabel('block-item-CollectionField-users-form-users.email-Email').getByRole('textbox'),
      ).toBeEditable();
    });

    // https://nocobase.height.app/T-3806
    test('after save as block template', async ({ page, mockPage }) => {
      await mockPage(T3806).goto();

      // 1. 一开始联动规则应该正常
      await page
        .getByLabel('block-item-CollectionField-users-form-users.nickname-Nickname')
        .getByRole('textbox')
        .fill('123');
      await expect(
        page.getByLabel('block-item-CollectionField-users-form-users.username-Username').getByRole('textbox'),
      ).toHaveValue('123');

      try {
        // 2. 将表单区块保存为模板后
        await page.getByLabel('block-item-CardItem-users-form').hover();
        await page.getByLabel('designer-schema-settings-CardItem-blockSettings:createForm-users').hover();
        await page.getByRole('menuitem', { name: 'Save as block template' }).click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForTimeout(1000);

        // 3. 联动规则应该依然是正常的
        await page
          .getByLabel('block-item-CollectionField-users-form-users.nickname-Nickname')
          .getByRole('textbox')
          .fill('456');
        await expect(
          page.getByLabel('block-item-CollectionField-users-form-users.username-Username').getByRole('textbox'),
        ).toHaveValue('456');
      } catch (err) {
        throw err;
      } finally {
        // 4. 把创建的模板删除
        await page.goto('/admin/settings/ui-schema-storage');
        await page.getByLabel('Select all').check();
        await page.getByLabel('action-Action-Delete-destroy-').click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await expect(page.getByRole('row', { name: 'Users_Form' }).first()).toBeHidden();
      }
    });
  });

  test('Save as block template & convert reference to duplicate', async ({ page, mockPage }) => {
    await mockPage(oneTableBlockWithActionsAndFormBlocks).goto();
    await page.getByRole('button', { name: 'Add new' }).click();

    // 打开编辑弹窗
    await clickOption(page, 'Save as block template');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 设置成功后，不再显示 Save as block template 选项，而是显示 Convert reference to duplicate 选项
    await page.getByLabel('block-item-CardItem-general-form').hover();
    await page.getByLabel('designer-schema-settings-CardItem-FormV2.Designer-general').hover();
    await expect(page.getByRole('menuitem', { name: 'Save as block template' })).not.toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Convert reference to duplicate' })).toBeVisible();

    // 刷新页面
    await page.reload();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel('block-item-CardItem-general-form').hover();
    await page.getByLabel('designer-schema-settings-CardItem-FormV2.Designer-general').hover();
    await expect(page.getByRole('menuitem', { name: 'Save as block template' })).not.toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Convert reference to duplicate' })).toBeVisible();

    // Convert reference to duplicate
    await clickOption(page, 'Convert reference to duplicate');
    // 点击之后下拉框不应该关闭，如果下拉框关闭了下面这行代码会报错
    await expect(page.getByRole('menuitem', { name: 'Save as block template' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Convert reference to duplicate' })).not.toBeVisible();

    // 刷新页面
    await page.reload();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel('block-item-CardItem-general-form').hover();
    await page.getByLabel('designer-schema-settings-CardItem-FormV2.Designer-general').hover();
    await expect(page.getByRole('menuitem', { name: 'Save as block template' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Convert reference to duplicate' })).not.toBeVisible();

    // 保存为模板之后，应该在 ui-schema-storage 页面显示出来
    await page.goto('/admin/settings/ui-schema-storage');
    await expect(page.getByRole('row', { name: 'General_Form' }).first()).toBeVisible();

    // 删除创建的模板，以免影响其它测试
    await page.getByLabel('Select all').check();
    await page.getByLabel('action-Action-Delete-destroy-').click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByRole('row', { name: 'General_Form' }).first()).toBeHidden();
  });

  test('delete', async ({ page, mockPage }) => {
    await mockPage(oneTableBlockWithActionsAndFormBlocks).goto();

    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel('block-item-CardItem-general-form').hover();
    await page.getByLabel('designer-schema-settings-CardItem-FormV2.Designer-general').hover();

    // 打开编辑弹窗
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 设置成功后，显示在区块顶部
    await expect(page.getByLabel('block-item-CardItem-general-form')).not.toBeVisible();

    // 刷新页面后，区块依然是被删除状态
    await page.reload();
    await page.getByRole('button', { name: 'Add new' }).click();
    await expect(page.getByLabel('block-item-CardItem-general-form')).not.toBeVisible();
  });

  test('save as block Template', async ({ page, mockPage }) => {
    await mockPage(oneEmptyForm).goto();

    // 先保存为模板 ------------------------------------------------------------------------
    await showSettingsMenu(page);
    await page.getByRole('menuitem', { name: 'Save as block template' }).click();
    // 输入框中应该有一个默认的名字
    await expect(page.getByRole('dialog').getByRole('textbox')).toHaveValue('General_Form');
    // 设置一个新的名字
    await page.getByRole('dialog').getByRole('textbox').click();
    await page.getByRole('dialog').getByRole('textbox').fill('new_form_template');
    await page.getByRole('dialog').getByRole('button', { name: 'OK', exact: true }).click();

    // 区块左上角应该显示一个文案
    await page.getByLabel('block-item-CardItem-general-form').hover();
    await expect(
      page
        .getByLabel('block-item-CardItem-general-form')
        .getByText('Reference template: new_form_template (Fields only)'),
    ).toBeVisible();

    // settings 菜单中 Save as block template 应该变为 Convert reference to duplicate
    await showSettingsMenu(page);
    await expect(page.getByRole('menuitem', { name: 'Save as block template' })).toBeHidden();
    await expect(page.getByRole('menuitem', { name: 'Convert reference to duplicate' })).toBeVisible();

    // 创建区块的时候，可以选择刚才保存的模板 --------------------------------------------------
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await page.getByRole('menuitem', { name: 'form Form right' }).first().hover();
    await page.getByRole('menuitem', { name: 'General right' }).hover();

    // Duplicate template
    await page.getByRole('menuitem', { name: 'Duplicate template right' }).hover();
    await page.getByRole('menuitem', { name: 'new_form_template (Fields only)' }).click();

    // Reference template
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await page.getByRole('menuitem', { name: 'form Form right' }).first().hover();
    await page.getByRole('menuitem', { name: 'General right' }).hover();
    await page.getByRole('menuitem', { name: 'General right' }).click();
    await page.getByRole('menuitem', { name: 'Reference template right' }).click();
    await page.getByRole('menuitem', { name: 'new_form_template (Fields only)' }).click();

    // 页面中的区块应该成功被创建
    await expect(page.getByLabel('block-item-CardItem-general-form')).toHaveCount(3);

    // 保存为模板之后，应该在 ui-schema-storage 页面显示出来 -----------------------------------------
    await page.goto('/admin/settings/ui-schema-storage');
    await expect(page.getByRole('row', { name: 'new_form_template' }).first()).toBeVisible();

    // 最后需要把保存的模板删除掉，以免影响其它测试
    await page.getByLabel('Select all').check();
    await page.getByLabel('action-Action-Delete-destroy-').click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByRole('row', { name: 'new_form_template' }).first()).toBeHidden();

    async function showSettingsMenu(page) {
      await page.getByLabel('block-item-CardItem-general-form').hover();
      await page.getByLabel('designer-schema-settings-CardItem-FormV2.Designer-general').hover();
    }
  });

  test.describe('form data templates', () => {
    test('basic usage', async ({ page, mockPage, mockRecords }) => {
      const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
      const records = await mockRecords('general', 3);
      await nocoPage.goto();

      const record = records.find((item) => item.id === 2);

      const openDialog = async () => {
        await page.getByLabel('block-item-CardItem-general-form').hover();
        await page.getByLabel('designer-schema-settings-CardItem-FormV2.Designer-general').hover();
        await page.getByRole('menuitem', { name: 'Form data templates' }).click();
      };

      await page.getByRole('button', { name: 'Add new' }).click();
      await openDialog();
      await page.getByRole('button', { name: 'plus Add template' }).click();

      // 非继承表是不需要显示 Collection 选项的
      await expect(page.getByText('Collection:')).toBeHidden();

      // 添加一个数据范围，条件是：ID = 2
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('select-filter-field').click();
      await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
      await page.getByLabel('Form data templates').getByRole('spinbutton').click();
      await page.getByLabel('Form data templates').getByRole('spinbutton').fill('2');

      // 选择 ID 作为 title field
      await page.getByTestId('select-single').click();
      await page.getByRole('option', { name: 'ID', exact: true }).click();

      // 仅选中一个字段
      await page.getByRole('button', { name: 'singleLineText (Duplicate)' }).click();

      // 保存
      await page.getByRole('button', { name: 'OK', exact: true }).click();

      // 保存成功后应该显示 Data template 选项
      await expect(page.getByText('Data template:')).toBeVisible();

      // 选择一个模板
      await page.getByTestId('select-form-data-template').click();
      await page.getByRole('option', { name: 'Template name 1' }).click();
      await page.getByTestId('select-object-single').click();

      // 因为添加了数据范围，所以只显示一个选项
      await expect(page.getByRole('option')).toHaveCount(1);

      // 选中数据
      await page.getByRole('option', { name: '2' }).click();

      await expect(
        page
          .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
          .getByRole('textbox'),
      ).toHaveValue(record.singleLineText);

      // 其它未选中的字段的数据应该是空的
      await expect(
        page.getByLabel('block-item-CollectionField-general-form-general.integer-integer').getByRole('spinbutton'),
      ).toBeEmpty();

      // 同步表单字段
      await openDialog();
      await page.getByLabel('action-Action.Link-Sync from form fields-general').click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();

      // 重新选择一下数据，字段值才会被填充
      // TODO: 保存后，数据应该直接被填充上
      await page.getByLabel('icon-close-select').click();
      await page.getByTestId('select-object-single').click();
      await page.getByRole('option', { name: '2' }).click();

      await expect(
        page.getByLabel('block-item-CollectionField-general-form-general.email-email').getByRole('textbox'),
      ).toHaveValue(record.email);
      await expect(
        page.getByLabel('block-item-CollectionField-general-form-general.integer-integer').getByRole('spinbutton'),
      ).toHaveValue(String(record.integer));
      await expect(
        page.getByLabel('block-item-CollectionField-general-form-general.number-number').getByRole('spinbutton'),
      ).toHaveValue(String(record.number));

      // 隐藏模板选项
      await openDialog();
      await page.getByLabel('Display data template selector').click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();

      await expect(page.getByText('Data template:')).toBeHidden();
    });
  });

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
      await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).goto();

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

      await page.getByLabel('schema-initializer-Grid-form:configureFields-users').hover();
      await page.getByRole('menuitem', { name: 'Nickname' }).click();
      await page.getByRole('menuitem', { name: 'Username' }).click();

      // 子表单状态下，没有默认值选项
      await page.getByLabel('block-item-CollectionField-general-form-general.manyToOne-manyToOne').hover();
      await expect(page.getByRole('menuitem', { name: 'Set default value' })).not.toBeVisible();

      // 测试子表单字段默认值 ------------------------------------------------------------------------------------------
      await page.getByLabel(`block-item-CollectionField-users-form-users.nickname-Nickname`).hover();
      await page
        .getByLabel(`designer-schema-settings-CollectionField-fieldSettings:FormItem-users-users.Nickname`)
        .hover();
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
      await page
        .getByLabel(`designer-schema-settings-CollectionField-fieldSettings:FormItem-users-users.Username`)
        .hover();
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
      await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAssociationFields).goto();

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

      await page.getByLabel('schema-initializer-AssociationField.SubTable-table:configureColumns-users').hover();
      await page.getByRole('menuitem', { name: 'Nickname' }).click();
      await page.getByRole('menuitem', { name: 'Username' }).click();

      // 子表格状态下，没有默认值选项
      await page.getByLabel('block-item-CollectionField-general-form-general.oneToMany-oneToMany').hover();
      await expect(page.getByRole('menuitem', { name: 'Set default value' })).not.toBeVisible();

      // 测试子表格字段默认值 ------------------------------------------------------------------------------------------
      await page.getByRole('button', { name: 'Nickname', exact: true }).hover();
      await page
        .getByRole('button', { name: 'designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-users' })
        .hover();
      await page.getByRole('menuitem', { name: 'Set default value', exact: true }).click();
      await page.mouse.move(300, 0);
      await page.getByLabel('Set default value').getByRole('textbox').click();
      await page.getByLabel('Set default value').getByRole('textbox').fill('test default value');
      await page.getByRole('button', { name: 'OK', exact: true }).click();

      // 确保下拉选项被隐藏
      await page.getByRole('button', { name: 'Nickname', exact: true }).hover();
      await page
        .getByRole('button', { name: 'designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-users' })
        .hover();
      await page.mouse.move(300, 0);

      // 当新增一行时，应该显示默认值
      await page
        .getByTestId('drawer-Action.Container-general-Add record')
        .getByRole('button', { name: 'Add new' })
        .click();
      await expect(
        page
          .getByRole('cell', { name: 'block-item-CollectionField-users-form-users.nickname-Nickname' })
          .getByRole('textbox'),
      ).toHaveValue('test default value');

      // 为 username 设置一个变量默认值: {{ currentObject.nickname }}
      await page.getByRole('button', { name: 'Username', exact: true }).hover();
      await page
        .getByRole('button', { name: 'designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-users' })
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

    // fix https://nocobase.height.app/T-2174
    test('should show default value option', async ({ page, mockPage, mockRecord }) => {
      const nocoPage = await mockPage(T2174).waitForInit();
      await mockRecord('test2174');
      await nocoPage.goto();

      await page.getByLabel('action-Action.Link-View details-view-test2174-table-0').click();
      await page.getByLabel('block-item-CollectionField-test2174-form-test2174.singleSelect-Single select').hover();
      await page
        .getByLabel('designer-schema-settings-CollectionField-FormItem.Designer-test2174-test2174.singleSelect')
        .hover();

      await expect(page.getByRole('menuitem', { name: 'Set default value' })).toBeVisible();
    });
  });

  test('save block template & using block template', async ({ page, mockPage }) => {
    await mockPage({
      pageSchema: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Page',
        properties: {
          bg76x03o9f2: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'page:addBlock',
            properties: {
              gdj0ceke8ac: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Row',
                properties: {
                  ftx8xnesvev: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-component': 'Grid.Col',
                    properties: {
                      tu0dxua38tw: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-acl-action-props': {
                          skipScopeCheck: true,
                        },
                        'x-acl-action': 'users:create',
                        'x-decorator': 'FormBlockProvider',
                        'x-decorator-props': {
                          resource: 'users',
                          collection: 'users',
                        },
                        'x-designer': 'FormV2.Designer',
                        'x-component': 'CardItem',
                        'x-component-props': {},
                        properties: {
                          avv3vpk0nlv: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'FormV2',
                            'x-component-props': {
                              useProps: '{{ useFormBlockProps }}',
                            },
                            properties: {
                              grid: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid',
                                'x-initializer': 'form:configureFields',
                                properties: {
                                  gnw25oyqe56: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Row',
                                    properties: {
                                      rdbe3gg1qv5: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        'x-component': 'Grid.Col',
                                        properties: {
                                          nickname: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'string',
                                            'x-designer': 'FormItem.Designer',
                                            'x-component': 'CollectionField',
                                            'x-decorator': 'FormItem',
                                            'x-collection-field': 'users.nickname',
                                            'x-component-props': {},
                                            'x-uid': 'okrljzl6j7s',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': '1zjdduck27k',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'l0cyy3gzz86',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': '4wrgwkyyf81',
                                'x-async': false,
                                'x-index': 1,
                              },
                              actions: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-initializer': 'createForm:configureActions',
                                'x-component': 'ActionBar',
                                'x-component-props': {
                                  layout: 'one-column',
                                  style: {
                                    marginTop: 24,
                                  },
                                },
                                'x-uid': '2apymtcq35d',
                                'x-async': false,
                                'x-index': 2,
                              },
                            },
                            'x-uid': '1tnmbrvb9ad',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'vo1pyqmoe28',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'z59pkpc8uhq',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'vsfafj9qcx9',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'sdj6iw5b0gs',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'uz4dyz41vt1',
        'x-async': true,
        'x-index': 1,
      },
    }).goto();
    await page.getByLabel('block-item-CardItem-users-form').hover();
    await page
      .getByLabel('block-item-CardItem-users-form')
      .getByLabel('designer-schema-settings-CardItem-FormV2.Designer-users')
      .hover();
    await page.getByRole('menuitem', { name: 'Save as block template' }).click();
    await page.getByLabel('Save as template').getByRole('textbox').fill('Users_Form');
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.getByLabel('block-item-CardItem-users-form').hover();

    //保存模板后当前区块为引用区块
    await expect(page.getByLabel('block-item-CardItem-users-form')).toHaveText(/Reference template/);

    // using block template
    await mockPage({
      pageSchema: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Page',
        properties: {
          mwxaaxb9y9v: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'page:addBlock',
            properties: {
              ibb0kjq3kyl: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Row',
                properties: {
                  p39cigcjpij: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-component': 'Grid.Col',
                    properties: {
                      '237ec1x538e': {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-decorator': 'TableBlockProvider',
                        'x-acl-action': 'users:list',
                        'x-decorator-props': {
                          collection: 'users',
                          resource: 'users',
                          action: 'list',
                          params: {
                            pageSize: 20,
                          },
                          rowKey: 'id',
                          showIndex: true,
                          dragSort: false,
                          disableTemplate: false,
                        },
                        'x-designer': 'TableBlockDesigner',
                        'x-component': 'CardItem',
                        'x-filter-targets': [],
                        properties: {
                          actions: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-initializer': 'table:configureActions',
                            'x-component': 'ActionBar',
                            'x-component-props': {
                              style: {
                                marginBottom: 'var(--nb-spacing)',
                              },
                            },
                            properties: {
                              lmeom75gry5: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-action': 'create',
                                'x-acl-action': 'create',
                                title: "{{t('Add new')}}",
                                'x-designer': 'Action.Designer',
                                'x-component': 'Action',
                                'x-decorator': 'ACLActionProvider',
                                'x-component-props': {
                                  openMode: 'drawer',
                                  type: 'primary',
                                  component: 'CreateRecordAction',
                                  icon: 'PlusOutlined',
                                },
                                'x-align': 'right',
                                'x-acl-action-props': {
                                  skipScopeCheck: true,
                                },
                                properties: {
                                  drawer: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{ t("Add record") }}',
                                    'x-component': 'Action.Container',
                                    'x-component-props': {
                                      className: 'nb-action-popup',
                                    },
                                    properties: {
                                      tabs: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        'x-component': 'Tabs',
                                        'x-component-props': {},
                                        'x-initializer': 'TabPaneInitializersForCreateFormBlock',
                                        properties: {
                                          tab1: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            title: '{{t("Add new")}}',
                                            'x-component': 'Tabs.TabPane',
                                            'x-designer': 'Tabs.Designer',
                                            'x-component-props': {},
                                            properties: {
                                              grid: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid',
                                                'x-initializer': 'popup:addNew:addBlock',
                                                'x-uid': 'w224zhqyair',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'lll44vre1t6',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'c025dgp5tyk',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'og2z02rfxhx',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'vn9wxzx83y3',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '7s3fcxfjc0y',
                            'x-async': false,
                            'x-index': 1,
                          },
                          zqdtqsjqgc1: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'array',
                            'x-initializer': 'table:configureColumns',
                            'x-component': 'TableV2',
                            'x-component-props': {
                              rowKey: 'id',
                              rowSelection: {
                                type: 'checkbox',
                              },
                              useProps: '{{ useTableBlockProps }}',
                            },
                            properties: {
                              actions: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                title: '{{ t("Actions") }}',
                                'x-action-column': 'actions',
                                'x-decorator': 'TableV2.Column.ActionBar',
                                'x-component': 'TableV2.Column',
                                'x-designer': 'TableV2.ActionColumnDesigner',
                                'x-initializer': 'table:configureItemActions',
                                properties: {
                                  actions: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-decorator': 'DndContext',
                                    'x-component': 'Space',
                                    'x-component-props': {
                                      split: '|',
                                    },
                                    properties: {
                                      kdcs236lihl: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        title: '{{ t("Edit") }}',
                                        'x-action': 'update',
                                        'x-designer': 'Action.Designer',
                                        'x-component': 'Action.Link',
                                        'x-component-props': {
                                          openMode: 'drawer',
                                          icon: 'EditOutlined',
                                        },
                                        'x-decorator': 'ACLActionProvider',
                                        'x-designer-props': {
                                          linkageAction: true,
                                        },
                                        properties: {
                                          drawer: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            title: '{{ t("Edit record") }}',
                                            'x-component': 'Action.Container',
                                            'x-component-props': {
                                              className: 'nb-action-popup',
                                            },
                                            properties: {
                                              tabs: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Tabs',
                                                'x-component-props': {},
                                                'x-initializer': 'TabPaneInitializers',
                                                properties: {
                                                  tab1: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    title: '{{t("Edit")}}',
                                                    'x-component': 'Tabs.TabPane',
                                                    'x-designer': 'Tabs.Designer',
                                                    'x-component-props': {},
                                                    properties: {
                                                      grid: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid',
                                                        'x-initializer': 'popup:common:addBlock',
                                                        'x-uid': 's49vs6v3qs0',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': '33qff1grgqn',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': '3z1hbrs3bre',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': '09vwzm2det2',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'bgdfnken9ua',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'tn98i5lgydw',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'ubmt489cxzn',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 't6eg1ye4wf4',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'h4yvac2sy2g',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': '3xei2593vgu',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'm67du7wrojo',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': '7aige8a5w3q',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'qpbgsjdsgaq',
        'x-async': true,
        'x-index': 1,
      },
    }).goto();
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    //使用复制模板
    await page.getByRole('menuitem', { name: 'form Form' }).first().hover();
    await page.getByRole('menuitem', { name: 'Users' }).hover();
    await page.getByRole('menuitem', { name: 'Duplicate template' }).hover();
    await page.getByRole('menuitem', { name: 'Users_Form (Fields only)' }).first().click();
    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CardItem-users-form')).toBeVisible();

    //在新建操作中使用引用模板
    await page.getByLabel('action-Action-Add new-create-users-table').click();
    await page.getByLabel('schema-initializer-Grid-popup:addNew:addBlock-users').hover();
    await page.getByRole('menuitem', { name: 'form Form' }).first().hover();
    await page.getByRole('menuitem', { name: 'Reference template' }).hover();
    await page.getByRole('menuitem', { name: 'Users_Form (Fields only)' }).first().click();
    await page.mouse.move(300, 0);
    await page.getByLabel('schema-initializer-Grid-popup:addNew:addBlock-users').hover();
    await expect(page.locator('.ant-drawer').getByLabel('block-item-CardItem-users-form')).toBeVisible();
    await page.locator('.ant-drawer-mask').click();

    //在编辑操作中使用引用模板
    await page.getByLabel('action-Action.Link-Edit-update-users-table-0').click();
    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-users').click();
    await page.getByRole('menuitem', { name: 'form Form (Edit)' }).first().hover();
    await page.getByRole('menuitem', { name: 'Reference template' }).hover();
    await page.getByRole('menuitem', { name: 'Users_Form (Fields only)' }).first().click();
    await page.mouse.move(300, 0);

    //修改引用模板
    await page.locator('.ant-drawer').getByLabel('schema-initializer-Grid-form:configureFields-users').hover();
    await page.getByRole('menuitem', { name: 'Phone' }).click();
    await page.locator('.ant-drawer-mask').click();
    //复制模板不同步，引用模板同步
    await expect(
      page.getByLabel('block-item-CardItem-users-form').getByLabel('block-item-CollectionField-users-form-users.phone'),
    ).not.toBeVisible();
    await page.getByLabel('block-item-CardItem-users-table').getByLabel('action-Action-Add').click();
    await expect(page.getByLabel('block-item-CollectionField-users-form-users.phone')).toBeVisible();
    await page.locator('.ant-drawer-mask').click();

    //删除模板
    await page.getByTestId('plugin-settings-button').click();
    await page.getByRole('link', { name: 'Block templates' }).click();
    await page.getByRole('menuitem', { name: 'layout Block templates' }).click();
    await page.getByLabel('Select all').check();
    await page.getByLabel('action-Action-Delete-destroy-').click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
  });
});

test.describe('actions schema settings', () => {
  test('submit', async ({ page, mockPage }) => {
    await mockPage(oneEmptyFormWithActions).goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByRole('button', { name: 'Submit' }).hover();
        await page.getByRole('button', { name: 'designer-schema-settings-Action-Action.Designer-users' }).hover();
      },
      supportedOptions: ['Edit button', 'Secondary confirmation', 'Bind workflows', 'Delete'],
    });
  });

  test('customize: save record', async ({ page, mockPage }) => {
    await mockPage(oneEmptyFormWithActions).goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByRole('button', { name: 'Save record' }).hover();
        await page.getByRole('button', { name: 'designer-schema-settings-Action-Action.Designer-users' }).hover();
      },
      supportedOptions: [
        'Edit button',
        'Assign field values',
        'Skip required validation',
        'After successful submission',
        'Bind workflows',
        'Delete',
      ],
    });
  });
});
