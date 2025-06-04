/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Page, expect } from '@nocobase/test/e2e';

export async function showSettingsMenu(page: Page, fieldName: string) {
  await page.getByRole('columnheader', { name: fieldName, exact: true }).hover();
  await page.getByLabel('designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-general').hover();
}

export async function createColumnItem(page: Page, fieldName: string) {
  await page.getByLabel('schema-initializer-TableV2-table:configureColumns-general').hover();
  await page.getByRole('menuitem', { name: fieldName, exact: true }).click();
  await page.mouse.move(300, 0);
}

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
  await expect(page.getByText('testing edit description').last()).toBeVisible();
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

export async function testDefaultValue({
  page,
  openDialog,
  closeDialog,
  gotoPage,
  showMenu,
  supportedVariables,
  unsupportedVariables,
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
  supportedVariables: string[];
  /** 不应该显示出来的变量列表 */
  unsupportedVariables?: string[];
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

  // 设置一个常量作为默认值
  if (constantValue || inputConstantValue) {
    await showMenu();
    await page.getByRole('menuitem', { name: 'Set default value' }).click();
    if (inputConstantValue) {
      await inputConstantValue();
    } else {
      await page.getByLabel('block-item-VariableInput-').getByRole('textbox').click();
      await page.getByLabel('block-item-VariableInput-').getByRole('textbox').fill(String(constantValue));
    }

    if (supportedVariables || unsupportedVariables) {
      await page.getByLabel('variable-button').click();
      await testSupportedAndUnsupportedVariables(page, supportedVariables, unsupportedVariables);
      // 关闭变量列表
      await page.getByLabel('variable-button').click();
    }

    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 关闭弹窗，然后再次打开后，应该显示刚才设置的默认值
    await closeDialog();
    await openDialog();
    await expectConstantValue?.();
  }

  // 设置一个变量作为默认值
  if (variableValue) {
    await showMenu();
    await page.getByRole('menuitem', { name: 'Set default value' }).click();
    await page.getByLabel('variable-button').click();
    await testSupportedAndUnsupportedVariables(page, supportedVariables, unsupportedVariables);
    for (const value of variableValue) {
      if (value === 'ID') {
        await page.getByRole('menuitemcheckbox', { name: value, exact: true }).click();
      } else {
        await page.getByRole('menuitemcheckbox', { name: value }).click();
      }
    }
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    await closeDialog();
    await openDialog();
    await expectVariableValue?.();
  }
}

async function testSupportedAndUnsupportedVariables(
  page: Page,
  supportedVariables: string[],
  unsupportedVariables: string[],
) {
  for (const value of supportedVariables) {
    await expect(page.getByRole('menuitemcheckbox', { name: value })).toBeVisible();
  }
  for (const value of unsupportedVariables || []) {
    await expect(page.getByRole('menuitemcheckbox', { name: value })).not.toBeVisible();
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
  await page.waitForTimeout(100);
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

export class CollectionManagerPage {
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('admin/settings/data-source-manager/main/collections');
  }

  async createCollection(
    template:
      | 'General collection'
      | 'Calendar collection'
      | 'Tree collection'
      | 'Expression collection'
      | 'SQL collection'
      | 'File collection'
      | 'Connect to database view',
  ) {
    await this.page.getByRole('button', { name: 'Create collection' }).hover();
    await this.page.getByRole('menuitem', { name: template }).click();
    return new CollectionSettings(this.page);
  }

  /**
   * 对应页面中每行数据表的 Configure fields 按钮
   * @param collectionName 数据表字段标识
   * @returns
   */
  async configureFields(collectionName: string) {
    await this.page
      .getByLabel(`action-Action.Link-Configure fields-collections-${collectionName}`, { exact: true })
      .click();
    return new FieldsSettings(this.page);
  }

  /**
   * 对应页面中每行数据表的 Edit 按钮
   * @param collectionName 数据表字段标识
   * @returns
   */
  async edit(collectionName: string) {
    await this.page.getByLabel(`edit-button-${collectionName}`).click();
    return new CollectionSettings(this.page);
  }

  /**
   * 对应页面中每行数据表的 Delete 按钮
   * @param collectionName 数据表字段标识
   */
  async deleteItem(collectionName: string) {
    await this.page.getByLabel(`delete-button-${collectionName}`).click();
    await this.page.getByLabel('action-Action-Ok-collections-').click();
  }

  async addCategory(name: string, color?: 'Red' | 'Green' | 'Blue') {
    await this.page.getByRole('button', { name: 'Add tab' }).click();
    await this.page.getByLabel('block-item-Input-collections-').getByRole('textbox').fill(name);
    if (color) {
      await this.page.getByLabel('block-item-ColorSelect-').locator('.ant-select-selector').click();
      await this.page.getByRole('option', { name: color, exact: true }).click();
    }
    await this.page.getByLabel('action-Action-Submit-').click();
  }

  async deleteCategory(name: string) {
    await this.page.getByLabel(name).hover();
    await this.page.getByRole('menuitem', { name: 'Delete category' }).click();
    await this.page.getByRole('button', { name: 'OK', exact: true }).click();
  }
}

/**
 * 用来配置 Collection
 */
export class CollectionSettings {
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async change(name: 'Collection display name', value: string);
  async change(name: 'Collection name', value: string);
  async change(name: 'Inherits', value: string[]);
  async change(name: 'Categories', value: string[]);
  async change(name: 'Description', value: string);
  async change(name: 'Primary key, unique identifier, self growth', value: boolean);
  async change(name: 'Store the creation user of each record', value: boolean);
  async change(name: 'Store the last update user of each record', value: boolean);
  async change(name: 'Store the creation time of each record', value: boolean);
  async change(name: 'Store the last update time of each record', value: boolean);
  async change(name: 'Records can be sorted', value: boolean);
  async change(name: 'File storage', value: string);
  async change(name: 'SQL', value: string);
  async change(name: string, value: any) {
    await this[name](value);
  }

  async submit() {
    await this.page.getByLabel('action-Action-Submit-').click();
  }

  private async ['SQL'](value: string) {
    await this.page.getByLabel('block-item-collections-SQL').getByRole('textbox').fill(value);
    await this.page.getByRole('button', { name: 'edit Confirm' }).click();
  }

  private async ['File storage'](value: string) {
    await this.page.getByLabel('block-item-RemoteSelect-collections-File storage').getByTestId('select-single').click();
    await this.page.getByTitle(value).click();
  }

  private async ['Collection display name'](value: string) {
    await this.page.getByLabel('block-item-Input-collections-Collection display name').getByRole('textbox').fill(value);
  }

  private async ['Collection name'](value: string) {
    await this.page.getByLabel('block-item-Input-collections-Collection name').getByRole('textbox').fill(value);
  }

  private async ['Inherits'](value: string[]) {
    // 1. 点击一下打开下拉选项
    await this.page.getByLabel('block-item-Select-collections-Inherits').getByTestId('select-multiple').click();

    // 2. 点击选择
    for (const name of value) {
      await this.page.getByRole('option', { name, exact: true }).click();
    }

    // 3. 关闭下拉选项，以免影响其它操作
    await this.page.getByLabel('block-item-Select-collections-Inherits').getByTestId('select-multiple').click();
  }

  private async ['Categories'](value: string[]) {
    // 1. 点击一下打开下拉选项
    await this.page.getByLabel('block-item-Select-collections-Categories').getByTestId('select-multiple').click();

    // 2. 点击选择
    for (const name of value) {
      await this.page.getByRole('option', { name, exact: true }).click();
    }

    // 3. 关闭下拉选项，以免影响其它操作
    await this.page.getByLabel('block-item-Select-collections-Categories').getByTestId('select-multiple').click();
  }

  private async ['Description'](value: string) {
    await this.page.getByLabel('block-item-Input.TextArea-').getByRole('textbox').fill(value);
  }

  private async ['Primary key, unique identifier, self growth'](value: boolean) {
    await this.page
      .getByRole('row', { name: 'Primary key, unique identifier, self growth' })
      .getByLabel('')
      .setChecked(value);
  }

  private async ['Store the creation user of each record'](value: boolean) {
    await this.page
      .getByRole('row', { name: 'Store the creation user of each record' })
      .getByLabel('')
      .setChecked(value);
  }

  private async ['Store the last update user of each record'](value: boolean) {
    await this.page
      .getByRole('row', { name: 'Store the last update user of each record' })
      .getByLabel('')
      .setChecked(value);
  }

  private async ['Store the creation time of each record'](value: boolean) {
    await this.page
      .getByRole('row', { name: 'Store the creation time of each record' })
      .getByLabel('')
      .setChecked(value);
  }

  private async ['Store the last update time of each record'](value: boolean) {
    await this.page
      .getByRole('row', { name: 'Store the last update time of each record' })
      .getByLabel('')
      .setChecked(value);
  }
}

export type FieldInterface =
  | 'Single line text'
  | 'Long text'
  | 'Phone'
  | 'Email'
  | 'URL'
  | 'Integer'
  | 'Number'
  | 'Percent'
  | 'Password'
  | 'Color'
  | 'Icon'
  | 'Checkbox'
  | 'Single select'
  | 'Multiple select'
  | 'Radio group'
  | 'Checkbox group'
  | 'China region'
  | 'Markdown'
  | 'Rich Text'
  | 'Attachment'
  | 'Datetime (with time zone)'
  | 'Datetime (without time zone)'
  | 'Date'
  | 'Time'
  | 'Unix Timestamp'
  | 'One to one (belongs to)'
  | 'One to one (has one)'
  | 'One to many'
  | 'Many to one'
  | 'Many to many'
  | 'Formula'
  | 'Sequence'
  | 'JSON'
  | 'Collection selector'
  | 'ID'
  | 'Table OID'
  | 'Created at'
  | 'Last updated at'
  | 'Created by'
  | 'Last updated by';

/**
 * 用来配置 Fields
 */
export class FieldsSettings {
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * 对应页面中 Configure fields 弹窗的 Add field 按钮
   * @param fieldInterface
   * @returns
   */
  async addField(fieldInterface: FieldInterface) {
    await this.page.getByRole('button', { name: 'plus Add field' }).hover();
    await this.page.getByRole('menuitem', { name: fieldInterface, exact: true }).click();
    return new FieldSettings(this.page, fieldInterface);
  }

  /**
   * 对应页面中 configure fields 弹窗的 Edit 按钮
   * @param fieldName
   * @param fieldInterface
   * @returns
   */
  async edit(fieldName: string, fieldInterface: FieldInterface) {
    await this.page.getByLabel(`edit-button-${fieldName}`).click();
    return new FieldSettings(this.page, fieldInterface);
  }

  /**
   * 对应页面中 Configure fields 弹窗中每一行的 Delete 按钮
   * @param fieldName
   */
  async deleteItem(fieldName: string) {
    await this.page.getByLabel(`action-CollectionFields-Delete-fields-${fieldName}`).click();
    await this.page.getByRole('button', { name: 'OK', exact: true }).click();
  }
}

/**
 * 用来配置 Field
 */
export class FieldSettings {
  page: Page;
  fieldType: FieldInterface;

  constructor(page: Page, fieldType: FieldInterface) {
    this.page = page;
    this.fieldType = fieldType;
  }

  async change(name: 'Field display name', value: string);
  async change(name: 'Field name', value: string);
  async change(name: 'Default value', value: string);
  async change(name: 'Description', value: string);
  async change(name: 'Unique', value: boolean);
  async change(name: 'Precision', value: string);
  async change(name: 'Options', value: { label: string; value: string; color?: 'Red' | 'Green' | 'Blue' }[]);
  async change(name: 'Select level', value: 'Province' | 'City' | 'Area' | 'Street' | 'Village');
  async change(name: 'Must select to the last level', value: boolean);
  async change(name: 'MIME type', value: string);
  async change(name: 'Allow uploading multiple files', value: boolean);
  async change(name: 'Storage', value: string);
  async change(name: 'Date format', value: 'Year/Month/Day' | 'Year-Month-Day' | 'Day/Month/Year');
  async change(name: 'Show time', value: boolean);
  async change(name: 'GMT', value: boolean);
  async change(name: 'Time format', value: '12 hour' | '24 hour');
  async change(name: 'Target collection', value: string);
  async change(name: 'Target key', value: string);
  async change(name: 'Foreign key', value: string);
  async change(name: 'ON DELETE', value: string);
  async change(name: 'Create inverse field in the target collection', value: boolean);
  async change(name: 'Through collection', value: string);
  async change(name: 'Foreign key 1', value: string);
  async change(name: 'Foreign key 2', value: string);
  async change(name: 'Storage type', value: string);
  async change(name: 'Calculation engine', value: 'Math.js' | 'Formula.js');
  async change(name: 'Expression', value: string);
  async change(name: string, value: any) {
    await this[name](value);
  }

  async submit() {
    await this.page.getByLabel('action-Action-Submit-fields-').click();
  }

  private async ['Field display name'](value: string) {
    await this.page.getByLabel('block-item-Input-fields-Field display name').getByRole('textbox').fill(value);
  }

  private async ['Field name'](value: string) {
    await this.page.getByLabel('block-item-Input-fields-Field name').getByRole('textbox').fill(value);
  }

  private async ['Target collection'](value: string) {
    await this.page.getByLabel('block-item-Select-fields-Target collection').getByTestId('select-single').click();
    await this.page.getByRole('option', { name: value }).click();
  }
  private async ['Target key'](value: string) {
    await this.page.getByLabel('block-item-TargetKey-fields').locator('.ant-select-selector').click();
    await this.page.getByRole('option', { name: value }).click();
  }
  private async ['Expression'](value: string) {
    await this.page.getByLabel('block-item-Formula.Expression').getByLabel('textbox').fill(value);
  }
}
