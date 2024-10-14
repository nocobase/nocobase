/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PageConfig } from '@nocobase/test/e2e';

export const submitInReferenceTemplateBlock: PageConfig = {
  collections: [
    {
      name: 'collection',
      fields: [
        {
          name: 'nickname',
          title: 'Nickname',
          interface: 'input',
        },
      ],
    },
  ],
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
                    'x-acl-action': 'collection:list',
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'collection',
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
                                      collection: 'collection',
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
                                                                'x-acl-action': 'collection:get',
                                                                'x-decorator': 'DetailsBlockProvider',
                                                                'x-use-decorator-props': 'useDetailsDecoratorProps',
                                                                'x-decorator-props': {
                                                                  dataSource: 'main',
                                                                  collection: 'collection',
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
                                                                              collection: 'collection',
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
                                                                                                          'collection:update',
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
                                                                                                              'collection',
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
                                                                                      'collection.nickname',
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
                                'x-collection-field': 'collection.nickname',
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
                    'x-acl-action': 'collection:create',
                    'x-decorator': 'FormBlockProvider',
                    'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
                    'x-decorator-props': {
                      dataSource: 'main',
                      collection: 'collection',
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
                                        'x-collection-field': 'collection.nickname',
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
export const shouldRefreshDataWhenSubpageIsClosedByPageMenu = {
  collections: [
    {
      name: 'testRefresh',
      fields: [
        {
          name: 'name',
          interface: 'input',
        },
      ],
    },
  ],
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      f60xwf8ufc1: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          c383hu4oxba: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.3.25-beta',
            properties: {
              igrzb8z8p47: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.3.25-beta',
                properties: {
                  czd5rlqiiug: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'testRefresh:list',
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'testRefresh',
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
                    'x-app-version': '1.3.25-beta',
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
                        'x-app-version': '1.3.25-beta',
                        'x-uid': 'u883ena2rat',
                        'x-async': false,
                        'x-index': 1,
                      },
                      '0s7l6sopxd1': {
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
                        'x-app-version': '1.3.25-beta',
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
                            'x-app-version': '1.3.25-beta',
                            properties: {
                              jxbi8tufxur: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '1.3.25-beta',
                                properties: {
                                  '5ip8j17sa1q': {
                                    'x-uid': 'tmlwp0igqn3',
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{ t("Edit") }}',
                                    'x-action': 'update',
                                    'x-toolbar': 'ActionSchemaToolbar',
                                    'x-settings': 'actionSettings:edit',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'page',
                                      icon: 'EditOutlined',
                                    },
                                    'x-action-context': {
                                      dataSource: 'main',
                                      collection: 'testRefresh',
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
                                        title: '{{ t("Edit record") }}',
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
                                                title: '{{t("Edit")}}',
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
                                                      a5o0u6ic4zi: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '1.3.25-beta',
                                                        properties: {
                                                          o94fslh753r: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '1.3.25-beta',
                                                            properties: {
                                                              bxmjip1l3zo: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-decorator': 'TableBlockProvider',
                                                                'x-acl-action': 'testRefresh:list',
                                                                'x-use-decorator-props': 'useTableBlockDecoratorProps',
                                                                'x-decorator-props': {
                                                                  collection: 'testRefresh',
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
                                                                'x-app-version': '1.3.25-beta',
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
                                                                    'x-app-version': '1.3.25-beta',
                                                                    'x-uid': 'cbina6hzuul',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                  nol8niatans: {
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
                                                                    'x-app-version': '1.3.25-beta',
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
                                                                        'x-app-version': '1.3.25-beta',
                                                                        properties: {
                                                                          l3z75xol1mi: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-decorator': 'DndContext',
                                                                            'x-component': 'Space',
                                                                            'x-component-props': {
                                                                              split: '|',
                                                                            },
                                                                            'x-app-version': '1.3.25-beta',
                                                                            properties: {
                                                                              ls8c2cy2m89: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                title: '{{ t("Edit") }}',
                                                                                'x-action': 'update',
                                                                                'x-toolbar': 'ActionSchemaToolbar',
                                                                                'x-settings': 'actionSettings:edit',
                                                                                'x-component': 'Action.Link',
                                                                                'x-component-props': {
                                                                                  openMode: 'drawer',
                                                                                  icon: 'EditOutlined',
                                                                                },
                                                                                'x-action-context': {
                                                                                  dataSource: 'main',
                                                                                  collection: 'testRefresh',
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
                                                                                    title: '{{ t("Edit record") }}',
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
                                                                                            title: '{{t("Edit")}}',
                                                                                            'x-component':
                                                                                              'Tabs.TabPane',
                                                                                            'x-designer':
                                                                                              'Tabs.Designer',
                                                                                            'x-component-props': {},
                                                                                            properties: {
                                                                                              grid: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component': 'Grid',
                                                                                                'x-initializer':
                                                                                                  'popup:common:addBlock',
                                                                                                properties: {
                                                                                                  c8inwkebx1a: {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Row',
                                                                                                    'x-app-version':
                                                                                                      '1.3.25-beta',
                                                                                                    properties: {
                                                                                                      a5gbhpfx4ay: {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'void',
                                                                                                        'x-component':
                                                                                                          'Grid.Col',
                                                                                                        'x-app-version':
                                                                                                          '1.3.25-beta',
                                                                                                        properties: {
                                                                                                          hekz785yebu: {
                                                                                                            _isJSONSchemaObject:
                                                                                                              true,
                                                                                                            version:
                                                                                                              '2.0',
                                                                                                            type: 'void',
                                                                                                            'x-acl-action-props':
                                                                                                              {
                                                                                                                skipScopeCheck:
                                                                                                                  false,
                                                                                                              },
                                                                                                            'x-acl-action':
                                                                                                              'testRefresh:update',
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
                                                                                                                  'testRefresh',
                                                                                                              },
                                                                                                            'x-toolbar':
                                                                                                              'BlockSchemaToolbar',
                                                                                                            'x-settings':
                                                                                                              'blockSettings:editForm',
                                                                                                            'x-component':
                                                                                                              'CardItem',
                                                                                                            'x-app-version':
                                                                                                              '1.3.25-beta',
                                                                                                            properties:
                                                                                                              {
                                                                                                                '1r799t325wo':
                                                                                                                  {
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
                                                                                                                      '1.3.25-beta',
                                                                                                                    properties:
                                                                                                                      {
                                                                                                                        grid: {
                                                                                                                          _isJSONSchemaObject:
                                                                                                                            true,
                                                                                                                          version:
                                                                                                                            '2.0',
                                                                                                                          type: 'void',
                                                                                                                          'x-component':
                                                                                                                            'Grid',
                                                                                                                          'x-initializer':
                                                                                                                            'form:configureFields',
                                                                                                                          'x-app-version':
                                                                                                                            '1.3.25-beta',
                                                                                                                          properties:
                                                                                                                            {
                                                                                                                              w7mpjt5r510:
                                                                                                                                {
                                                                                                                                  _isJSONSchemaObject:
                                                                                                                                    true,
                                                                                                                                  version:
                                                                                                                                    '2.0',
                                                                                                                                  type: 'void',
                                                                                                                                  'x-component':
                                                                                                                                    'Grid.Row',
                                                                                                                                  'x-app-version':
                                                                                                                                    '1.3.25-beta',
                                                                                                                                  properties:
                                                                                                                                    {
                                                                                                                                      '1tncur8pho6':
                                                                                                                                        {
                                                                                                                                          _isJSONSchemaObject:
                                                                                                                                            true,
                                                                                                                                          version:
                                                                                                                                            '2.0',
                                                                                                                                          type: 'void',
                                                                                                                                          'x-component':
                                                                                                                                            'Grid.Col',
                                                                                                                                          'x-app-version':
                                                                                                                                            '1.3.25-beta',
                                                                                                                                          properties:
                                                                                                                                            {
                                                                                                                                              name: {
                                                                                                                                                _isJSONSchemaObject:
                                                                                                                                                  true,
                                                                                                                                                version:
                                                                                                                                                  '2.0',
                                                                                                                                                type: 'string',
                                                                                                                                                'x-toolbar':
                                                                                                                                                  'FormItemSchemaToolbar',
                                                                                                                                                'x-settings':
                                                                                                                                                  'fieldSettings:FormItem',
                                                                                                                                                'x-component':
                                                                                                                                                  'CollectionField',
                                                                                                                                                'x-decorator':
                                                                                                                                                  'FormItem',
                                                                                                                                                'x-collection-field':
                                                                                                                                                  'testRefresh.name',
                                                                                                                                                'x-component-props':
                                                                                                                                                  {},
                                                                                                                                                'x-app-version':
                                                                                                                                                  '1.3.25-beta',
                                                                                                                                                'x-uid':
                                                                                                                                                  'w2b29tftqa5',
                                                                                                                                                'x-async':
                                                                                                                                                  false,
                                                                                                                                                'x-index': 1,
                                                                                                                                              },
                                                                                                                                            },
                                                                                                                                          'x-uid':
                                                                                                                                            'vmqxwcj1sah',
                                                                                                                                          'x-async':
                                                                                                                                            false,
                                                                                                                                          'x-index': 1,
                                                                                                                                        },
                                                                                                                                    },
                                                                                                                                  'x-uid':
                                                                                                                                    'jx174p4aj50',
                                                                                                                                  'x-async':
                                                                                                                                    false,
                                                                                                                                  'x-index': 1,
                                                                                                                                },
                                                                                                                            },
                                                                                                                          'x-uid':
                                                                                                                            'nnf7799bh1o',
                                                                                                                          'x-async':
                                                                                                                            false,
                                                                                                                          'x-index': 1,
                                                                                                                        },
                                                                                                                        w12hok3wqww:
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
                                                                                                                              '1.3.25-beta',
                                                                                                                            properties:
                                                                                                                              {
                                                                                                                                tpy6isposk0:
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
                                                                                                                                      '1.3.25-beta',
                                                                                                                                    'x-uid':
                                                                                                                                      'witfr2ignds',
                                                                                                                                    'x-async':
                                                                                                                                      false,
                                                                                                                                    'x-index': 1,
                                                                                                                                  },
                                                                                                                              },
                                                                                                                            'x-uid':
                                                                                                                              '95h3woyegid',
                                                                                                                            'x-async':
                                                                                                                              false,
                                                                                                                            'x-index': 2,
                                                                                                                          },
                                                                                                                      },
                                                                                                                    'x-uid':
                                                                                                                      'jz4pvx7vdyn',
                                                                                                                    'x-async':
                                                                                                                      false,
                                                                                                                    'x-index': 1,
                                                                                                                  },
                                                                                                              },
                                                                                                            'x-uid':
                                                                                                              'w9r4yyxzwo2',
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                            'x-index': 1,
                                                                                                          },
                                                                                                        },
                                                                                                        'x-uid':
                                                                                                          'n94upy7yd47',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'bvg41neww0r',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'z459apnn13m',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': '2t3sx3nedi1',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': '88zf1r5n5ej',
                                                                                        'x-async': false,
                                                                                        'x-index': 1,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': 't3xqeq01rdj',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'c1i3hb0bu0f',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'fbgaaj9td5t',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'dhdum7zv2wv',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                    },
                                                                    'x-uid': 'vl8ub53ikv4',
                                                                    'x-async': false,
                                                                    'x-index': 2,
                                                                  },
                                                                },
                                                                'x-uid': 'rzmt46s0nfk',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': '7ywukcy6ce7',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'u1914umcr4j',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'cvv09ko8h3e',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'o06ez3hp081',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'dhdv3671m57',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'u1ero8piyk0',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'nonwnta1tpk',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '46nco16r81v',
                            'x-async': false,
                            'x-index': 1,
                          },
                          bpfpuc2t2tw: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '1.3.25-beta',
                            properties: {
                              name: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'testRefresh.name',
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
                                'x-app-version': '1.3.25-beta',
                                'x-uid': '0dq29e4kbly',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'l1df5slauzp',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': '6ydl9ber22f',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'xczcehxr2m5',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'hwa7l2ppe6l',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': '54nsmh38l7k',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'tcwxtcalzkm',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': '5g1v6hmn04q',
    'x-async': true,
    'x-index': 1,
  },
};

export const createFormSubmit = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-app-version': '1.4.0-alpha',
    properties: {
      c9ar217262w: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-app-version': '1.4.0-alpha',
        properties: {
          '943651fwz8t': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.4.0-alpha',
            properties: {
              g9fq98c2s4n: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.4.0-alpha',
                properties: {
                  '4d3afoagc5g': {
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
                    'x-app-version': '1.4.0-alpha',
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
                        'x-app-version': '1.4.0-alpha',
                        properties: {
                          afp94e3l423: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-action': 'create',
                            'x-acl-action': 'create',
                            title: "{{t('Add new')}}",
                            'x-toolbar': 'ActionSchemaToolbar',
                            'x-settings': 'actionSettings:addNew',
                            'x-component': 'Action',
                            'x-decorator': 'ACLActionProvider',
                            'x-component-props': {
                              openMode: 'drawer',
                              type: 'primary',
                              component: 'CreateRecordAction',
                              icon: 'PlusOutlined',
                            },
                            'x-action-context': {
                              dataSource: 'main',
                              collection: 'users',
                            },
                            'x-align': 'right',
                            'x-acl-action-props': {
                              skipScopeCheck: true,
                            },
                            'x-app-version': '1.4.0-alpha',
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
                                'x-app-version': '1.4.0-alpha',
                                properties: {
                                  tabs: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Tabs',
                                    'x-component-props': {},
                                    'x-initializer': 'popup:addTab',
                                    'x-initializer-props': {
                                      gridInitializer: 'popup:addNew:addBlock',
                                    },
                                    'x-app-version': '1.4.0-alpha',
                                    properties: {
                                      tab1: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        title: '{{t("Add new")}}',
                                        'x-component': 'Tabs.TabPane',
                                        'x-designer': 'Tabs.Designer',
                                        'x-component-props': {},
                                        'x-app-version': '1.4.0-alpha',
                                        properties: {
                                          grid: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Grid',
                                            'x-initializer': 'popup:addNew:addBlock',
                                            'x-app-version': '1.4.0-alpha',
                                            properties: {
                                              umjudxvb3ri: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid.Row',
                                                'x-app-version': '1.4.0-alpha',
                                                properties: {
                                                  to6yrk48a1e: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid.Col',
                                                    'x-app-version': '1.4.0-alpha',
                                                    properties: {
                                                      zfuiyepfpo8: {
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
                                                        'x-app-version': '1.4.0-alpha',
                                                        properties: {
                                                          '67zq3yb6rg0': {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'FormV2',
                                                            'x-use-component-props': 'useCreateFormBlockProps',
                                                            'x-app-version': '1.4.0-alpha',
                                                            properties: {
                                                              grid: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-component': 'Grid',
                                                                'x-initializer': 'form:configureFields',
                                                                'x-app-version': '1.4.0-alpha',
                                                                'x-uid': 'tyztr48d01m',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                              '1cslc0bzwan': {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-initializer': 'createForm:configureActions',
                                                                'x-component': 'ActionBar',
                                                                'x-component-props': {
                                                                  layout: 'one-column',
                                                                },
                                                                'x-app-version': '1.4.0-alpha',
                                                                properties: {
                                                                  rjfxzva092d: {
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
                                                                    'x-app-version': '1.4.0-alpha',
                                                                    'x-uid': 'jpbq9zyexb9',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': 'xsv37mjii6o',
                                                                'x-async': false,
                                                                'x-index': 2,
                                                              },
                                                            },
                                                            'x-uid': '2j67lyyth1f',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'zcli14m52d6',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': '63hxohd7td3',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'm6uu6mtlopn',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'x5nqkk6whbz',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'kaxuorp0kwz',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'qka0657zo5s',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': '857bxboz38t',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'qxh2sf5itxw',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': '3nsvi44j20t',
                        'x-async': false,
                        'x-index': 1,
                      },
                      bk1pbg52rcs: {
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
                        'x-app-version': '1.4.0-alpha',
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
                            'x-app-version': '1.4.0-alpha',
                            properties: {
                              '9tql6edotky': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '1.4.0-alpha',
                                'x-uid': 'zrlg6n04kd0',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'uv7q2tnh9mc',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'g76idw88ik8',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'h0mnhu6ihsd',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '3xdo6vt2c07',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'et8gznfo7r7',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': '18w03j8qcv6',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'qvl1ar53zpz',
    'x-async': true,
    'x-index': 1,
  },
};
