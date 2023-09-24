import { describe, expect, gotoPage, test } from 'e2eUtils';

describe('demo', () => {
  test('test1', async ({ page }) => {
    await gotoPage(page);
    await page.getByTestId('add-block-button-in-page').hover();
    await page.getByRole('menuitem', { name: 'table Table right' }).hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();

    // 添加断言
    await expect(page.getByRole('columnheader', { name: 'setting Configure columns' })).toBeVisible();
  });

  test('default value', async ({ page }) => {
    await gotoPage(page, {
      pageSchema: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Page',
        properties: {
          emyvpcy5ayw: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'BlockInitializers',
            properties: {
              tu0lximet00: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Row',
                properties: {
                  '3b9tx1f1b20': {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-component': 'Grid.Col',
                    properties: {
                      wx23xfe47pm: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-decorator': 'TableBlockProvider',
                        'x-acl-action': 'users:list',
                        'x-decorator-props': {
                          collection: 'users',
                          resource: 'users',
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
                              '43u4mk9c43o': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-action': 'create',
                                title: "{{t('Add new')}}",
                                'x-designer': 'Action.Designer',
                                'x-component': 'Action',
                                'x-decorator': 'ACLActionProvider',
                                'x-component-props': {
                                  openMode: 'drawer',
                                  type: 'primary',
                                  component: 'CreateRecordAction',
                                  icon: 'PlusOutlined',
                                },
                                'x-align': 'right',
                                'x-acl-action-props': {
                                  skipScopeCheck: true,
                                },
                                properties: {
                                  drawer: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{ t("Add record") }}',
                                    'x-component': 'Action.Container',
                                    'x-component-props': {
                                      className: 'nb-action-popup',
                                    },
                                    properties: {
                                      tabs: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        'x-component': 'Tabs',
                                        'x-component-props': {},
                                        'x-initializer': 'TabPaneInitializersForCreateFormBlock',
                                        properties: {
                                          tab1: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            title: '{{t("Add new")}}',
                                            'x-component': 'Tabs.TabPane',
                                            'x-designer': 'Tabs.Designer',
                                            'x-component-props': {},
                                            properties: {
                                              grid: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid',
                                                'x-initializer': 'CreateFormBlockInitializers',
                                                properties: {
                                                  uo6m0jhxter: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid.Row',
                                                    properties: {
                                                      uulk6jwfawn: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Col',
                                                        properties: {
                                                          '6qyu2ajswpx': {
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
                                                              iyvk4svw6bs: {
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
                                                                    properties: {
                                                                      x8jfv3bme3o: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid.Row',
                                                                        properties: {
                                                                          '2071mmtksi4': {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Col',
                                                                            properties: {
                                                                              nickname: {
                                                                                'x-uid': 'oykmg7ri64e',
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'string',
                                                                                'x-designer': 'FormItem.Designer',
                                                                                'x-component': 'CollectionField',
                                                                                'x-decorator': 'FormItem',
                                                                                'x-collection-field': 'users.nickname',
                                                                                'x-component-props': {},
                                                                                default: '',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': '55zb8k4ckwi',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'iz2vfy2b48l',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                    },
                                                                    'x-uid': 's9yifvr5e79',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                  actions: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-initializer': 'CreateFormActionInitializers',
                                                                    'x-component': 'ActionBar',
                                                                    'x-component-props': {
                                                                      layout: 'one-column',
                                                                      style: {
                                                                        marginTop: 24,
                                                                      },
                                                                    },
                                                                    properties: {
                                                                      mjzat7q0wck: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        title: '{{ t("Submit") }}',
                                                                        'x-action': 'submit',
                                                                        'x-component': 'Action',
                                                                        'x-designer': 'Action.Designer',
                                                                        'x-component-props': {
                                                                          type: 'primary',
                                                                          htmlType: 'submit',
                                                                          useProps: '{{ useCreateActionProps }}',
                                                                        },
                                                                        'x-action-settings': {
                                                                          triggerWorkflows: [],
                                                                        },
                                                                        type: 'void',
                                                                        'x-uid': '43loc1ya046',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                    },
                                                                    'x-uid': 'm0mzm17pg7m',
                                                                    'x-async': false,
                                                                    'x-index': 2,
                                                                  },
                                                                },
                                                                'x-uid': 'vxxf79cfojg',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'p08iotvzm1k',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'wg8i1dhgk7x',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': '5o21t8fd081',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'zxyaahg3ffg',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'i3gayiqgoyp',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': '4ihg3jnk8uf',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'hubhjp7pjru',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'djhh1fuk4we',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'rvndyr9bwtd',
                            'x-async': false,
                            'x-index': 1,
                          },
                          i5roj7gj6wu: {
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
                                    'x-uid': 'm1ebrk4jkxd',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'ovlt5idp9i7',
                                'x-async': false,
                                'x-index': 1,
                              },
                              a2hzqduuvzt: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'TableV2.Column.Decorator',
                                'x-designer': 'TableV2.Column.Designer',
                                'x-component': 'TableV2.Column',
                                properties: {
                                  nickname: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    'x-collection-field': 'users.nickname',
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
                                    'x-uid': 'unfdw1bnadm',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'nr4fi5yxkd7',
                                'x-async': false,
                                'x-index': 2,
                              },
                              pd6lnatbtu1: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'TableV2.Column.Decorator',
                                'x-designer': 'TableV2.Column.Designer',
                                'x-component': 'TableV2.Column',
                                properties: {
                                  username: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    'x-collection-field': 'users.username',
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
                                    'x-uid': '0vdyb9gh1rz',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': '2glhxuhm2yc',
                                'x-async': false,
                                'x-index': 3,
                              },
                            },
                            'x-uid': '0s8dl700tw7',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'v4x1vgqdl8i',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'vam0vubqe5p',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'nelhbc9ge25',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'p4le4c2k4ck',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'vjrh6lzt2of',
        'x-async': true,
        'x-index': 1,
      },
    });

    // 这里应该是卡在这里了，因为设置的超时时间是 60 秒，说明这里的选择器有问题，应该把后面的 drag menu 去掉。
    // 因为 drag menu 只有在鼠标 hover 的时候才会显示。
    await page.getByRole('button', { name: 'plus Add new' }).click();
    await page.getByTestId('users.nickname-field').getByTestId('designer-schema-settings').hover();
    await page.getByRole('menuitem', { name: 'Set default value' }).click();
    await page.getByTestId('default-item').getByRole('textbox').click();
    await page.getByTestId('default-item').getByRole('textbox').fill('123');
    await page.getByRole('button', { name: 'OK' }).click();

    // 这里报错是因为下面这个选择器找到了两个元素，我们应该使用 form block 中的输入框。
    await expect(page.getByTestId('form-block').getByRole('textbox')).toHaveValue('123');

    await page.getByTestId('submit-action').click();
    await expect(page.getByRole('cell', { name: '123' })).toBeVisible();
  });

  test('collection', async ({ page }) => {
    await gotoPage(page, {
      collections: [
        {
          key: 'ogiiapnuutg',
          name: 't_x2riu6byhx3',
          title: 'new collection',
          inherit: false,
          hidden: false,
          description: null,
          fields: [
            {
              key: 'o238lg2b3cr',
              name: 'id',
              type: 'bigInt',
              interface: 'id',
              description: null,
              collectionName: 't_x2riu6byhx3',
              parentKey: null,
              reverseKey: null,
              autoIncrement: true,
              primaryKey: true,
              allowNull: false,
              uiSchema: {
                type: 'number',
                title: '{{t("ID")}}',
                'x-component': 'InputNumber',
                'x-read-pretty': true,
              },
            },
            {
              key: 'yzetzfuqu2j',
              name: 'createdAt',
              type: 'date',
              interface: 'createdAt',
              description: null,
              collectionName: 't_x2riu6byhx3',
              parentKey: null,
              reverseKey: null,
              field: 'createdAt',
              uiSchema: {
                type: 'datetime',
                title: '{{t("Created at")}}',
                'x-component': 'DatePicker',
                'x-component-props': {},
                'x-read-pretty': true,
              },
            },
            {
              key: 'g3itvtk20ul',
              name: 'createdBy',
              type: 'belongsTo',
              interface: 'createdBy',
              description: null,
              collectionName: 't_x2riu6byhx3',
              parentKey: null,
              reverseKey: null,
              target: 'users',
              foreignKey: 'createdById',
              uiSchema: {
                type: 'object',
                title: '{{t("Created by")}}',
                'x-component': 'AssociationField',
                'x-component-props': {
                  fieldNames: {
                    value: 'id',
                    label: 'nickname',
                  },
                },
                'x-read-pretty': true,
              },
              targetKey: 'id',
            },
            {
              key: 'ibx0063z5m7',
              name: 'updatedAt',
              type: 'date',
              interface: 'updatedAt',
              description: null,
              collectionName: 't_x2riu6byhx3',
              parentKey: null,
              reverseKey: null,
              field: 'updatedAt',
              uiSchema: {
                type: 'string',
                title: '{{t("Last updated at")}}',
                'x-component': 'DatePicker',
                'x-component-props': {},
                'x-read-pretty': true,
              },
            },
            {
              key: '4d03iy9kr8s',
              name: 'updatedBy',
              type: 'belongsTo',
              interface: 'updatedBy',
              description: null,
              collectionName: 't_x2riu6byhx3',
              parentKey: null,
              reverseKey: null,
              target: 'users',
              foreignKey: 'updatedById',
              uiSchema: {
                type: 'object',
                title: '{{t("Last updated by")}}',
                'x-component': 'AssociationField',
                'x-component-props': {
                  fieldNames: {
                    value: 'id',
                    label: 'nickname',
                  },
                },
                'x-read-pretty': true,
              },
              targetKey: 'id',
            },
          ],
          category: [],
          logging: true,
          autoGenId: true,
          createdBy: true,
          updatedBy: true,
          createdAt: true,
          updatedAt: true,
          sortable: true,
          template: 'general',
          view: false,
        },
      ],
    });
  });
});
