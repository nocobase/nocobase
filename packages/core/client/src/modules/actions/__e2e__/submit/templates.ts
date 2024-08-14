/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const submitInReferenceTemplateBlock = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-app-version': '1.3.0-alpha',
    properties: {
      pn6az6sgoa3: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-app-version': '1.3.0-alpha',
        properties: {
          a5m6vnke9wi: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.3.0-alpha',
            properties: {
              '1szb6ti8889': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.3.0-alpha',
                properties: {
                  '1vk6705u3s2': {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'users:list',
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'users',
                      dataSource: 'main',
                      action: 'list',
                      params: {
                        pageSize: 20,
                      },
                      rowKey: 'id',
                      showIndex: true,
                      dragSort: false,
                    },
                    'x-toolbar': 'BlockSchemaToolbar',
                    'x-settings': 'blockSettings:table',
                    'x-component': 'CardItem',
                    'x-filter-targets': [],
                    'x-app-version': '1.3.0-alpha',
                    properties: {
                      actions: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-initializer': 'table:configureActions',
                        'x-component': 'ActionBar',
                        'x-component-props': {
                          style: {
                            marginBottom: 'var(--nb-spacing)',
                          },
                        },
                        'x-app-version': '1.3.0-alpha',
                        properties: {
                          rjb23i7wvwq: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            title: '{{ t("Refresh") }}',
                            'x-action': 'refresh',
                            'x-component': 'Action',
                            'x-use-component-props': 'useRefreshActionProps',
                            'x-toolbar': 'ActionSchemaToolbar',
                            'x-settings': 'actionSettings:refresh',
                            'x-component-props': {
                              icon: 'ReloadOutlined',
                            },
                            'x-align': 'right',
                            type: 'void',
                            'x-app-version': '1.3.0-alpha',
                            'x-uid': 's0to6e4p1sa',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': '78sufagvf3o',
                        'x-async': false,
                        'x-index': 1,
                      },
                      okzqqlrtzy8: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'array',
                        'x-initializer': 'table:configureColumns',
                        'x-component': 'TableV2',
                        'x-use-component-props': 'useTableBlockProps',
                        'x-component-props': {
                          rowKey: 'id',
                          rowSelection: {
                            type: 'checkbox',
                          },
                        },
                        'x-app-version': '1.3.0-alpha',
                        properties: {
                          actions: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            title: '{{ t("Actions") }}',
                            'x-action-column': 'actions',
                            'x-decorator': 'TableV2.Column.ActionBar',
                            'x-component': 'TableV2.Column',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-initializer': 'table:configureItemActions',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-toolbar-props': {
                              initializer: 'table:configureItemActions',
                            },
                            'x-app-version': '1.3.0-alpha',
                            properties: {
                              mj57vmkl9ay: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '1.3.0-alpha',
                                properties: {
                                  yztyjfhs0f3: {
                                    'x-uid': 'cj90bxcsxdc',
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{ t("View") }}',
                                    'x-action': 'view',
                                    'x-toolbar': 'ActionSchemaToolbar',
                                    'x-settings': 'actionSettings:view',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'page',
                                    },
                                    'x-action-context': {
                                      dataSource: 'main',
                                      collection: 'users',
                                    },
                                    'x-decorator': 'ACLActionProvider',
                                    'x-designer-props': {
                                      linkageAction: true,
                                    },
                                    properties: {
                                      drawer: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        title: '{{ t("View record") }}',
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
                                            'x-initializer': 'popup:addTab',
                                            properties: {
                                              tab1: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                title: '{{t("Details")}}',
                                                'x-component': 'Tabs.TabPane',
                                                'x-designer': 'Tabs.Designer',
                                                'x-component-props': {},
                                                properties: {
                                                  grid: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid',
                                                    'x-initializer': 'popup:common:addBlock',
                                                    properties: {
                                                      ha4brxza98n: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '1.3.0-alpha',
                                                        properties: {
                                                          zgy18uuvr4q: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '1.3.0-alpha',
                                                            properties: {
                                                              iotj15b3sq5: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action': 'users:get',
                                                                'x-decorator': 'DetailsBlockProvider',
                                                                'x-use-decorator-props': 'useDetailsDecoratorProps',
                                                                'x-decorator-props': {
                                                                  dataSource: 'main',
                                                                  collection: 'users',
                                                                  readPretty: true,
                                                                  action: 'get',
                                                                },
                                                                'x-toolbar': 'BlockSchemaToolbar',
                                                                'x-settings': 'blockSettings:details',
                                                                'x-component': 'CardItem',
                                                                'x-app-version': '1.3.0-alpha',
                                                                properties: {
                                                                  skte3sq8ezs: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'Details',
                                                                    'x-read-pretty': true,
                                                                    'x-use-component-props': 'useDetailsProps',
                                                                    'x-app-version': '1.3.0-alpha',
                                                                    properties: {
                                                                      ig2k6qmlwwx: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-initializer': 'details:configureActions',
                                                                        'x-component': 'ActionBar',
                                                                        'x-component-props': {
                                                                          style: {
                                                                            marginBottom: 24,
                                                                          },
                                                                        },
                                                                        'x-app-version': '1.3.0-alpha',
                                                                        properties: {
                                                                          '576x0de8o63': {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            title: '{{ t("Edit") }}',
                                                                            'x-action': 'update',
                                                                            'x-toolbar': 'ActionSchemaToolbar',
                                                                            'x-settings': 'actionSettings:edit',
                                                                            'x-component': 'Action',
                                                                            'x-component-props': {
                                                                              openMode: 'drawer',
                                                                              icon: 'EditOutlined',
                                                                              type: 'primary',
                                                                            },
                                                                            'x-action-context': {
                                                                              dataSource: 'main',
                                                                              collection: 'users',
                                                                            },
                                                                            'x-decorator': 'ACLActionProvider',
                                                                            'x-app-version': '1.3.0-alpha',
                                                                            properties: {
                                                                              drawer: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                title: '{{ t("Edit record") }}',
                                                                                'x-component': 'Action.Container',
                                                                                'x-component-props': {
                                                                                  className: 'nb-action-popup',
                                                                                },
                                                                                'x-app-version': '1.3.0-alpha',
                                                                                properties: {
                                                                                  tabs: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'void',
                                                                                    'x-component': 'Tabs',
                                                                                    'x-component-props': {},
                                                                                    'x-initializer': 'popup:addTab',
                                                                                    'x-app-version': '1.3.0-alpha',
                                                                                    properties: {
                                                                                      tab1: {
                                                                                        _isJSONSchemaObject: true,
                                                                                        version: '2.0',
                                                                                        type: 'void',
                                                                                        title: '{{t("Edit")}}',
                                                                                        'x-component': 'Tabs.TabPane',
                                                                                        'x-designer': 'Tabs.Designer',
                                                                                        'x-component-props': {},
                                                                                        'x-app-version': '1.3.0-alpha',
                                                                                        properties: {
                                                                                          grid: {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            'x-component': 'Grid',
                                                                                            'x-initializer':
                                                                                              'popup:common:addBlock',
                                                                                            'x-app-version':
                                                                                              '1.3.0-alpha',
                                                                                            properties: {
                                                                                              '2p5rl8z8ihx': {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component':
                                                                                                  'Grid.Row',
                                                                                                'x-app-version':
                                                                                                  '1.3.0-alpha',
                                                                                                properties: {
                                                                                                  kuugc1kkyjh: {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Col',
                                                                                                    'x-app-version':
                                                                                                      '1.3.0-alpha',
                                                                                                    properties: {
                                                                                                      '93i7uyy8un8': {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'void',
                                                                                                        'x-acl-action-props':
                                                                                                          {
                                                                                                            skipScopeCheck:
                                                                                                              false,
                                                                                                          },
                                                                                                        'x-acl-action':
                                                                                                          'users:update',
                                                                                                        'x-decorator':
                                                                                                          'FormBlockProvider',
                                                                                                        'x-use-decorator-props':
                                                                                                          'useEditFormBlockDecoratorProps',
                                                                                                        'x-decorator-props':
                                                                                                          {
                                                                                                            action:
                                                                                                              'get',
                                                                                                            dataSource:
                                                                                                              'main',
                                                                                                            collection:
                                                                                                              'users',
                                                                                                          },
                                                                                                        'x-toolbar':
                                                                                                          'BlockSchemaToolbar',
                                                                                                        'x-settings':
                                                                                                          'blockSettings:editForm',
                                                                                                        'x-component':
                                                                                                          'CardItem',
                                                                                                        'x-template-key':
                                                                                                          'yq4ysqaj1hz',
                                                                                                        'x-app-version':
                                                                                                          '1.3.0-alpha',
                                                                                                        properties: {
                                                                                                          mmkepcbm11t: {
                                                                                                            _isJSONSchemaObject:
                                                                                                              true,
                                                                                                            version:
                                                                                                              '2.0',
                                                                                                            type: 'void',
                                                                                                            'x-component':
                                                                                                              'FormV2',
                                                                                                            'x-use-component-props':
                                                                                                              'useEditFormBlockProps',
                                                                                                            'x-app-version':
                                                                                                              '1.3.0-alpha',
                                                                                                            properties:
                                                                                                              {
                                                                                                                grid: {
                                                                                                                  _isJSONSchemaObject:
                                                                                                                    true,
                                                                                                                  version:
                                                                                                                    '2.0',
                                                                                                                  type: 'void',
                                                                                                                  'x-component':
                                                                                                                    'BlockTemplate',
                                                                                                                  'x-component-props':
                                                                                                                    {
                                                                                                                      templateId:
                                                                                                                        'yq4ysqaj1hz',
                                                                                                                    },
                                                                                                                  'x-app-version':
                                                                                                                    '1.3.0-alpha',
                                                                                                                  'x-uid':
                                                                                                                    'y5h2vl04tia',
                                                                                                                  'x-async':
                                                                                                                    false,
                                                                                                                  'x-index': 1,
                                                                                                                },
                                                                                                                to0ss5zkqy7:
                                                                                                                  {
                                                                                                                    _isJSONSchemaObject:
                                                                                                                      true,
                                                                                                                    version:
                                                                                                                      '2.0',
                                                                                                                    type: 'void',
                                                                                                                    'x-initializer':
                                                                                                                      'editForm:configureActions',
                                                                                                                    'x-component':
                                                                                                                      'ActionBar',
                                                                                                                    'x-component-props':
                                                                                                                      {
                                                                                                                        layout:
                                                                                                                          'one-column',
                                                                                                                      },
                                                                                                                    'x-app-version':
                                                                                                                      '1.3.0-alpha',
                                                                                                                    properties:
                                                                                                                      {
                                                                                                                        '1vd53jrlonf':
                                                                                                                          {
                                                                                                                            _isJSONSchemaObject:
                                                                                                                              true,
                                                                                                                            version:
                                                                                                                              '2.0',
                                                                                                                            title:
                                                                                                                              '{{ t("Submit") }}',
                                                                                                                            'x-action':
                                                                                                                              'submit',
                                                                                                                            'x-component':
                                                                                                                              'Action',
                                                                                                                            'x-use-component-props':
                                                                                                                              'useUpdateActionProps',
                                                                                                                            'x-toolbar':
                                                                                                                              'ActionSchemaToolbar',
                                                                                                                            'x-settings':
                                                                                                                              'actionSettings:updateSubmit',
                                                                                                                            'x-component-props':
                                                                                                                              {
                                                                                                                                type: 'primary',
                                                                                                                                htmlType:
                                                                                                                                  'submit',
                                                                                                                              },
                                                                                                                            'x-action-settings':
                                                                                                                              {
                                                                                                                                triggerWorkflows:
                                                                                                                                  [],
                                                                                                                              },
                                                                                                                            type: 'void',
                                                                                                                            'x-app-version':
                                                                                                                              '1.3.0-alpha',
                                                                                                                            'x-uid':
                                                                                                                              '5joxsrvq453',
                                                                                                                            'x-async':
                                                                                                                              false,
                                                                                                                            'x-index': 1,
                                                                                                                          },
                                                                                                                      },
                                                                                                                    'x-uid':
                                                                                                                      '7ja6in5xnn3',
                                                                                                                    'x-async':
                                                                                                                      false,
                                                                                                                    'x-index': 2,
                                                                                                                  },
                                                                                                              },
                                                                                                            'x-uid':
                                                                                                              'uhgm3tm7iwm',
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                            'x-index': 1,
                                                                                                          },
                                                                                                        },
                                                                                                        'x-uid':
                                                                                                          'tyarx8cudp0',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      '1cx7ucmip6t',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'l8pqv0pwvnq',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'zc0xw6qahno',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': '7wp74ftgy65',
                                                                                        'x-async': false,
                                                                                        'x-index': 1,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': '9s6p18ufncq',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'g8rvdu6f9c2',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': '1wol0dtsvok',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'p975q17aoeh',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                      grid: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid',
                                                                        'x-initializer': 'details:configureFields',
                                                                        'x-app-version': '1.3.0-alpha',
                                                                        properties: {
                                                                          rud6eleuk20: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            'x-app-version': '1.3.0-alpha',
                                                                            properties: {
                                                                              stx6jg9025t: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                'x-app-version': '1.3.0-alpha',
                                                                                properties: {
                                                                                  nickname: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-toolbar':
                                                                                      'FormItemSchemaToolbar',
                                                                                    'x-settings':
                                                                                      'fieldSettings:FormItem',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field':
                                                                                      'users.nickname',
                                                                                    'x-component-props': {},
                                                                                    'x-app-version': '1.3.0-alpha',
                                                                                    'x-uid': 'hx18y505cn6',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'h08yoeaksel',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': '0wa2ul01brx',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'jcit9q1i9ej',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': 'pgat6rb09k8',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': 'nbi72tiafgu',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'ogsi2xvjrh6',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'cq651mdyl60',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'vunbycow3j7',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'l3ftqp5x7m9',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'sror6fdxe4d',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'sqdqmc80vw5',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'r618ammh3gi',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '5v7yshk5djr',
                            'x-async': false,
                            'x-index': 1,
                          },
                          me1tqtxuugm: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '1.3.0-alpha',
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
                                'x-app-version': '1.3.0-alpha',
                                'x-uid': '5fnmnqdwhug',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '9dwnj08b3wt',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': '93bzvzbwcek',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'gcpfo2olm8p',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 's0xyyopdw9o',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': '0ua5nsp24vf',
            'x-async': false,
            'x-index': 1,
          },
          ch7eitblj5c: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.3.0-alpha',
            properties: {
              '0gkeabyq3n2': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.3.0-alpha',
                properties: {
                  h34woc3f7qx: {
                    'x-uid': 'i6dnz1o7t73',
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
                    'x-app-version': '1.3.0-alpha',
                    'x-template-key': null,
                    properties: {
                      rhe0a2kwnhv: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'FormV2',
                        'x-use-component-props': 'useCreateFormBlockProps',
                        'x-app-version': '1.3.0-alpha',
                        properties: {
                          '4zl9n3wygwe': {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'form:configureFields',
                            'x-app-version': '1.3.0-alpha',
                            'x-index': 1,
                            properties: {
                              ip6sn34wpvd: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                'x-app-version': '1.3.0-alpha',
                                'x-index': 1,
                                properties: {
                                  wxt0jt4x52j: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
                                    'x-app-version': '1.3.0-alpha',
                                    'x-index': 1,
                                    properties: {
                                      nickname: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'string',
                                        'x-toolbar': 'FormItemSchemaToolbar',
                                        'x-settings': 'fieldSettings:FormItem',
                                        'x-component': 'CollectionField',
                                        'x-decorator': 'FormItem',
                                        'x-collection-field': 'users.nickname',
                                        'x-component-props': {},
                                        'x-app-version': '1.3.0-alpha',
                                        'x-index': 1,
                                        'x-uid': 'e3vl8lzzd81',
                                        'x-async': false,
                                      },
                                    },
                                    'x-uid': 'ekyrgrf7q7q',
                                    'x-async': false,
                                  },
                                },
                                'x-uid': 'iidbzdnpwf6',
                                'x-async': false,
                              },
                            },
                            'x-uid': '4zl9n3wygwe',
                            'x-async': false,
                          },
                          k9mim87mh6l: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-initializer': 'createForm:configureActions',
                            'x-component': 'ActionBar',
                            'x-component-props': {
                              layout: 'one-column',
                            },
                            'x-app-version': '1.3.0-alpha',
                            properties: {
                              '4olp62rjfyo': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                title: '{{ t("Submit") }}',
                                'x-action': 'submit',
                                'x-component': 'Action',
                                'x-use-component-props': 'useCreateActionProps',
                                'x-toolbar': 'ActionSchemaToolbar',
                                'x-settings': 'actionSettings:createSubmit',
                                'x-component-props': {
                                  type: 'primary',
                                  htmlType: 'submit',
                                },
                                'x-action-settings': {
                                  triggerWorkflows: [],
                                },
                                type: 'void',
                                'x-app-version': '1.3.0-alpha',
                                'x-uid': 'tccojmxbn7g',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'dxd58xvfgif',
                            'x-async': false,
                            'x-index': 4,
                          },
                        },
                        'x-uid': 'd314ar3jccb',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'rb4wuon22lv',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': '6vwj8np1px2',
            'x-async': false,
            'x-index': 2,
          },
        },
        'x-uid': '78dw3qmx1rf',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'a3795i5nlgf',
    'x-async': true,
    'x-index': 1,
  },
};
