import { enableToConfig, expect, test } from '@nocobase/test/client';
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

    await expect(page.getByTestId('form-block-field-users.username')).toBeVisible();
    await expect(page.getByTestId('form-block-field-users.email')).toBeVisible();
    await expect(page.getByTestId('form-block-field-users.nickname')).toBeVisible();
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
    await expect(nickname.y).toBe(max);
  });
});

test.describe('field schema setting', () => {
  test.skip('edit field label in block', async ({ page, mockPage }) => {
    await mockPage({ name: 'page tab' }).goto();
    await enableToConfig(page);
    await page
      .locator('div')
      .filter({ hasText: /^page tab$/ })
      .nth(3)
      .click();
    await page.getByTestId('page-designer-button').locator('path').hover();
    //默认不启用
    await expect(page.getByRole('menuitem', { name: 'Enable page tabs' }).getByRole('switch')).not.toBeChecked();
    //启用标签
    await page.getByText('Enable page tabs').click();
    await expect(page.getByRole('tab').locator('div').filter({ hasText: 'Unnamed' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'plus Add tab' })).toBeVisible();
    await page.getByRole('tab').locator('div').filter({ hasText: 'Unnamed' }).click();
    await expect(page.getByTestId('add-block-button-in-page')).toBeVisible();

    //添加新的tab
    await page.getByRole('button', { name: 'plus Add tab' }).click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('page tab 1');
    await page.getByRole('button', { name: 'OK' }).click();
    await page.getByText('page tab 1').click();
    await page.getByRole('button', { name: 'plus Add tab' }).click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('page tab 2');
    await page.getByRole('button', { name: 'OK' }).click();
    await page.getByText('page tab 2').click();

    await page.waitForTimeout(1000); // 等待1秒钟
    const tabMenuItem = await page.getByRole('tab').locator('div > span').filter({ hasText: 'page tab 2' });
    const tabMenuItemActivedColor = await tabMenuItem.evaluate((element) => {
      const computedStyle = window.getComputedStyle(element);
      return computedStyle.color;
    });
    await expect(page.getByText('page tab 1')).toBeVisible();
    await expect(page.getByText('page tab 2')).toBeVisible();
    await expect(page.getByTestId('add-block-button-in-page')).toBeVisible();
    await expect(tabMenuItemActivedColor).toBe('rgb(22, 119, 255)');

    //修改tab名称
    await page.getByText('Unnamed').click();
    await page.getByText('Unnamed').hover();
    await page.getByRole('button', { name: 'menu', exact: true }).hover();
    await page.getByText('Edit', { exact: true }).click();
    await page.getByRole('textbox').fill('page tab');
    await page.getByRole('button', { name: 'OK' }).click();

    const tabMenuItem1 = await page.getByRole('tab').getByText('page tab', { exact: true });
    const tabMenuItemActivedColor1 = await tabMenuItem1.evaluate((element) => {
      const computedStyle = window.getComputedStyle(element);
      return computedStyle.color;
    });
    await expect(tabMenuItem1).toBeVisible();
    await expect(page.getByTestId('add-block-button-in-page')).toBeVisible();
    await expect(tabMenuItemActivedColor1).toBe('rgb(22, 119, 255)');

    //删除 tab
    await page.getByRole('tab').getByText('page tab', { exact: true }).click();
    await page.getByRole('tab').getByText('page tab', { exact: true }).hover();
    await page.getByRole('button', { name: 'menu', exact: true }).hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByRole('tab').getByText('page tab', { exact: true })).not.toBeVisible();
    await page.getByRole('tab').getByText('page tab 1').click();

    //禁用标签
  });
  test.skip('display & not display field label in block ', async ({ page, mockPage }) => {
    await mockPage({
      pageSchema: {
        'x-uid': 'h8q2mcgo3cq',
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Page',
        'x-component-props': {
          enablePageTabs: true,
        },
        properties: {
          bi8ep3svjee: {
            'x-uid': '9kr7xm9x4ln',
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'BlockInitializers',
            title: 'tab 1',
            'x-async': false,
            'x-index': 1,
          },
          rw91udnzpr3: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            title: 'tab 2',
            'x-component': 'Grid',
            'x-initializer': 'BlockInitializers',
            'x-uid': 'o5vp90rqsjx',
            'x-async': false,
            'x-index': 2,
          },
        },
        'x-async': true,
        'x-index': 1,
      },
    }).goto();
  });
  test.skip('edit field description ', async ({ page, mockPage }) => {});
  test.skip('setting field required ', async ({ page, mockPage }) => {
    await mockPage({
      pageSchema: {
        'x-uid': 'h8q2mcgo3cq',
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Page',
        'x-component-props': {
          enablePageTabs: true,
        },
        properties: {
          bi8ep3svjee: {
            'x-uid': '9kr7xm9x4ln',
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'BlockInitializers',
            title: 'tab 1',
            'x-async': false,
            'x-index': 1,
          },
          rw91udnzpr3: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            title: 'tab 2',
            'x-component': 'Grid',
            'x-initializer': 'BlockInitializers',
            'x-uid': 'o5vp90rqsjx',
            'x-async': false,
            'x-index': 2,
          },
        },
        'x-async': true,
        'x-index': 1,
      },
    }).goto();
  });
  test.skip('setting field validation rule ', async ({ page, mockPage }) => {
    await mockPage({
      pageSchema: {
        'x-uid': 'h8q2mcgo3cq',
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Page',
        'x-component-props': {
          enablePageTabs: true,
        },
        properties: {
          bi8ep3svjee: {
            'x-uid': '9kr7xm9x4ln',
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'BlockInitializers',
            title: 'tab 1',
            'x-async': false,
            'x-index': 1,
          },
          rw91udnzpr3: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            title: 'tab 2',
            'x-component': 'Grid',
            'x-initializer': 'BlockInitializers',
            'x-uid': 'o5vp90rqsjx',
            'x-async': false,
            'x-index': 2,
          },
        },
        'x-async': true,
        'x-index': 1,
      },
    }).goto();
  });
  test.skip('setting field pattern ', async ({ page, mockPage }) => {
    await mockPage({
      pageSchema: {
        'x-uid': 'h8q2mcgo3cq',
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Page',
        'x-component-props': {
          enablePageTabs: true,
        },
        properties: {
          bi8ep3svjee: {
            'x-uid': '9kr7xm9x4ln',
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'BlockInitializers',
            title: 'tab 1',
            'x-async': false,
            'x-index': 1,
          },
          rw91udnzpr3: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            title: 'tab 2',
            'x-component': 'Grid',
            'x-initializer': 'BlockInitializers',
            'x-uid': 'o5vp90rqsjx',
            'x-async': false,
            'x-index': 2,
          },
        },
        'x-async': true,
        'x-index': 1,
      },
    }).goto();
  });
});
