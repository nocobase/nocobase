import { expect, test } from '@nocobase/test/client';

const config = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      nrwnyusnbrd: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'BlockInitializers',
        properties: {
          w85tu6tnlfp: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              q9vljapijwj: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  zia3dyel3jr: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 't_fhdhd0nk7b9:list',
                    'x-decorator-props': {
                      collection: 't_fhdhd0nk7b9',
                      resource: 't_fhdhd0nk7b9',
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
                        properties: {
                          '5210td4a1ms': {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            title: '{{ t("Delete") }}',
                            'x-action': 'destroy',
                            'x-component': 'Action',
                            'x-designer': 'Action.Designer',
                            'x-decorator': 'ACLActionProvider',
                            'x-acl-action-props': {
                              skipScopeCheck: true,
                            },
                            'x-component-props': {
                              icon: 'DeleteOutlined',
                              confirm: {
                                title: "{{t('Delete record')}}",
                                content: "{{t('Are you sure you want to delete it?')}}",
                              },
                              useProps: '{{ useBulkDestroyActionProps }}',
                            },
                            'x-acl-action': 't_fhdhd0nk7b9:destroy',
                            'x-align': 'right',
                            type: 'void',
                            'x-uid': 'aud7zy2m18z',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'j10gefyy50y',
                        'x-async': false,
                        'x-index': 1,
                      },
                      k88f9zdl4k1: {
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
                                'x-uid': 'lky44f6h6kh',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'fvkqaxe6bo1',
                            'x-async': false,
                            'x-index': 1,
                          },
                          wwn0ajwixxl: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-designer': 'TableV2.Column.Designer',
                            'x-component': 'TableV2.Column',
                            properties: {
                              f_vbrlno0zej9: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 't_fhdhd0nk7b9.f_vbrlno0zej9',
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
                                'x-uid': 'emphc9g52u7',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'q7h24jnc070',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'a9qdzmt4vai',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': '98ta7h4ba1f',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'mo6eowotbqd',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': '2nmkby45kce',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'zyukds9t2ln',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'd0j1mfitnmr',
    'x-async': true,
    'x-index': 1,
  },
  collections: [
    {
      name: 't_fhdhd0nk7b9',
      title: 'test',
      fields: [
        {
          name: 'f_vbrlno0zej9',
          interface: 'input',
        },
      ],
    },
  ],
};

test('check table row', async ({ page, mockPage, mockRecords }) => {
  const nocoPage = await mockPage(config).waitForInit();
  const records = await mockRecords('t_fhdhd0nk7b9', 3);
  await nocoPage.goto();

  await expect(page.getByText(records[0].f_vbrlno0zej9)).toBeVisible();

  await page.getByLabel('table-index-1').hover();
  await page.getByRole('checkbox', { name: 'checkbox' }).click();
  await page.getByLabel('action-Action-Delete-destroy-t_fhdhd0nk7b9-table').click();

  // 显示确认弹窗
  await expect(page.getByText('Are you sure you want to delete it?')).toBeVisible();

  // 点击确认
  await page.getByRole('button', { name: 'OK', exact: true }).click();

  // 确认内容已被删除
  await expect(page.getByText(records[0].f_vbrlno0zej9)).not.toBeVisible();
});
