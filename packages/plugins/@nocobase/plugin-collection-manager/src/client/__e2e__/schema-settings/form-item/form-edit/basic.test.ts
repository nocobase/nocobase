import { Page, expect, oneTableBlockWithAddNewAndViewAndEditAndBasicFields, test } from '@nocobase/test/e2e';
import { commonTesting, testPattern, testSetValidationRules } from '../commonTesting';

test.describe('color', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'color', blockType: 'editing' });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    let record = null;
    await testPattern({
      page,
      gotoPage: async () => {
        record = await gotoPage(mockPage, mockRecord);
      },
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
  commonTesting({ openDialogAndShowMenu, fieldName: 'email', blockType: 'editing', mode: 'options' });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    let record = null;
    await testPattern({
      page,
      gotoPage: async () => {
        record = await gotoPage(mockPage, mockRecord);
      },
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'email'),
      expectEditable: async () => {
        // 应该显示 record 中的值
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.email-email').getByRole('textbox'),
        ).toHaveValue(record.email);
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
          `email:${record.email}`,
        );
      },
    });
  });
});

test.describe('icon', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'icon', blockType: 'editing', mode: 'options' });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    let record = null;
    await testPattern({
      page,
      gotoPage: async () => {
        record = await gotoPage(mockPage, mockRecord);
      },
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
      },
    });
  });
});

test.describe('single line text', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'singleLineText', blockType: 'editing', mode: 'options' });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    let record = null;
    await testPattern({
      page,
      gotoPage: async () => {
        record = await gotoPage(mockPage, mockRecord);
      },
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'singleLineText'),
      expectEditable: async () => {
        // 应该显示 record 中的值
        await expect(
          page
            .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
            .getByRole('textbox'),
        ).toHaveValue(record.singleLineText);
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
        ).toHaveText(`singleLineText:${record.singleLineText}`);
      },
    });
  });

  test('Set validation rules', async ({ page, mockPage, mockRecord }) => {
    await testSetValidationRules({
      page,
      gotoPage: () => gotoPage(mockPage, mockRecord),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'singleLineText'),
    });
  });
});

test.describe('integer', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'integer', blockType: 'editing', mode: 'options' });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    let record = null;
    await testPattern({
      page,
      gotoPage: async () => {
        record = await gotoPage(mockPage, mockRecord);
      },
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'integer'),
      expectEditable: async () => {
        // 应该显示 record 中的值
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.integer-integer').getByRole('spinbutton'),
        ).toHaveValue(String(record.integer));
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
          `integer:${record.integer}`,
        );
      },
    });
  });

  test('set validation rules', async ({ page, mockPage, mockRecord }) => {
    await testSetValidationRules({
      page,
      gotoPage: () => gotoPage(mockPage, mockRecord),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'integer'),
    });
  });
});

test.describe('number', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'number', blockType: 'editing', mode: 'options' });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    // TODO: number 类型的字段，当输入了小数，然后把 Pattern 切换成 Easy-reading 模式，小数不应该被去掉；
    test.fail();
    let record = null;
    await testPattern({
      page,
      gotoPage: async () => {
        record = await gotoPage(mockPage, mockRecord);
      },
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'number'),
      expectEditable: async () => {
        // 应该显示 record 中的值
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.number-number').getByRole('spinbutton'),
        ).toHaveValue(String(record.number));

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

  test('set validation rules', async ({ page, mockPage, mockRecord }) => {
    await testSetValidationRules({
      page,
      gotoPage: () => gotoPage(mockPage, mockRecord),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'number'),
    });
  });
});

test.describe('password', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'password', blockType: 'editing', mode: 'options' });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    let record = null;
    await testPattern({
      page,
      gotoPage: async () => {
        record = await gotoPage(mockPage, mockRecord);
      },
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

  test('set validation rules', async ({ page, mockPage, mockRecord }) => {
    await testSetValidationRules({
      page,
      gotoPage: () => gotoPage(mockPage, mockRecord),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'password'),
    });
  });
});

test.describe('percent', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'percent', blockType: 'editing', mode: 'options' });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    // TODO: percent 类型的字段，当输入了小数，然后把 Pattern 切换成 Easy-reading 模式，小数点不应该被去掉；
    test.fail();
    let record = null;
    await testPattern({
      page,
      gotoPage: async () => {
        record = await gotoPage(mockPage, mockRecord);
      },
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'percent'),
      expectEditable: async () => {
        // 应该显示 record 中的值
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.percent-percent').getByRole('spinbutton'),
        ).toHaveValue(String(record.percent));

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

  test('set validation rules', async ({ page, mockPage, mockRecord }) => {
    await testSetValidationRules({
      page,
      gotoPage: () => gotoPage(mockPage, mockRecord),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'percent'),
    });
  });
});

test.describe('phone', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'phone', blockType: 'editing', mode: 'options' });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    let record = null;
    await testPattern({
      page,
      gotoPage: async () => {
        record = await gotoPage(mockPage, mockRecord);
      },
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
  commonTesting({ openDialogAndShowMenu, fieldName: 'longText', blockType: 'editing', mode: 'options' });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    let record = null;
    await testPattern({
      page,
      gotoPage: async () => {
        record = await gotoPage(mockPage, mockRecord);
      },
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'longText'),
      expectEditable: async () => {
        // 应该显示 record 中的值
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.longText-longText').getByRole('textbox'),
        ).toHaveValue(record.longText);

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
        await expect(
          page.getByLabel('block-item-CollectionField-general-form-general.longText-longText').getByRole('textbox'),
        ).not.toBeVisible();
        await expect(page.getByLabel('block-item-CollectionField-general-form-general.longText-longText')).toHaveText(
          `longText:test long text`,
        );
      },
    });
  });

  test('set validation rules', async ({ page, mockPage, mockRecord }) => {
    await testSetValidationRules({
      page,
      gotoPage: () => gotoPage(mockPage, mockRecord),
      openDialog: () => openDialog(page),
      showMenu: () => showMenu(page, 'longText'),
    });
  });
});

test.describe('URL', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'url', blockType: 'editing', mode: 'options' });

  test('pattern', async ({ page, mockPage, mockRecord }) => {
    let record = null;
    await testPattern({
      page,
      gotoPage: async () => {
        record = await gotoPage(mockPage, mockRecord);
      },
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

const gotoPage = async (mockPage, mockRecord) => {
  const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
  const record = await mockRecord('general');
  await nocoPage.goto();

  return record;
};

const openDialog = async (page: Page) => {
  await page.getByLabel('action-Action.Link-Edit record-update-general-table-0').click();
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
  await gotoPage(mockPage, mockRecord);
  await openDialog(page);
  await showMenu(page, fieldName);
}
