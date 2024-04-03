import { expect, test } from '@nocobase/test/e2e';

test.describe('data scope of component Select', () => {
  test('should immediate effect when the data scope changes', async ({ page, mockPage }) => {
    await mockPage({
      pageSchema: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Page',
        properties: {
          s5cjt8zbavu: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'page:addBlock',
            properties: {
              d1n1knkhn2j: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Row',
                properties: {
                  kf89qhko8o4: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-component': 'Grid.Col',
                    properties: {
                      exiwrzejk22: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-acl-action-props': {
                          skipScopeCheck: true,
                        },
                        'x-acl-action': 'users:create',
                        'x-decorator': 'FormBlockProvider',
                        'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
                        'x-decorator-props': {
                          dataSource: 'main',
                          collection: 'users',
                        },
                        'x-toolbar': 'BlockSchemaToolbar',
                        'x-settings': 'blockSettings:createForm',
                        'x-component': 'CardItem',
                        properties: {
                          fbmn67be1zi: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'FormV2',
                            'x-use-component-props': 'useCreateFormBlockProps',
                            properties: {
                              grid: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid',
                                'x-initializer': 'form:configureFields',
                                properties: {
                                  jff7vsu8j5s: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Row',
                                    properties: {
                                      qhpd737ckz3: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        'x-component': 'Grid.Col',
                                        properties: {
                                          roles: {
                                            'x-uid': 'hkrim8fsg6l',
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'string',
                                            'x-toolbar': 'FormItemSchemaToolbar',
                                            'x-settings': 'fieldSettings:FormItem',
                                            'x-component': 'CollectionField',
                                            'x-decorator': 'FormItem',
                                            'x-collection-field': 'users.roles',
                                            'x-component-props': {
                                              fieldNames: {
                                                label: 'name',
                                                value: 'name',
                                              },
                                              service: {
                                                params: {
                                                  filter: {},
                                                },
                                              },
                                            },
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'tb9lf9yyhy9',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'ar7k608qmd2',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 's4bqgcb1lcw',
                                'x-async': false,
                                'x-index': 1,
                              },
                              kq8qslxsw0g: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-initializer': 'createForm:configureActions',
                                'x-component': 'ActionBar',
                                'x-component-props': {
                                  layout: 'one-column',
                                  style: {
                                    marginTop: 24,
                                  },
                                },
                                'x-uid': 'psxtkltcrnx',
                                'x-async': false,
                                'x-index': 2,
                              },
                            },
                            'x-uid': 'dkha40ualdp',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'vq2tiw2skt0',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': '12yzm4085xn',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'ovmsg9hd18d',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': '7ekmknvq2v6',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'h9hdcz34nux',
        'x-async': true,
        'x-index': 1,
      },
    }).goto();

    // 1. 初始状态应该包含两个选项
    await page.getByTestId('select-object-multiple').click();
    await expect(page.getByRole('option', { name: 'admin' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'member' })).toBeVisible();

    // 2. 设置下数据范围
    await page.getByTestId('select-object-multiple').hover();
    await page.getByLabel('designer-schema-settings-CollectionField-fieldSettings:FormItem-users-users.').hover();
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByRole('menuitemcheckbox', { name: 'Role UID' }).click();
    await page.getByTestId('select-filter-operator').click();
    await page.getByRole('option', { name: 'is empty' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 3. 设置了上面的数据范围之后，应该没有选项了
    await page.getByTestId('select-object-multiple').click();
    await expect(page.getByRole('option', { name: 'admin' })).toBeHidden();
    await expect(page.getByRole('option', { name: 'member' })).toBeHidden();
    await expect(page.getByText('No data')).toBeVisible();
  });
});
