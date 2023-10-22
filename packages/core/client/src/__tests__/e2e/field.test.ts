import { expect, test } from '@nocobase/test/client';
import { approximateColor } from './utils';
const formPageSchema = {
  _isJSONSchemaObject: true,
  version: '2.0',
  type: 'void',
  'x-component': 'Page',
  properties: {
    lyie34rtcu4: {
      _isJSONSchemaObject: true,
      version: '2.0',
      type: 'void',
      'x-component': 'Grid',
      'x-initializer': 'BlockInitializers',
      properties: {
        skmxkfr67em: {
          _isJSONSchemaObject: true,
          version: '2.0',
          type: 'void',
          'x-component': 'Grid.Row',
          properties: {
            '860xnb3egb8': {
              _isJSONSchemaObject: true,
              version: '2.0',
              type: 'void',
              'x-component': 'Grid.Col',
              properties: {
                aa9rqm7bkud: {
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
                    t4mi2jywqj7: {
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
                          'x-initializer': 'FormItemInitializers',
                          'x-uid': '66dozhzo5ld',
                          'x-async': false,
                          'x-index': 1,
                        },
                        actions: {
                          _isJSONSchemaObject: true,
                          version: '2.0',
                          type: 'void',
                          'x-initializer': 'FormActionInitializers',
                          'x-component': 'ActionBar',
                          'x-component-props': {
                            layout: 'one-column',
                            style: {
                              marginTop: 24,
                            },
                          },
                          'x-uid': 'q8am9zt6m2x',
                          'x-async': false,
                          'x-index': 2,
                        },
                      },
                      'x-uid': '4ojxya0re8h',
                      'x-async': false,
                      'x-index': 1,
                    },
                  },
                  'x-uid': '183n4o77awp',
                  'x-async': false,
                  'x-index': 1,
                },
              },
              'x-uid': 'zwxgkj66isi',
              'x-async': false,
              'x-index': 1,
            },
          },
          'x-uid': '8tryd9kz9bd',
          'x-async': false,
          'x-index': 1,
        },
      },
      'x-uid': 'piwq6rrjrsq',
      'x-async': false,
      'x-index': 1,
    },
  },
  'x-uid': '5cszm46yqxb',
  'x-async': true,
  'x-index': 1,
};

test.describe('add field & remove field in block', () => {
  test('add field,then remove field in block', async ({ page, mockPage }) => {
    await mockPage({ pageSchema: formPageSchema }).goto();
    await page.getByTestId('configure-fields-button-of-form-item-users').click();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await page.getByRole('menuitem', { name: 'Username' }).click();
    await page.getByRole('menuitem', { name: 'Email' }).click();
    //添加字段
    await expect(page.getByTestId('form-block-field-users.username')).toBeVisible();
    await expect(page.getByTestId('form-block-field-users.email')).toBeVisible();
    await expect(page.getByTestId('form-block-field-users.nickname')).toBeVisible();
    await expect(await page.getByRole('menuitem', { name: 'Nickname' }).getByRole('switch').isChecked()).toBe(true);
    await expect(await page.getByRole('menuitem', { name: 'Username' }).getByRole('switch').isChecked()).toBe(true);
    await expect(await page.getByRole('menuitem', { name: 'Email' }).getByRole('switch').isChecked()).toBe(true);
    //移除字段
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await page.getByRole('menuitem', { name: 'Username' }).click();
    await page.getByRole('menuitem', { name: 'Email' }).click();
    await expect(page.getByTestId('form-block-field-users.username')).not.toBeVisible();
    await expect(page.getByTestId('form-block-field-users.email')).not.toBeVisible();
    await expect(page.getByTestId('form-block-field-users.nickname')).not.toBeVisible();
  });
});

test.describe('drag field in block', () => {
  test('drag field for layout', async ({ page, mockPage }) => {
    await mockPage({ pageSchema: formPageSchema }).goto();
    await page.getByTestId('configure-fields-button-of-form-item-users').click();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await page.getByRole('menuitem', { name: 'Username' }).click();
    await page.getByRole('menuitem', { name: 'Email' }).click();

    const sourceElement = await page.getByTestId('form-block-field-users.nickname');
    await sourceElement.hover();
    const source = await page.getByTestId('form-block-field-users.nickname').getByLabel('designer-drag');
    await source.hover();

    const targetElement = await page.getByTestId('form-block-field-users.username');
    await source.dragTo(targetElement);
    const targetElement2 = await page.getByTestId('form-block-field-users.email');
    await page.getByTestId('form-block-field-users.nickname').getByLabel('designer-drag').hover();
    await page.getByTestId('form-block-field-users.nickname').getByLabel('designer-drag').dragTo(targetElement2);

    const nickname = await source.boundingBox();
    const username = await targetElement.boundingBox();
    const email = await targetElement2.boundingBox();
    const max = Math.max(username.y, nickname.y, email.y);
    //拖拽调整排序符合预期
    await expect(nickname.y).toBe(max);
  });
});

test.describe('field setting config ', () => {
  test('edit field label in block', async ({ page, mockPage }) => {
    await mockPage({ pageSchema: formPageSchema }).goto();
    await page.getByTestId('configure-fields-button-of-form-item-users').click();
    await page.getByRole('menuitem', { name: 'Username' }).click();
    await page.getByTestId('form-block-field-users.username').click();
    await page.getByTestId('form-block-field-users.username').getByLabel('designer-schema-settings').hover();
    await page.getByRole('menuitem', { name: 'Edit field title' }).click();
    await page.getByTestId('block-item').getByRole('textbox').fill('Username1');
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByTestId('form-block-field-users.username').getByText('Username1')).toBeVisible();
    //回显
    await page.getByTestId('form-block-field-users.username').click();
    await page.getByTestId('form-block-field-users.username').getByLabel('designer-schema-settings').hover();
    await page.getByRole('menuitem', { name: 'Edit field title' }).click();
    await page.waitForTimeout(1000); // 等待1秒钟
    await expect(await page.getByTestId('block-item').getByRole('textbox').inputValue()).toBe('Username1');
  });
  test('display & not display field label in block ', async ({ page, mockPage }) => {
    await mockPage({ pageSchema: formPageSchema }).goto();
    await page.getByTestId('configure-fields-button-of-form-item-users').click();
    await page.getByRole('menuitem', { name: 'Username' }).click();
    await page.getByTestId('form-block-field-users.username').click();
    await page.getByTestId('form-block-field-users.username').getByLabel('designer-schema-settings').hover();
    await page.getByRole('menuitem', { name: 'Display title' }).hover();
    //默认显示
    await expect(await page.getByRole('menuitem', { name: 'Display title' }).getByRole('switch').isChecked()).toBe(
      true,
    );
    //设置不显示标题
    await page.getByRole('menuitem', { name: 'Display title' }).click();
    const labelItem = page.getByTestId('form-block-field-users.username').locator('.ant-formily-item-label');
    const labelDisplay = await labelItem.evaluate((element) => {
      const computedStyle = window.getComputedStyle(element);
      return computedStyle.display;
    });
    expect(labelDisplay).toBe('none');
    //设置显示标题
    await page.getByTestId('form-block-field-users.username').click();
    await page.getByTestId('form-block-field-users.username').getByLabel('designer-schema-settings').hover();
    await page.getByRole('menuitem', { name: 'Display title' }).click();
    const labelDisplay1 = await labelItem.evaluate((element) => {
      const computedStyle = window.getComputedStyle(element);
      return computedStyle.display;
    });
    expect(labelDisplay1).toBe('flex');
  });
  test('edit field description ', async ({ page, mockPage }) => {
    await mockPage({ pageSchema: formPageSchema }).goto();
    const description = 'field description';
    await page.getByTestId('configure-fields-button-of-form-item-users').click();
    await page.getByRole('menuitem', { name: 'Username' }).click();
    await page.getByTestId('form-block-field-users.username').click();
    await page.getByTestId('form-block-field-users.username').getByLabel('designer-schema-settings').hover();
    await page.getByText('Edit description').click();
    await page.getByTestId('block-item').locator('textarea').fill(description);
    await page.getByRole('button', { name: 'OK' }).click();
    const descriptionItem = await page
      .getByTestId('form-block-field-users.username')
      .locator('.ant-formily-item-extra');
    const descriptionItemColor = await descriptionItem.evaluate((element) => {
      const computedStyle = window.getComputedStyle(element);
      return computedStyle.color;
    });
    //字段描述样式符合预期
    expect(await descriptionItem.innerText()).toBe(description);
    const isApproximate = approximateColor(descriptionItemColor, 'rgba(0, 0, 0, 0.65)');
    await expect(isApproximate).toBe(true);
  });
  test('field required ', async ({ page, mockPage }) => {
    await mockPage({ pageSchema: formPageSchema }).goto();
    await page.getByTestId('configure-fields-button-of-form-item-users').click();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await page.getByTestId('form-block-field-users.nickname').click();
    await page.getByTestId('form-block-field-users.nickname').getByLabel('designer-schema-settings').click();
    await page.getByRole('menuitem', { name: 'Required' }).click();
    await page.getByTestId('configure-actions-button-of-form-block-users').click();
    await page.getByRole('menuitem', { name: 'Submit' }).click();
    await page.getByLabel('Submit').click();
    await page.waitForTimeout(1000);
    //必填校验符合预期
    await expect(
      await page.getByTestId('form-block-field-users.nickname').locator('.ant-formily-item-error-help'),
    ).toBeVisible();
    const inputItem = page.getByTestId('form-block-field-users.nickname').locator('input');
    const inputErrorBorderColor = await inputItem.evaluate((element) => {
      const computedStyle = window.getComputedStyle(element);
      return computedStyle.borderColor;
    });
    //样式符合预期
    expect(inputErrorBorderColor).toBe('rgb(255, 77, 79)');
    // 断言表单未被提交
    expect(await page.getByTestId('form-block-field-users')).not.toHaveProperty('submitted', true);
  });
  test('field validation rule ', async ({ page, mockPage }) => {
    await mockPage({ pageSchema: formPageSchema }).goto();
    const errorMessage = 'this is error message';
    await page.getByTestId('configure-fields-button-of-form-item-users').click();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await page.getByTestId('form-block-field-users.nickname').click();
    await page.getByTestId('form-block-field-users.nickname').getByLabel('designer-schema-settings').click();
    await page.getByText('Set validation rules').click();
    await page.getByTestId('block-item').getByRole('button', { name: 'plus Add validation rule' }).click();
    await page
      .getByRole('button', { name: 'Max length : Increase Value Decrease Value' })
      .getByRole('spinbutton')
      .fill('8');
    await page.getByRole('button', { name: 'Error message' }).locator('textarea').fill(errorMessage);
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.getByTestId('form-block-field-users.nickname').getByRole('textbox').fill('111111111');
    const errorInfo = await page.getByTestId('form-block-field-users.nickname').locator('.ant-formily-item-error-help');
    await expect(errorInfo).toBeVisible();
    await page.waitForSelector('input');
    const inputItem = await page.getByTestId('form-block-field-users.nickname').locator('input');
    const inputErrorBorderColor = await inputItem.evaluate(async (element) => {
      const computedStyle = await window.getComputedStyle(element);
      return computedStyle.borderColor;
    });
    //报错信息符合预期
    const isApproximate = approximateColor(inputErrorBorderColor, 'rgba(187, 56, 58, 0.96)');
    await expect(isApproximate).toBe(true);
    await expect(await errorInfo.innerText()).toBe(errorMessage);
  });
  test('field pattern ', async ({ page, mockPage }) => {
    await mockPage({ pageSchema: formPageSchema }).goto();
    await page.getByTestId('configure-fields-button-of-form-item-users').click();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await page.getByTestId('form-block-field-users.nickname').click();
    const inputElement = await page.getByTestId('form-block-field-users.nickname').locator('input');
    await page.getByTestId('form-block-field-users.nickname').getByLabel('designer-schema-settings').click();
    await page.getByRole('menuitem', { name: 'Pattern' }).click();
    //禁用
    await page.getByRole('option', { name: 'Readonly' }).click();
    await expect(await inputElement.isDisabled()).toBe(true);
    await page.getByRole('menuitem', { name: 'Pattern' }).click();
    //只读
    await page.getByText('Easy-reading').click();
    await expect(
      await page.getByTestId('form-block-field-users.nickname').locator('.ant-description-input'),
    ).toBeInViewport();
  });
});
