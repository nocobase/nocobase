import { Page, expect, oneTableBlockWithActionsAndFormBlocks, test } from '@nocobase/test/client';

const clickOption = async (page: Page, optionName: string) => {
  await page.getByLabel('block-item-CardItem-general-form').hover();
  await page.getByLabel('designer-schema-settings-CardItem-FormV2.Designer-general').hover();
  await page.getByRole('menuitem', { name: optionName }).click();
};

test.describe('SchemaSettings: creating form block', () => {
  test('Edit block title', async ({ page, mockPage }) => {
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
  test('Linkage rules', async ({ page, mockPage }) => {
    await mockPage(oneTableBlockWithActionsAndFormBlocks).goto();
    await page.getByRole('button', { name: 'Add new' }).click();

    // 打开编辑弹窗
    await clickOption(page, 'Linkage rules');
    await page.getByRole('button', { name: 'Add linkage rule' }).click();
    await page.getByText('Add property').click();
    await page.getByTestId('select-linkage-property-field').click();
    await page.getByText('singleLineText', { exact: true }).click();
    await page.getByTestId('select-linkage-action-field').click();
    await page.getByRole('option', { name: 'Visible' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    const runExpect = async () => {
      await expect(page.getByTestId('select-linkage-property-field').getByText('singleLineText')).toBeVisible();
      await expect(page.getByTestId('select-linkage-action-field').getByText('Visible')).toBeVisible();
    };

    // 再次打开，设置的值应该存在
    await clickOption(page, 'Linkage rules');
    await runExpect();

    // 刷新页面后，设置的值应该依然存在
    await page.reload();
    await page.getByRole('button', { name: 'Add new' }).click();
    await clickOption(page, 'Linkage rules');
    await runExpect();
  });
  test('Form data templates', async ({ page, mockPage }) => {
    await mockPage(oneTableBlockWithActionsAndFormBlocks).goto();
    await page.getByRole('button', { name: 'Add new' }).click();

    // 打开编辑弹窗
    await clickOption(page, 'Form data templates');
    await page.getByRole('button', { name: 'Add template' }).click();

    await page.getByLabel('block-item-Select-general-Title field').getByTestId('select-single').click();
    await page.getByRole('option', { name: 'singleLineText' }).click();
    await page.getByRole('button', { name: 'singleLineText (Duplicate)' }).click();

    await expect(
      page.getByRole('button', { name: 'singleLineText (Duplicate)' }).locator('.ant-tree-checkbox'),
    ).toHaveClass(/ant-tree-checkbox-checked/);

    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 区块顶部应该显示 Data template 选项
    await expect(page.getByText('Data template:', { exact: true })).toBeVisible();

    // 再次打开，设置的值应该存在
    await clickOption(page, 'Form data templates');
    await expect(page.getByLabel('block-item-Select-general-Title field').getByTestId('select-single')).toHaveText(
      'singleLineText',
    );
    await expect(
      page.getByRole('button', { name: 'singleLineText (Duplicate)' }).locator('.ant-tree-checkbox'),
    ).toHaveClass(/ant-tree-checkbox-checked/);

    // 刷新页面后，设置的值应该还在
    await page.reload();
    await page.getByRole('button', { name: 'Add new' }).click();
    await expect(page.getByText('Data template:', { exact: true })).toBeVisible();

    await clickOption(page, 'Form data templates');
    await expect(page.getByLabel('block-item-Select-general-Title field').getByTestId('select-single')).toHaveText(
      'singleLineText',
    );
    await expect(
      page.getByRole('button', { name: 'singleLineText (Duplicate)' }).locator('.ant-tree-checkbox'),
    ).toHaveClass(/ant-tree-checkbox-checked/);
  });
  test('Convert reference to duplicate & Save as block template', async ({ page, mockPage }) => {
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
    await expect(page.getByRole('menuitem', { name: 'Save as block template' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Convert reference to duplicate' })).not.toBeVisible();

    // 刷新页面
    await page.reload();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel('block-item-CardItem-general-form').hover();
    await page.getByLabel('designer-schema-settings-CardItem-FormV2.Designer-general').hover();
    await expect(page.getByRole('menuitem', { name: 'Save as block template' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Convert reference to duplicate' })).not.toBeVisible();
  });
  test('Delete', async ({ page, mockPage }) => {
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
});

test.describe('SchemaSettings: editing list block', () => {
  test('Edit block title', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithActionsAndFormBlocks).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();
    await page.getByText('Edit', { exact: true }).click();

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
    await page.getByText('Edit', { exact: true }).click();
    await runExpect();
  });
  test('Linkage rules', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithActionsAndFormBlocks).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();
    await page.getByText('Edit', { exact: true }).click();

    // 打开编辑弹窗
    await clickOption(page, 'Linkage rules');
    await page.getByRole('button', { name: 'Add linkage rule' }).click();
    await page.getByText('Add property').click();
    await page.getByTestId('select-linkage-property-field').click();
    await page.getByText('singleLineText', { exact: true }).click();
    await page.getByTestId('select-linkage-action-field').click();
    await page.getByRole('option', { name: 'Visible' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    const runExpect = async () => {
      await expect(page.getByTestId('select-linkage-property-field').getByText('singleLineText')).toBeVisible();
      await expect(page.getByTestId('select-linkage-action-field').getByText('Visible')).toBeVisible();
    };

    // 再次打开，设置的值应该存在
    await clickOption(page, 'Linkage rules');
    await runExpect();

    // 刷新页面后，设置的值应该依然存在
    await page.reload();
    await page.getByText('Edit', { exact: true }).click();
    await clickOption(page, 'Linkage rules');
    await runExpect();
  });
  test('Convert reference to duplicate & Save as block template', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithActionsAndFormBlocks).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();
    await page.getByText('Edit', { exact: true }).click();

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
    await page.getByText('Edit', { exact: true }).click();
    await page.getByLabel('block-item-CardItem-general-form').hover();
    await page.getByLabel('designer-schema-settings-CardItem-FormV2.Designer-general').hover();
    await expect(page.getByRole('menuitem', { name: 'Save as block template' })).not.toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Convert reference to duplicate' })).toBeVisible();

    // Convert reference to duplicate
    await clickOption(page, 'Convert reference to duplicate');
    await expect(page.getByRole('menuitem', { name: 'Save as block template' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Convert reference to duplicate' })).not.toBeVisible();

    // 刷新页面
    await page.reload();
    await page.getByText('Edit', { exact: true }).click();
    await page.getByLabel('block-item-CardItem-general-form').hover();
    await page.getByLabel('designer-schema-settings-CardItem-FormV2.Designer-general').hover();
    await expect(page.getByRole('menuitem', { name: 'Save as block template' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Convert reference to duplicate' })).not.toBeVisible();
  });
  test('Delete', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneTableBlockWithActionsAndFormBlocks).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await page.getByText('Edit', { exact: true }).click();
    await page.getByLabel('block-item-CardItem-general-form').hover();
    await page.getByLabel('designer-schema-settings-CardItem-FormV2.Designer-general').hover();

    // 打开编辑弹窗
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 设置成功后，显示在区块顶部
    await expect(page.getByLabel('block-item-CardItem-general-form')).not.toBeVisible();

    // 刷新页面后，区块依然是被删除状态
    await page.reload();
    await page.getByText('Edit', { exact: true }).click();
    await expect(page.getByLabel('block-item-CardItem-general-form')).not.toBeVisible();
  });
});
