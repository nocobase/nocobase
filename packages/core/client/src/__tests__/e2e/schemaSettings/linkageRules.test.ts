import { expect, oneTableBlockWithAddNewAndViewAndEditAndBasicFields, test } from '@nocobase/test/client';

test.describe('LinkageRules', () => {
  test('form: basic usage', async ({ page, mockPage }) => {
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
    await page.getByRole('button', { name: 'Search Select field' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'number' }).click();
    await page.getByLabel('Linkage rules').getByRole('spinbutton').click();
    await page.getByLabel('Linkage rules').getByRole('spinbutton').fill('123');

    // action：使 longText 字段可编辑
    await page.getByLabel('Linkage rules').getByRole('tabpanel').getByText('Add property').click();
    await page.getByRole('button', { name: 'Search Select field' }).click();
    await page.getByRole('tree').getByText('longText').click();
    await page.getByRole('button', { name: 'Search action' }).click();
    await page.getByRole('option', { name: 'Editable' }).click();

    // action: 为 longText 字段赋上常量值
    await page.getByLabel('Linkage rules').getByRole('tabpanel').getByText('Add property').click();
    await page.getByRole('button', { name: 'Search Select field' }).click();
    await page.getByRole('tree').getByText('longText').click();
    await page.getByRole('button', { name: 'Search action' }).click();
    await page.getByRole('option', { name: 'Value', exact: true }).click();
    await page.getByLabel('dynamic-component-linkage-rules').getByRole('textbox').fill('456');

    // action: 为 integer 字段附上一个表达式，使其值等于 number 字段的值
    await page.getByLabel('Linkage rules').getByRole('tabpanel').getByText('Add property').click();

    await page.getByRole('button', { name: 'Search Select field' }).click();
    await page.getByRole('tree').getByText('integer').click();
    await page.getByRole('button', { name: 'Search action' }).click();
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

  test('action: basic usage', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    const record = await mockRecord('general');
    await nocoPage.goto();

    const openLinkageRules = async () => {
      await page.getByLabel('action-Action.Link-View record-view-general-table-0').hover();
      await page.getByRole('button', { name: 'designer-schema-settings-Action.Link-Action.Designer-general' }).hover();
      await page.getByRole('menuitem', { name: 'Linkage rules' }).click();
    };

    // 设置第一组规则 --------------------------------------------------------------------------
    await openLinkageRules();
    await page.getByRole('button', { name: 'plus Add linkage rule' }).click();

    // 添加一个条件：ID 等于 1
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByRole('menuitemcheckbox', { name: 'ID' }).click();
    await page.getByRole('spinbutton').click();
    await page.getByRole('spinbutton').fill('1');

    // action: 禁用按钮
    await page.getByText('Add property').click();
    await page.getByLabel('block-item-ArrayCollapse-general').click();
    await page.getByTestId('select-linkage-properties').getByLabel('Search').click();
    await page.getByRole('option', { name: 'Disabled' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await expect(page.getByLabel('action-Action.Link-View record-view-general-table-0')).toHaveAttribute(
      'disabled',
      '',
    );

    // 设置第二组规则 --------------------------------------------------------------------------
    await openLinkageRules();
    await page.getByRole('button', { name: 'plus Add linkage rule' }).click();
    await page.locator('.ant-collapse-header').nth(1).getByRole('img', { name: 'right' }).click();

    // 添加一个条件：ID 等于 1
    await page.getByRole('tabpanel').getByText('Add condition', { exact: true }).click();
    await page.getByRole('button', { name: 'Search Select field' }).getByLabel('Search').click();
    await page.getByRole('menuitemcheckbox', { name: 'ID' }).click();
    await page.getByRole('spinbutton').click();
    await page.getByRole('spinbutton').fill('1');

    // action: 使按钮可用
    await page.getByRole('tabpanel').getByText('Add property').click();
    await page.getByRole('combobox', { name: 'Search' }).click();
    await page.getByRole('option', { name: 'Enabled' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 后面的 action 会覆盖前面的
    await expect(page.getByLabel('action-Action.Link-View record-view-general-table-0')).not.toHaveAttribute(
      'disabled',
      '',
    );
  });
});
