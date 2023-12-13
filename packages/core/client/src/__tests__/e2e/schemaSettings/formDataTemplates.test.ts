import { expect, oneTableBlockWithAddNewAndViewAndEditAndBasicFields, test } from '@nocobase/test/client';

test.describe('formDataTemplates', () => {
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
    await page.getByTestId('select-filter-field').getByLabel('Search').click();
    await page.getByRole('menuitemcheckbox', { name: 'ID' }).click();
    await page.getByLabel('Form data templates').getByRole('spinbutton').click();
    await page.getByLabel('Form data templates').getByRole('spinbutton').fill('2');

    // 选择 ID 作为 title field
    await page.getByTestId('select-single').click();
    await page.getByRole('option', { name: 'ID' }).click();

    // 仅选中一个字段
    await page.getByRole('button', { name: 'singleLineText (Duplicate)' }).click();

    // 保存
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 保存成功后应该显示 Data template 选项
    await expect(page.getByText('Data template:')).toBeVisible();

    // 选择一个模板
    await page.getByTestId('select-form-data-template').click();
    await page.getByRole('option', { name: 'Template name 1' }).click();
    await page.getByTestId('select-object-undefined').click();

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
    await page.getByTestId('select-object-undefined').getByLabel('Search').click();
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
