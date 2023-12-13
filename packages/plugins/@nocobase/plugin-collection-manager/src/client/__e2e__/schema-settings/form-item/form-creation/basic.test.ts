import { expect, oneTableBlockWithAddNewAndViewAndEditAndBasicFields, test } from '@nocobase/test/client';
import { commonTesting, testDefaultValue, testPattern, testSetValidationRules } from '../commonTesting';

test.describe('color', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'color' });

  test('set default value', async ({ page, mockPage, mockRecord }) => {
    await openDialogAndShowMenu({ page, mockPage, mockRecord, fieldName: 'color' });
    // 简单测试下是否有选项，值的话无法选中，暂时测不了
    await expect(page.getByRole('menuitem', { name: 'Set default value' })).toBeVisible();
  });

  test('pattern', async ({ page, mockPage }) => {
    await testPattern({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'color'),
      expectEditable: async () => {
        // 默认情况下显示颜色选择框
        await page.getByLabel('color-picker-normal').hover();
        await expect(page.getByRole('button', { name: 'right Recommended', exact: true })).toBeVisible();
      },
      expectReadonly: async () => {
        // 只读模式下，不会显示颜色弹窗
        await page.getByLabel('color-picker-normal').hover();
        await expect(page.getByRole('button', { name: 'right Recommended', exact: true })).not.toBeVisible();
      },
      expectEasyReading: async () => {
        await expect(page.getByLabel('color-picker-read-pretty')).toBeVisible();
      },
    });
  });
});

test.describe('email', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'email', mode: 'options' });

  test('set default value', async ({ page, mockPage }) => {
    await testDefaultValue({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      closeDialog: () => page.getByLabel('drawer-Action.Container-general-Add record-mask').click(),
      showMenu: () => showMenu(page, 'email'),
      supportVariables: ['Constant', 'Current user', 'Date variables', 'Current form'],
      constantValue: 'test@nocobase.com',
      variableValue: ['Current user', 'Email'],
      expectConstantValue: () =>
        expect(
          page.getByLabel('block-item-CollectionField-general-form-general.email-email').getByRole('textbox'),
        ).toHaveValue('test@nocobase.com'),
      expectVariableValue: () =>
        expect(
          page.getByLabel('block-item-CollectionField-general-form-general.email-email').getByRole('textbox'),
        ).toHaveValue('admin@nocobase.com'),
    });
  });

  test('pattern', async ({ page, mockPage }) => {
    await testPattern({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'email'),
      expectEditable: async () => {
        // 填充一个值，方便后面断言
        await page
          .getByLabel('block-item-CollectionField-general-form-general.email-email')
          .getByRole('textbox')
          .click();
        await page
          .getByLabel('block-item-CollectionField-general-form-general.email-email')
          .getByRole('textbox')
          .fill('admin@nocobase.com');
      },
      expectReadonly: async () => {
        // 输入框应该被禁用
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.email-email').getByRole('textbox'),
        ).toBeDisabled();
      },
      expectEasyReading: async () => {
        // 输入框应该消失，直接显示值
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.email-email').getByRole('textbox'),
        ).not.toBeVisible();
        await expect(page.getByLabel('block-item-CollectionField-general-form-general.email-email')).toHaveText(
          'email:admin@nocobase.com',
        );
      },
    });
  });
});

test.describe('icon', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'icon', mode: 'options' });

  test('set default value', async ({ page, mockPage }) => {
    await testDefaultValue({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      closeDialog: () => page.getByLabel('drawer-Action.Container-general-Add record-mask').click(),
      showMenu: () => showMenu(page, 'icon'),
      supportVariables: ['Constant', 'Current user', 'Date variables', 'Current form'],
      inputConstantValue: async () => {
        await page.getByLabel('block-item-VariableInput-').getByRole('button', { name: 'Select icon' }).click();
        await page.getByLabel('account-book').locator('svg').click();
      },
      expectConstantValue: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.icon-icon')
            .getByRole('button', { name: 'account-book' }),
        ).toBeVisible();
      },
    });
  });

  test('pattern', async ({ page, mockPage }) => {
    await testPattern({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'icon'),
      expectEditable: async () => {
        // 默认情况下可以编辑图标
        await page.getByRole('button', { name: 'Select icon' }).click();
        await page.getByLabel('account-book').locator('svg').click();
      },
      expectReadonly: async () => {
        // 只读模式下，选择图标按钮会被禁用
        await expect(page.getByRole('button', { name: 'account-book' })).toBeDisabled();
      },
      expectEasyReading: async () => {
        // 按钮会消失，只剩下图标
        await expect(page.getByRole('button', { name: 'account-book' })).not.toBeVisible();
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.icon-icon').getByLabel('account-book'),
        ).toBeVisible();
      },
    });
  });
});

test.describe('single line text', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'singleLineText', mode: 'options' });

  test('set default value', async ({ page, mockPage }) => {
    await testDefaultValue({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      closeDialog: () => page.getByLabel('drawer-Action.Container-general-Add record-mask').click(),
      showMenu: () => showMenu(page, 'singleLineText'),
      supportVariables: ['Constant', 'Current user', 'Date variables', 'Current form'],
      constantValue: 'test single line text',
      variableValue: ['Current user', 'Email'], // 值为 admin@nocobase.com
      expectConstantValue: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
            .getByRole('textbox'),
        ).toHaveValue('test single line text');
      },
      expectVariableValue: async () => {
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
            .getByRole('textbox'),
        ).toHaveValue('admin@nocobase.com');
      },
    });
  });

  test('pattern', async ({ page, mockPage }) => {
    await testPattern({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'singleLineText'),
      expectEditable: async () => {
        // 默认情况下可以编辑
        await page
          .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
          .getByRole('textbox')
          .click();
        await page
          .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
          .getByRole('textbox')
          .fill('test single line text');
      },
      expectReadonly: async () => {
        // 只读模式下，输入框会被禁用
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
            .getByRole('textbox'),
        ).toBeDisabled();
      },
      expectEasyReading: async () => {
        // 输入框会消失，只剩下值
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
            .getByRole('textbox'),
        ).not.toBeVisible();
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText'),
        ).toHaveText('singleLineText:test single line text');
      },
    });
  });

  test('Set validation rules', async ({ page, mockPage }) => {
    await testSetValidationRules({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'singleLineText'),
    });
  });
});

test.describe('integer', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'integer', mode: 'options' });

  test('set default value', async ({ page, mockPage }) => {
    await testDefaultValue({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      closeDialog: () => page.getByLabel('drawer-Action.Container-general-Add record-mask').click(),
      showMenu: () => showMenu(page, 'integer'),
      supportVariables: ['Constant', 'Current user', 'Date variables', 'Current form'],
      variableValue: ['Current user', 'ID'], // 值为 1
      inputConstantValue: async () => {
        await page.getByLabel('block-item-VariableInput-').getByRole('spinbutton').click();
        await page.getByLabel('block-item-VariableInput-').getByRole('spinbutton').fill('112233');
      },
      expectConstantValue: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.integer-integer').getByRole('spinbutton'),
        ).toHaveValue('112233');
      },
      expectVariableValue: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.integer-integer').getByRole('spinbutton'),
        ).toHaveValue('1');
      },
    });
  });

  test('pattern', async ({ page, mockPage }) => {
    await testPattern({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'integer'),
      expectEditable: async () => {
        // 默认情况下可以编辑
        await page
          .getByLabel('block-item-CollectionField-general-form-general.integer-integer')
          .getByRole('spinbutton')
          .click();
        await page
          .getByLabel('block-item-CollectionField-general-form-general.integer-integer')
          .getByRole('spinbutton')
          .fill('112233');
      },
      expectReadonly: async () => {
        // 只读模式下，输入框会被禁用
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.integer-integer').getByRole('spinbutton'),
        ).toBeDisabled();
      },
      expectEasyReading: async () => {
        // 输入框会消失，只剩下值
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.integer-integer').getByRole('spinbutton'),
        ).not.toBeVisible();
        await expect(page.getByLabel('block-item-CollectionField-general-form-general.integer-integer')).toHaveText(
          'integer:112233',
        );
      },
    });
  });

  test('set validation rules', async ({ page, mockPage }) => {
    await testSetValidationRules({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'integer'),
    });
  });
});

test.describe('number', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'number', mode: 'options' });

  test('set default value', async ({ page, mockPage }) => {
    await testDefaultValue({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      closeDialog: () => page.getByLabel('drawer-Action.Container-general-Add record-mask').click(),
      showMenu: () => showMenu(page, 'number'),
      supportVariables: ['Constant', 'Current user', 'Date variables', 'Current form'],
      inputConstantValue: async () => {
        await page.getByLabel('block-item-VariableInput-').getByRole('spinbutton').click();
        await page.getByLabel('block-item-VariableInput-').getByRole('spinbutton').fill('11.22');
      },
      variableValue: ['Current user', 'ID'], // 值为 1
      expectConstantValue: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.number-number').getByRole('spinbutton'),
        ).toHaveValue('11.22');
      },
      expectVariableValue: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.number-number').getByRole('spinbutton'),
        ).toHaveValue('1');
      },
    });
  });

  test('pattern', async ({ page, mockPage }) => {
    // TODO: number 类型的字段，当输入了小数，然后把 Pattern 切换成 Easy-reading 模式，小数不应该被去掉；
    test.fail();
    await testPattern({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'number'),
      expectEditable: async () => {
        // 默认情况下可以编辑
        await page
          .getByLabel('block-item-CollectionField-general-form-general.number-number')
          .getByRole('spinbutton')
          .click();
        await page
          .getByLabel('block-item-CollectionField-general-form-general.number-number')
          .getByRole('spinbutton')
          .fill('11.22');
      },
      expectReadonly: async () => {
        // 只读模式下，输入框会被禁用
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.number-number').getByRole('spinbutton'),
        ).toBeDisabled();
      },
      expectEasyReading: async () => {
        // 输入框会消失，只剩下值
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.number-number').getByRole('spinbutton'),
        ).not.toBeVisible();
        await expect(page.getByLabel('block-item-CollectionField-general-form-general.number-number')).toHaveText(
          'number:11.22',
        );
      },
    });
  });

  test('set validation rules', async ({ page, mockPage }) => {
    await testSetValidationRules({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'number'),
    });
  });
});

test.describe('password', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'password', mode: 'options' });

  test('set default value', async ({ page, mockPage }) => {
    await testDefaultValue({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      closeDialog: () => page.getByLabel('drawer-Action.Container-general-Add record-mask').click(),
      showMenu: () => showMenu(page, 'password'),
      supportVariables: ['Constant', 'Current user', 'Date variables', 'Current form'],
      constantValue: 'test112233password',
      variableValue: ['Current user', 'Email'], // 值为 admin@nocobase.com
      expectConstantValue: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.password-password').getByRole('textbox'),
        ).toHaveValue('test112233password');
      },
      expectVariableValue: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.password-password').getByRole('textbox'),
        ).toHaveValue('admin@nocobase.com');
      },
    });
  });

  test('pattern', async ({ page, mockPage }) => {
    await testPattern({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'password'),
      expectEditable: async () => {
        // 默认情况下可以编辑
        await page
          .getByLabel('block-item-CollectionField-general-form-general.password-password')
          .getByRole('textbox')
          .click();
        await page
          .getByLabel('block-item-CollectionField-general-form-general.password-password')
          .getByRole('textbox')
          .fill('test112233password');
      },
      expectReadonly: async () => {
        // 只读模式下，输入框会被禁用
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.password-password').getByRole('textbox'),
        ).toBeDisabled();
      },
      expectEasyReading: async () => {
        // 输入框会消失，只剩下值
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.password-password').getByRole('textbox'),
        ).not.toBeVisible();
        await expect(page.getByLabel('block-item-CollectionField-general-form-general.password-password')).toHaveText(
          'password:********',
        );
      },
    });
  });

  test('set validation rules', async ({ page, mockPage }) => {
    await testSetValidationRules({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'password'),
    });
  });
});

test.describe('percent', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'percent', mode: 'options' });

  test('set default value', async ({ page, mockPage }) => {
    await testDefaultValue({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      closeDialog: () => page.getByLabel('drawer-Action.Container-general-Add record-mask').click(),
      showMenu: () => showMenu(page, 'percent'),
      supportVariables: ['Constant', 'Current user', 'Date variables', 'Current form'],
      inputConstantValue: async () => {
        await page.getByLabel('block-item-VariableInput-').getByRole('spinbutton').click();
        await page.getByLabel('block-item-VariableInput-').getByRole('spinbutton').fill('11.22');
      },
      variableValue: ['Current user', 'ID'], // 值为 1
      expectConstantValue: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.percent-percent').getByRole('spinbutton'),
        ).toHaveValue('11.22');
      },
      expectVariableValue: async () => {
        // 数字 1 转换为百分比后为 100%
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.percent-percent').getByRole('spinbutton'),
        ).toHaveValue('100');
      },
    });
  });

  test('pattern', async ({ page, mockPage }) => {
    // TODO: percent 类型的字段，当输入了小数，然后把 Pattern 切换成 Easy-reading 模式，小数点不应该被去掉；
    test.fail();
    await testPattern({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'percent'),
      expectEditable: async () => {
        // 默认情况下可以编辑
        await page
          .getByLabel('block-item-CollectionField-general-form-general.percent-percent')
          .getByRole('spinbutton')
          .click();
        await page
          .getByLabel('block-item-CollectionField-general-form-general.percent-percent')
          .getByRole('spinbutton')
          .fill('11.22');
      },
      expectReadonly: async () => {
        // 只读模式下，输入框会被禁用
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.percent-percent').getByRole('spinbutton'),
        ).toBeDisabled();
      },
      expectEasyReading: async () => {
        // 输入框会消失，只剩下值
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.percent-percent').getByRole('spinbutton'),
        ).not.toBeVisible();
        await expect(page.getByLabel('block-item-CollectionField-general-form-general.percent-percent')).toHaveText(
          'percent:11.22%',
        );
      },
    });
  });

  test('set validation rules', async ({ page, mockPage }) => {
    await testSetValidationRules({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'percent'),
    });
  });
});

test.describe('phone', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'phone', mode: 'options' });

  test('set default value', async ({ page, mockPage }) => {
    await testDefaultValue({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      closeDialog: () => page.getByLabel('drawer-Action.Container-general-Add record-mask').click(),
      showMenu: () => showMenu(page, 'phone'),
      supportVariables: ['Constant', 'Current user', 'Date variables', 'Current form'],
      constantValue: '17777777777',
      variableValue: ['Current user', 'ID'], // 值为 1
      expectConstantValue: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.phone-phone').getByRole('textbox'),
        ).toHaveValue('17777777777');
      },
      expectVariableValue: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.phone-phone').getByRole('textbox'),
        ).toHaveValue('1');
      },
    });
  });

  test('pattern', async ({ page, mockPage }) => {
    await testPattern({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'phone'),
      expectEditable: async () => {
        // 默认情况下可以编辑
        await page
          .getByLabel('block-item-CollectionField-general-form-general.phone-phone')
          .getByRole('textbox')
          .click();
        await page
          .getByLabel('block-item-CollectionField-general-form-general.phone-phone')
          .getByRole('textbox')
          .fill('17777777777');
      },
      expectReadonly: async () => {
        // 只读模式下，输入框会被禁用
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.phone-phone').getByRole('textbox'),
        ).toBeDisabled();
      },
      expectEasyReading: async () => {
        // 输入框会消失，只剩下值
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.phone-phone').getByRole('textbox'),
        ).not.toBeVisible();
        await expect(page.getByLabel('block-item-CollectionField-general-form-general.phone-phone')).toHaveText(
          'phone:17777777777',
        );
      },
    });
  });
});

test.describe('long text', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'longText', mode: 'options' });

  test('set default value', async ({ page, mockPage }) => {
    await testDefaultValue({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      closeDialog: async () => {
        await page.getByLabel('drawer-Action.Container-general-Add record-mask').click();
      },
      showMenu: () => showMenu(page, 'longText'),
      supportVariables: ['Constant', 'Current user', 'Date variables', 'Current form'],
      constantValue: 'test long text',
      variableValue: ['Current user', 'Email'], // 值为 admin@nocobase.com
      expectConstantValue: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.longText-longText').getByRole('textbox'),
        ).toHaveValue('test long text');
      },
      expectVariableValue: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.longText-longText').getByRole('textbox'),
        ).toHaveValue('admin@nocobase.com');
      },
    });
  });

  test('pattern', async ({ page, mockPage }) => {
    await testPattern({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'longText'),
      expectEditable: async () => {
        // 默认情况下可以编辑
        await page
          .getByLabel('block-item-CollectionField-general-form-general.longText-longText')
          .getByRole('textbox')
          .click();
        await page
          .getByLabel('block-item-CollectionField-general-form-general.longText-longText')
          .getByRole('textbox')
          .fill('test long text');
      },
      expectReadonly: async () => {
        // 只读模式下，输入框会被禁用
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.longText-longText').getByRole('textbox'),
        ).toBeDisabled();
      },
      expectEasyReading: async () => {
        // 输入框会消失，只剩下值
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.longText-longText').getByRole('textbox'),
        ).not.toBeVisible();
        await expect(page.getByLabel('block-item-CollectionField-general-form-general.longText-longText')).toHaveText(
          'longText:test long text',
        );
      },
    });
  });

  test('set validation rules', async ({ page, mockPage }) => {
    await testSetValidationRules({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'longText'),
    });
  });
});

test.describe('URL', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'url', mode: 'options' });

  test('set default value', async ({ page, mockPage }) => {
    await testDefaultValue({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      closeDialog: async () => {
        await page.getByLabel('drawer-Action.Container-general-Add record-mask').click();
      },
      showMenu: () => showMenu(page, 'url'),
      supportVariables: ['Constant', 'Current user', 'Date variables', 'Current form'],
      constantValue: 'https://nocobase.com',
      variableValue: ['Current user', 'Email'], // 值为 admin@nocobase.com
      expectConstantValue: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.url-url').getByRole('textbox'),
        ).toHaveValue('https://nocobase.com');
      },
      expectVariableValue: async () => {
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.url-url').getByRole('textbox'),
        ).toHaveValue('admin@nocobase.com');
      },
    });
  });

  test('pattern', async ({ page, mockPage }) => {
    await testPattern({
      page,
      gotoPage: () => gotoPage(mockPage),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'url'),
      expectEditable: async () => {
        // 默认情况下可以编辑
        await page.getByLabel('block-item-CollectionField-general-form-general.url-url').getByRole('textbox').click();
        await page
          .getByLabel('block-item-CollectionField-general-form-general.url-url')
          .getByRole('textbox')
          .fill('https://nocobase.com');
      },
      expectReadonly: async () => {
        // 只读模式下，输入框会被禁用
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.url-url').getByRole('textbox'),
        ).toBeDisabled();
      },
      expectEasyReading: async () => {
        // 输入框会消失，只剩下值
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.url-url').getByRole('textbox'),
        ).not.toBeVisible();
        await expect(page.getByLabel('block-item-CollectionField-general-form-general.url-url')).toHaveText(
          'url:https://nocobase.com',
        );
      },
    });
  });
});

const gotoPage = async (mockPage) => {
  const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
  await nocoPage.goto();
};

const openDialog = async (page: Page) => {
  await page.getByRole('button', { name: 'Add new' }).click();
};

const showMenu = async (page: Page, fieldName: string) => {
  await page.getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`).hover();
  await page
    .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`)
    .hover();
};

async function openDialogAndShowMenu({
  page,
  mockPage,
  mockRecord,
  fieldName,
}: {
  page: Page;
  mockPage;
  mockRecord;
  fieldName: string;
}) {
  await gotoPage(mockPage);
  await openDialog(page);
  await showMenu(page, fieldName);
}
