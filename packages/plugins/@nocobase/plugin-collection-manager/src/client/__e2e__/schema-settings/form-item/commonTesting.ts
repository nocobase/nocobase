import { Page, expect, test } from '@nocobase/test/e2e';

export async function testEditFieldTitle(page: Page) {
  await page.getByRole('menuitem', { name: 'Edit field title' }).click();
  await page.getByLabel('block-item-Input-general-').getByRole('textbox').click();
  await page.getByLabel('block-item-Input-general-').getByRole('textbox').fill('testing edit field title');
  await page.getByRole('button', { name: 'OK', exact: true }).click();

  await expect(page.getByText('testing edit field title')).toBeVisible();
}

export async function testDisplayTitle(page: Page, title: string) {
  // 默认情况下是开启状态
  await expect(page.getByRole('menuitem', { name: 'Display title' }).getByRole('switch')).toBeChecked();
  await page.getByRole('menuitem', { name: 'Display title' }).click();
  await expect(page.getByRole('menuitem', { name: 'Display title' }).getByRole('switch')).not.toBeChecked();
  await expect(page.getByText(`${title}:`, { exact: true })).not.toBeVisible();
}

export async function testEditDescription(page: Page) {
  await page.getByRole('menuitem', { name: 'Edit description' }).click();
  await page.getByLabel('block-item-Input.TextArea-').getByRole('textbox').click();
  await page.getByLabel('block-item-Input.TextArea-').getByRole('textbox').fill('testing edit description');
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(page.getByText('testing edit description')).toBeVisible();
}
export async function testRequired(page: Page) {
  // 默认情况下是关闭状态
  await expect(page.getByRole('menuitem', { name: 'Required' }).getByRole('switch')).not.toBeChecked();
  await page.getByRole('menuitem', { name: 'Required' }).click();
  await expect(page.getByRole('menuitem', { name: 'Required' }).getByRole('switch')).toBeChecked();
}

export async function clickDeleteAndOk(page: Page) {
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'OK', exact: true }).click();
}

export const commonTesting = ({
  openDialogAndShowMenu,
  fieldName,
  blockType = 'creating',
  fieldType,
  mode = 'details',
}: {
  openDialogAndShowMenu: ({
    page,
    mockPage,
    mockRecord,
    mockRecords,
    fieldName,
  }: {
    page: Page;
    mockPage: any;
    mockRecord: any;
    mockRecords: any;
    fieldName: string;
  }) => Promise<void>;
  fieldName: string;
  blockType?: 'creating' | 'viewing' | 'editing';
  fieldType?: 'relation' | 'system';
  /**
   * options 模式下，只会测试选项是否正确显示；
   * details 模式下，会测试每个选项的功能是否正常；
   */
  mode?: 'options' | 'details';
}) => {
  if (mode === 'details') {
    test('edit field title', async ({ page, mockPage, mockRecord, mockRecords }) => {
      await openDialogAndShowMenu({ page, mockPage, mockRecord, mockRecords, fieldName });
      await testEditFieldTitle(page);
    });

    test('display title', async ({ page, mockPage, mockRecord, mockRecords }) => {
      await openDialogAndShowMenu({ page, mockPage, mockRecord, mockRecords, fieldName });
      await testDisplayTitle(page, fieldName);
    });

    test('delete', async ({ page, mockPage, mockRecord, mockRecords }) => {
      await openDialogAndShowMenu({ page, mockPage, mockRecord, mockRecords, fieldName });
      await clickDeleteAndOk(page);
      await expect(page.getByText(`${fieldName}:`)).not.toBeVisible();
    });

    if (['creating', 'editing'].includes(blockType)) {
      test('edit description', async ({ page, mockPage, mockRecord, mockRecords }) => {
        await openDialogAndShowMenu({ page, mockPage, mockRecord, mockRecords, fieldName });
        await testEditDescription(page);
      });

      test('required', async ({ page, mockPage, mockRecord, mockRecords }) => {
        await openDialogAndShowMenu({ page, mockPage, mockRecord, mockRecords, fieldName });
        await testRequired(page);
      });
    }

    if (blockType === 'viewing') {
      test('edit tooltip', async ({ page, mockPage, mockRecord, mockRecords }) => {
        await openDialogAndShowMenu({ page, mockPage, mockRecord, mockRecords, fieldName });
        await page.getByRole('menuitem', { name: 'Edit tooltip' }).click();
        await page.getByRole('dialog').getByRole('textbox').click();
        await page.getByRole('dialog').getByRole('textbox').fill('testing edit tooltip');
        await page.getByRole('button', { name: 'OK', exact: true }).click();

        await page.getByRole('img', { name: 'question-circle' }).hover();
        await expect(page.getByText('testing edit tooltip')).toBeVisible();
      });
    }
  }

  if (mode === 'options') {
    test('should display correct options', async ({ page, mockPage, mockRecord, mockRecords }) => {
      await openDialogAndShowMenu({ page, mockPage, mockRecord, mockRecords, fieldName });
      await expect(page.getByRole('menuitem', { name: 'Edit field title' })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Display title' })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
      if (['creating', 'editing'].includes(blockType) && fieldType !== 'system') {
        await expect(page.getByRole('menuitem', { name: 'Edit description' })).toBeVisible();
        await expect(page.getByRole('menuitem', { name: 'Required' })).toBeVisible();
        await expect(page.getByRole('menuitem', { name: 'Pattern' })).toBeVisible();
      }
      if (blockType === 'viewing') {
        await expect(page.getByRole('menuitem', { name: 'Edit tooltip' })).toBeVisible();
        await expect(page.getByRole('menuitem', { name: 'Pattern' })).not.toBeVisible();
      }
      if (
        blockType === 'creating' &&
        !fieldName.startsWith('oneTo') &&
        !['attachment'].includes(fieldName) &&
        !['system'].includes(fieldType)
      ) {
        await expect(page.getByRole('menuitem', { name: 'Set default value' })).toBeVisible();
      }
      if (['editing', 'viewing'].includes(blockType)) {
        await expect(page.getByRole('menuitem', { name: 'Set default value' })).not.toBeVisible();
      }
      if (fieldType === 'relation' && ['creating', 'editing'].includes(blockType)) {
        await expect(page.getByRole('menuitem', { name: 'Set default sorting rules' })).toBeVisible();
      }
    });
  }
};

export async function testDefaultValue({
  page,
  openDialog,
  closeDialog,
  gotoPage,
  showMenu,
  supportVariables,
  constantValue,
  variableValue,
  inputConstantValue,
  expectConstantValue,
  expectVariableValue,
}: {
  page: Page;
  openDialog: () => Promise<void>;
  closeDialog: () => Promise<void>;
  gotoPage: () => Promise<void>;
  showMenu: () => Promise<void>;
  /** 支持的变量列表，如：['Current user', 'Date variables', 'Current form'] */
  supportVariables: string[];
  /** 常量默认值 */
  constantValue?: string | number;
  /** 变量默认值 */
  variableValue?: string[];
  /** 输入常量默认值 */
  inputConstantValue?: () => Promise<void>;
  /** 对常量默认值进行断言 */
  expectConstantValue?: () => Promise<void>;
  /** 对变量默认值进行断言 */
  expectVariableValue?: () => Promise<void>;
}) {
  await gotoPage();
  await openDialog();
  await showMenu();

  if (constantValue || inputConstantValue) {
    // 设置一个常量作为默认值
    await page.getByRole('menuitem', { name: 'Set default value' }).click();
    if (inputConstantValue) {
      await inputConstantValue();
    } else {
      await page.getByLabel('block-item-VariableInput-').getByRole('textbox').click();
      await page.getByLabel('block-item-VariableInput-').getByRole('textbox').fill(String(constantValue));
    }
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 关闭弹窗，然后再次打开后，应该显示刚才设置的默认值
    await closeDialog();
    await openDialog();
    await expectConstantValue();
  }

  if (variableValue) {
    // 设置一个变量作为默认值
    await showMenu();
    await page.getByRole('menuitem', { name: 'Set default value' }).click();
    await page.getByLabel('variable-button').click();
    for (const value of supportVariables) {
      await expect(page.getByRole('menuitemcheckbox', { name: value })).toBeVisible();
    }
    for (const value of variableValue) {
      await page.getByRole('menuitemcheckbox', { name: value }).click();
    }
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await closeDialog();
    await openDialog();
    await expectVariableValue();
  }
}

export async function testPattern({
  page,
  gotoPage,
  openDialog,
  showMenu,
  expectEditable,
  expectReadonly,
  expectEasyReading,
}: {
  page: Page;
  gotoPage: () => Promise<void>;
  openDialog: () => Promise<void>;
  showMenu: () => Promise<void>;
  /** 断言选项为 Editable 的情况 */
  expectEditable: () => Promise<void>;
  /** 断言选项为 Readonly 的情况 */
  expectReadonly: () => Promise<void>;
  /** 断言选项为 Easy-reading 的情况 */
  expectEasyReading: () => Promise<void>;
}) {
  await gotoPage();
  await openDialog();

  // 默认情况下，显示的是 Editable
  await expectEditable();
  await showMenu();
  await expect(page.getByText('PatternEditable')).toBeVisible();

  // 更改为 Readonly
  await page.getByRole('menuitem', { name: 'Pattern' }).click();
  await page.getByRole('option', { name: 'Readonly' }).click();
  await expectReadonly();

  // 更改为 Easy-reading
  await showMenu();
  await expect(page.getByText('PatternReadonly')).toBeVisible();
  await page.getByRole('menuitem', { name: 'Pattern' }).click();
  await page.getByRole('option', { name: 'Easy-reading' }).click();
  await expectEasyReading();

  await showMenu();
  await expect(page.getByText('PatternEasy-reading')).toBeVisible();
}

export async function testSetValidationRules({
  page,
  gotoPage,
  openDialog,
  showMenu,
}: {
  page: Page;
  gotoPage: () => Promise<void>;
  openDialog: () => Promise<void>;
  showMenu: () => Promise<void>;
}) {
  await gotoPage();
  await openDialog();
  await showMenu();

  await page.getByRole('menuitem', { name: 'Set validation rules' }).click();
  await expect(page.getByRole('dialog').getByText('Set validation rules')).toBeVisible();

  // TODO: 更详细的测试
}
