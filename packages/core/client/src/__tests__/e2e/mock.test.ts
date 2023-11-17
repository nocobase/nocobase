import { expect, test } from '@nocobase/test/client';

const phonePageConfig = {
  collections: [
    {
      name: 't_x3mxc1ymorw',
      title: 'mock-testing',
      fields: [
        {
          name: 'email',
          title: 'Email',
          interface: 'email',
        },
      ],
    },
  ],
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-index': 1,
    properties: {
      zyfy6q68u10: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'BlockInitializers',
        'x-index': 1,
        properties: {
          nkbrwj149hw: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              t9wwr80ymdc: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  b0iohq28s9u: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 't_x3mxc1ymorw:list',
                    'x-decorator-props': {
                      collection: 't_x3mxc1ymorw',
                      resource: 't_x3mxc1ymorw',
                      action: 'list',
                      params: {
                        pageSize: 20,
                      },
                      rowKey: 'id',
                      showIndex: true,
                      dragSort: false,
                      disableTemplate: false,
                    },
                    'x-designer': 'TableBlockDesigner',
                    'x-component': 'CardItem',
                    'x-filter-targets': [],
                    properties: {
                      actions: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-initializer': 'TableActionInitializers',
                        'x-component': 'ActionBar',
                        'x-component-props': {
                          style: {
                            marginBottom: 'var(--nb-spacing)',
                          },
                        },
                        'x-uid': '0wksx4dtgum',
                        'x-async': false,
                        'x-index': 1,
                      },
                      zvooo4ygn4x: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'array',
                        'x-initializer': 'TableColumnInitializers',
                        'x-component': 'TableV2',
                        'x-component-props': {
                          rowKey: 'id',
                          rowSelection: {
                            type: 'checkbox',
                          },
                          useProps: '{{ useTableBlockProps }}',
                        },
                        properties: {
                          actions: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            title: '{{ t("Actions") }}',
                            'x-action-column': 'actions',
                            'x-decorator': 'TableV2.Column.ActionBar',
                            'x-component': 'TableV2.Column',
                            'x-designer': 'TableV2.ActionColumnDesigner',
                            'x-initializer': 'TableActionColumnInitializers',
                            properties: {
                              actions: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-uid': '3gombpceyjl',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'vcjbrby0i27',
                            'x-async': false,
                            'x-index': 1,
                          },
                          olrr4chfvfh: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-designer': 'TableV2.Column.Designer',
                            'x-component': 'TableV2.Column',
                            properties: {
                              email: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 't_x3mxc1ymorw.email',
                                'x-component': 'CollectionField',
                                'x-component-props': {
                                  ellipsis: true,
                                },
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-uid': 'sqogd3z6o95',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'vcve0j78imw',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'benml5cswa0',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'v0bydleh1ni',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'rmplhh05qpr',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'szfwommojdg',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'k8t4d8im9lx',
        'x-async': false,
      },
    },
    'x-uid': 't6726o68agh',
    'x-async': true,
  },
};

test.describe('mock record', () => {
  test('email field', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(phonePageConfig).waitForInit();
    const records = await mockRecords<{ email: string }>('t_x3mxc1ymorw', 3);
    await nocoPage.goto();

    await expect(page.getByRole('cell', { name: records[0].email })).toBeVisible();
    await expect(page.getByRole('cell', { name: records[1].email })).toBeVisible();
    await expect(page.getByRole('cell', { name: records[2].email })).toBeVisible();
  });
});
