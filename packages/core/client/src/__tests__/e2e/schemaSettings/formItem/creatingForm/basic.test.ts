import { Page, expect, oneTableBlockWithAddNewAndViewAndEditAndBasicFields, test } from '@nocobase/test/client';
import { commonTesting } from '../commonTesting';

test.describe('color', () => {
  const showMenu = async (page: Page, mockPage) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel('block-item-CollectionField-general-form-general.color-color').hover();
    await page.getByLabel('designer-schema-settings-CollectionField-FormItem.Designer-general-general.color').hover();
  };

  commonTesting(showMenu, 'color');

  test('pattern', async ({ page, mockPage }) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Add new' }).click();

    // 默认情况下显示颜色选择框
    await page.getByLabel('color-picker-normal').hover();
    await expect(page.getByRole('button', { name: 'right Recommended', exact: true })).toBeVisible();

    await page.getByLabel('block-item-CollectionField-general-form-general.color-color').hover();
    await page.getByLabel('designer-schema-settings-CollectionField-FormItem.Designer-general-general.color').hover();
    await page.getByRole('menuitem', { name: 'Pattern' }).click();
    await page.getByRole('option', { name: 'Readonly' }).click();

    // 只读模式下，不会显示颜色弹窗
    await page.getByLabel('color-picker-normal').hover();
    await expect(page.getByRole('button', { name: 'right Recommended', exact: true })).not.toBeVisible();
    await page.getByLabel('designer-schema-settings-CollectionField-FormItem.Designer-general-general.color').hover();

    await page.getByRole('menuitem', { name: 'Pattern' }).click();
    await page.getByRole('option', { name: 'Easy-reading' }).click();
    await expect(page.getByLabel('color-picker-read-pretty')).toBeVisible();
  });

  test('set default value', async ({ page, mockPage }) => {
    await showMenu(page, mockPage);
    // 简单测试下是否有选项，值的话不太好测
    await expect(page.getByRole('menuitem', { name: 'Set default value' })).toBeVisible();
  });
});

test.describe('email', () => {
  const gotoPage = async (mockPage) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await nocoPage.goto();
  };

  const openDialog = async (page: Page) => {
    await page.getByRole('button', { name: 'Add new' }).click();
  };

  const showMenu = async (page: Page) => {
    await page.getByLabel('block-item-CollectionField-general-form-general.email-email').hover();
    await page.getByLabel('designer-schema-settings-CollectionField-FormItem.Designer-general-general.email').hover();
  };

  const openDialogAndShowMenu = async (page: Page, mockPage) => {
    await gotoPage(mockPage);
    await openDialog(page);
    await showMenu(page);
  };

  commonTesting(openDialogAndShowMenu, 'email');

  test('set default value', async ({ page, mockPage }) => {
    await openDialogAndShowMenu(page, mockPage);

    // 设置一个常量作为默认值
    await page.getByRole('menuitem', { name: 'Set default value' }).click();
    await page.getByLabel('block-item-VariableInput-').getByRole('textbox').click();
    await page.getByLabel('block-item-VariableInput-').getByRole('textbox').fill('test@nocobase.com');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 关闭弹窗，然后再次打开后，应该显示刚才设置的默认值
    await page.getByLabel('drawer-Action.Container-general-Add record-mask').click();
    await openDialog(page);
    await expect(
      page.getByLabel('block-item-CollectionField-general-form-general.email-email').getByRole('textbox'),
    ).toHaveValue('test@nocobase.com');

    // 设置一个变量作为默认值
    await showMenu(page);
    await page.getByRole('menuitem', { name: 'Set default value' }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Current user' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Email' }).click();
    await page.getByRole('button', { name: 'OK' }).click();

    // 关闭弹窗，然后再次打开后，应该显示当前用户的邮箱：admin@nocobase.com
    await page.getByLabel('drawer-Action.Container-general-Add record-mask').click();
    await openDialog(page);
    await expect(
      page.getByLabel('block-item-CollectionField-general-form-general.email-email').getByRole('textbox'),
    ).toHaveValue('admin@nocobase.com');
  });

  test('pattern', async ({ page, mockPage }) => {
    await gotoPage(mockPage);
    await openDialog(page);

    // 填充上一个值，方便后面断言
    await page.getByLabel('block-item-CollectionField-general-form-general.email-email').getByRole('textbox').click();
    await page
      .getByLabel('block-item-CollectionField-general-form-general.email-email')
      .getByRole('textbox')
      .fill('admin@nocobase.com');

    // 默认情况下，显示的是 Editable
    await showMenu(page);
    await expect(page.getByText('PatternEditable')).toBeVisible();

    // 更改为 Readonly
    await page.getByRole('menuitem', { name: 'Pattern' }).click();
    await page.getByRole('option', { name: 'Readonly' }).click();
    // 输入框应该被禁用
    await expect(
      page.getByLabel('block-item-CollectionField-general-form-general.email-email').getByRole('textbox'),
    ).toBeDisabled();

    // 更改为 Easy-reading
    await showMenu(page);
    await page.getByRole('menuitem', { name: 'Pattern' }).click();
    await page.getByRole('option', { name: 'Easy-reading' }).click();
    await expect(
      page.getByLabel('block-item-CollectionField-general-form-general.email-email').getByRole('textbox'),
    ).not.toBeVisible();
    await expect(page.getByLabel('block-item-CollectionField-general-form-general.email-email')).toHaveText(
      'email:admin@nocobase.com',
    );
  });
});

test.describe('icon', () => {
  const showMenu = async (page: Page, mockPage) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel('block-item-CollectionField-general-form-general.icon-icon').hover();
    await page.getByLabel('designer-schema-settings-CollectionField-FormItem.Designer-general-general.icon').hover();
  };

  commonTesting(showMenu, 'icon');
});

test.describe('single line text', () => {
  const showMenu = async (page: Page, mockPage) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText').hover();
    await page
      .getByLabel('designer-schema-settings-CollectionField-FormItem.Designer-general-general.singleLineText')
      .hover();
  };

  commonTesting(showMenu, 'singleLineText');
});

test.describe('integer', () => {
  const showMenu = async (page: Page, mockPage) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel('block-item-CollectionField-general-form-general.integer-integer').hover();
    await page.getByLabel('designer-schema-settings-CollectionField-FormItem.Designer-general-general.integer').hover();
  };

  commonTesting(showMenu, 'integer');
});

test.describe('number', () => {
  const showMenu = async (page: Page, mockPage) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel('block-item-CollectionField-general-form-general.number-number').hover();
    await page.getByLabel('designer-schema-settings-CollectionField-FormItem.Designer-general-general.number').hover();
  };

  commonTesting(showMenu, 'number');
});

test.describe('password', () => {
  const showMenu = async (page: Page, mockPage) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel('block-item-CollectionField-general-form-general.password-password').hover();
    await page
      .getByLabel('designer-schema-settings-CollectionField-FormItem.Designer-general-general.password')
      .hover();
  };

  commonTesting(showMenu, 'password');
});

test.describe('percent', () => {
  const showMenu = async (page: Page, mockPage) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel('block-item-CollectionField-general-form-general.percent-percent').hover();
    await page.getByLabel('designer-schema-settings-CollectionField-FormItem.Designer-general-general.percent').hover();
  };

  commonTesting(showMenu, 'percent');
});

test.describe('phone', () => {
  const showMenu = async (page: Page, mockPage) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel('block-item-CollectionField-general-form-general.phone-phone').hover();
    await page.getByLabel('designer-schema-settings-CollectionField-FormItem.Designer-general-general.phone').hover();
  };

  commonTesting(showMenu, 'phone');
});

test.describe('long text', () => {
  const showMenu = async (page: Page, mockPage) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel('block-item-CollectionField-general-form-general.longText-longText').hover();
    await page
      .getByLabel('designer-schema-settings-CollectionField-FormItem.Designer-general-general.longText')
      .hover();
  };

  commonTesting(showMenu, 'longText');
});

test.describe('URL', () => {
  const showMenu = async (page: Page, mockPage) => {
    const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
    await nocoPage.goto();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel('block-item-CollectionField-general-form-general.url-url').hover();
    await page.getByLabel('designer-schema-settings-CollectionField-FormItem.Designer-general-general.url').hover();
  };

  commonTesting(showMenu, 'url');
});
