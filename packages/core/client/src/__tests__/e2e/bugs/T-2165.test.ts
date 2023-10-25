import { expect, test } from '@nocobase/test/client';

const config = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      '4nd32b2msmb': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'BlockInitializers',
        properties: {
          psn8ekavlq6: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              '78sh75l4aye': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  x1bef0fr3mp: {
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
                      dmzuakwhn67: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'FormV2',
                        'x-component-props': {
                          useProps: '{{ useFormBlockProps }}',
                        },
                        properties: {
                          grid: {
                            'x-uid': 'hjzgxol8pmk',
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'FormItemInitializers',
                            'x-linkage-rules': [
                              {
                                condition: {
                                  $and: [],
                                },
                                actions: [
                                  {
                                    targetFields: ['nickname'],
                                    operator: 'value',
                                    value: {
                                      mode: 'express',
                                      value: '{{$nForm.nickname}}',
                                      result: '{{$nForm.nickname}}',
                                    },
                                  },
                                  {
                                    targetFields: ['username'],
                                    operator: 'value',
                                    value: {
                                      mode: 'express',
                                      value: '{{$nForm.phone}}',
                                      result: '{{$nForm.phone}}',
                                    },
                                  },
                                ],
                              },
                            ],
                            properties: {
                              ghhc0yhkzo3: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                properties: {
                                  cogs086ympz: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
                                    properties: {
                                      nickname: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'string',
                                        'x-designer': 'FormItem.Designer',
                                        'x-component': 'CollectionField',
                                        'x-decorator': 'FormItem',
                                        'x-collection-field': 'users.nickname',
                                        'x-component-props': {},
                                        'x-uid': 'uham04eoezy',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': '2skfzuw7qxe',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'ejr3cir9ka5',
                                'x-async': false,
                                'x-index': 1,
                              },
                              ffhaknxhqpx: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                properties: {
                                  i3ryir3ak3d: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
                                    properties: {
                                      username: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'string',
                                        'x-designer': 'FormItem.Designer',
                                        'x-component': 'CollectionField',
                                        'x-decorator': 'FormItem',
                                        'x-collection-field': 'users.username',
                                        'x-component-props': {},
                                        'x-uid': 'kw6xnym0d2b',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'l7w26sen1yq',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'agrwgc6u5nh',
                                'x-async': false,
                                'x-index': 2,
                              },
                              duw19c22p3a: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                properties: {
                                  '64y498coobd': {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
                                    properties: {
                                      email: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'string',
                                        'x-designer': 'FormItem.Designer',
                                        'x-component': 'CollectionField',
                                        'x-decorator': 'FormItem',
                                        'x-collection-field': 'users.email',
                                        'x-component-props': {},
                                        'x-uid': 'yw4htrn4yus',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'co2ntoxojzd',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': '1ma4kg0h049',
                                'x-async': false,
                                'x-index': 3,
                              },
                              gkcvoutlsnn: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                properties: {
                                  '0wpsholkerv': {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
                                    properties: {
                                      phone: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'string',
                                        'x-designer': 'FormItem.Designer',
                                        'x-component': 'CollectionField',
                                        'x-decorator': 'FormItem',
                                        'x-collection-field': 'users.phone',
                                        'x-component-props': {},
                                        'x-uid': 'vuakogudr4a',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'pjbv5opckij',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': '7r2oycam1jj',
                                'x-async': false,
                                'x-index': 4,
                              },
                            },
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
                            'x-uid': 'q2ln2amp70q',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'ftb89wttlgb',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': '7xk8np3hom7',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'etlsqr2svs6',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'vnqpjz7rukb',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'xq6asyjoszu',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'audztrgao6i',
    'x-async': true,
    'x-index': 1,
  },
};

// fix https://nocobase.height.app/T-2165
test('BUG: variable labels should be displayed normally', async ({ page, mockPage }) => {
  await mockPage(config).goto();

  await page.getByTestId('users-resource').hover();
  await page.getByTestId('designer-schema-settings').first().hover();
  await page.getByRole('menuitem', { name: 'Linkage rules' }).click();

  await expect(page.getByText('Current form / Nickname')).toBeVisible();
  await expect(page.getByText('Current form / Phone')).toBeVisible();
});
