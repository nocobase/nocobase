/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const tableViewLinkageRulesVariables = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      g1wycipht9k: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          '7i8pwd4xhj5': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '0.21.0-alpha.8',
            properties: {
              pblvpmq357i: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '0.21.0-alpha.8',
                properties: {
                  dwwc54m8ky1: {
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
                    'x-app-version': '0.21.0-alpha.8',
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
                        'x-app-version': '0.21.0-alpha.8',
                        'x-uid': 'dwfejl3y35l',
                        'x-async': false,
                        'x-index': 1,
                      },
                      b0gp5kve5cy: {
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
                        'x-app-version': '0.21.0-alpha.8',
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
                            'x-initializer': 'table:configureItemActions',
                            'x-app-version': '0.21.0-alpha.8',
                            properties: {
                              tf980vw8dg7: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '0.21.0-alpha.8',
                                properties: {
                                  dmpqsodnxr6: {
                                    'x-uid': 'vivhb5goy37',
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{ t("View") }}',
                                    'x-action': 'view',
                                    'x-toolbar': 'ActionSchemaToolbar',
                                    'x-settings': 'actionSettings:view',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'drawer',
                                    },
                                    'x-decorator': 'ACLActionProvider',
                                    'x-designer-props': {
                                      linkageAction: true,
                                    },
                                    'x-linkage-rules': [
                                      {
                                        condition: {
                                          $and: [{}],
                                        },
                                        actions: [],
                                      },
                                    ],
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
                                                    'x-uid': '8mxgjwcq1lu',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': '9fbdmfbk67y',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'dn6hvykic0s',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'czk4w54afwy',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': '3hbqk34vlxs',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'fptg47gw3v0',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'r6rocjxtxwr',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'gy0al0nl08m',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '2vkcx6nt5y0',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': '2zeeh485ev6',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'ckrzeha5h5t',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'qnwmpeqykgx',
    'x-async': true,
    'x-index': 1,
  },
};
export const APIToken = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      r28kx8924cy: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          kegw9lkmsko: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.2.12-alpha',
            properties: {
              hcz0lcfp2r6: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.2.12-alpha',
                properties: {
                  zjkxyalwtcd: {
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
                    'x-app-version': '1.2.12-alpha',
                    properties: {
                      '2slb70mzs8l': {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'FormV2',
                        'x-use-component-props': 'useCreateFormBlockProps',
                        'x-app-version': '1.2.12-alpha',
                        properties: {
                          grid: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'form:configureFields',
                            'x-app-version': '1.2.12-alpha',
                            properties: {
                              '69ap338gq78': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                'x-app-version': '1.2.12-alpha',
                                properties: {
                                  hmhzxyuiifs: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
                                    'x-app-version': '1.2.12-alpha',
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
                                        'x-app-version': '1.2.12-alpha',
                                        'x-uid': 'jcfpjom4noq',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': '80ukdxgyeqb',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'c9pt8v2kl0v',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'dmnhyyaodkk',
                            'x-async': false,
                            'x-index': 1,
                          },
                          mblb6m9xrkf: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-initializer': 'createForm:configureActions',
                            'x-component': 'ActionBar',
                            'x-component-props': {
                              layout: 'one-column',
                            },
                            'x-app-version': '1.2.12-alpha',
                            'x-uid': 'a9607zzwsqi',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'vgoxgrp2txi',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'qs79h7guar7',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'wsngjdocbsr',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'je25ukg8n1g',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'j5m7s1k5a6d',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': '4kh00y276rq',
    'x-async': true,
    'x-index': 1,
  },
};
export const T4874 = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-app-version': '1.2.21-alpha',
    properties: {
      d5btnu6z239: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-app-version': '1.2.21-alpha',
        properties: {
          dqmrwgx3h5j: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.2.21-alpha',
            properties: {
              '3q6wd3o9ve3': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.2.21-alpha',
                properties: {
                  '1mw2svlh1t4': {
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
                    'x-app-version': '1.2.21-alpha',
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
                        'x-app-version': '1.2.21-alpha',
                        'x-uid': '66gj8p6hj5f',
                        'x-async': false,
                        'x-index': 1,
                      },
                      no5z0g08zmh: {
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
                        'x-app-version': '1.2.21-alpha',
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
                            'x-app-version': '1.2.21-alpha',
                            properties: {
                              '07oxu98m060': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '1.2.21-alpha',
                                properties: {
                                  '40ond6gt5sp': {
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
                                                      xv1rqhlertx: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '1.2.21-alpha',
                                                        properties: {
                                                          j7nzjmqyrt6: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '1.2.21-alpha',
                                                            properties: {
                                                              te5nblgjx91: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action-props': {
                                                                  skipScopeCheck: false,
                                                                },
                                                                'x-acl-action': 'users:update',
                                                                'x-decorator': 'FormBlockProvider',
                                                                'x-use-decorator-props':
                                                                  'useEditFormBlockDecoratorProps',
                                                                'x-decorator-props': {
                                                                  action: 'get',
                                                                  dataSource: 'main',
                                                                  collection: 'users',
                                                                },
                                                                'x-toolbar': 'BlockSchemaToolbar',
                                                                'x-settings': 'blockSettings:editForm',
                                                                'x-component': 'CardItem',
                                                                'x-app-version': '1.2.21-alpha',
                                                                properties: {
                                                                  '1c7o18qoag1': {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'FormV2',
                                                                    'x-use-component-props': 'useEditFormBlockProps',
                                                                    'x-app-version': '1.2.21-alpha',
                                                                    properties: {
                                                                      grid: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid',
                                                                        'x-initializer': 'form:configureFields',
                                                                        'x-app-version': '1.2.21-alpha',
                                                                        properties: {
                                                                          '2k2z18gbdoy': {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            'x-app-version': '1.2.21-alpha',
                                                                            properties: {
                                                                              c607566i7l3: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                'x-app-version': '1.2.21-alpha',
                                                                                properties: {
                                                                                  roles: {
                                                                                    'x-uid': 'nz02ten5fzf',
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-toolbar':
                                                                                      'FormItemSchemaToolbar',
                                                                                    'x-settings':
                                                                                      'fieldSettings:FormItem',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field': 'users.roles',
                                                                                    'x-component-props': {
                                                                                      fieldNames: {
                                                                                        label: 'name',
                                                                                        value: 'name',
                                                                                      },
                                                                                      mode: 'SubTable',
                                                                                    },
                                                                                    'x-app-version': '1.2.21-alpha',
                                                                                    properties: {
                                                                                      fj6qv4odhaa: {
                                                                                        _isJSONSchemaObject: true,
                                                                                        version: '2.0',
                                                                                        type: 'void',
                                                                                        'x-component':
                                                                                          'AssociationField.SubTable',
                                                                                        'x-initializer':
                                                                                          'table:configureColumns',
                                                                                        'x-initializer-props': {
                                                                                          action: false,
                                                                                        },
                                                                                        'x-index': 1,
                                                                                        'x-app-version': '1.2.21-alpha',
                                                                                        properties: {
                                                                                          '5j2fwrcfzuu': {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            'x-decorator':
                                                                                              'TableV2.Column.Decorator',
                                                                                            'x-toolbar':
                                                                                              'TableColumnSchemaToolbar',
                                                                                            'x-settings':
                                                                                              'fieldSettings:TableColumn',
                                                                                            'x-component':
                                                                                              'TableV2.Column',
                                                                                            'x-app-version':
                                                                                              '1.2.21-alpha',
                                                                                            properties: {
                                                                                              title: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                'x-collection-field':
                                                                                                  'roles.title',
                                                                                                'x-component':
                                                                                                  'CollectionField',
                                                                                                'x-component-props': {
                                                                                                  ellipsis: true,
                                                                                                },
                                                                                                'x-decorator':
                                                                                                  'FormItem',
                                                                                                'x-decorator-props': {
                                                                                                  labelStyle: {
                                                                                                    display: 'none',
                                                                                                  },
                                                                                                },
                                                                                                'x-app-version':
                                                                                                  '1.2.21-alpha',
                                                                                                'x-uid': '6hnbfgke4v9',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'xrfnjtprhgk',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                          nm5lqvmdmol: {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            'x-decorator':
                                                                                              'TableV2.Column.Decorator',
                                                                                            'x-toolbar':
                                                                                              'TableColumnSchemaToolbar',
                                                                                            'x-settings':
                                                                                              'fieldSettings:TableColumn',
                                                                                            'x-component':
                                                                                              'TableV2.Column',
                                                                                            'x-app-version':
                                                                                              '1.2.21-alpha',
                                                                                            properties: {
                                                                                              name: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                'x-collection-field':
                                                                                                  'roles.name',
                                                                                                'x-component':
                                                                                                  'CollectionField',
                                                                                                'x-component-props': {
                                                                                                  ellipsis: true,
                                                                                                },
                                                                                                'x-decorator':
                                                                                                  'FormItem',
                                                                                                'x-decorator-props': {
                                                                                                  labelStyle: {
                                                                                                    display: 'none',
                                                                                                  },
                                                                                                },
                                                                                                'x-app-version':
                                                                                                  '1.2.21-alpha',
                                                                                                'x-uid': 'nug7nu8ebhi',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': '0esgluhnedb',
                                                                                            'x-async': false,
                                                                                            'x-index': 2,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': 'xsx2rz70uwz',
                                                                                        'x-async': false,
                                                                                      },
                                                                                    },
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'r23ltwfb8by',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'tudt41ppj3p',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': '96z12k7x884',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                      qq4upukd8xf: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-initializer': 'editForm:configureActions',
                                                                        'x-component': 'ActionBar',
                                                                        'x-component-props': {
                                                                          layout: 'one-column',
                                                                        },
                                                                        'x-app-version': '1.2.21-alpha',
                                                                        'x-uid': 'wdmwmy60e2r',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': '33zsf8du7j2',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': 'vfpz90ab0qw',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'gujrsvgrmjj',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': '8xws8vfulhx',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'nl73uc805kr',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'izwg6n04xw3',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'p6wyw65zj1l',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': '7hlmuhqrtpk',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'yfxjokc1rxx',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'rriritgfmdw',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'liz6v1lau34',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'vh37l43zevq',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'wxsf1stb1oi',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'nnkwbb57n9f',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'dfonxd85q4n',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'uxb09qu50d0',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'kg5tkkrw3x4',
    'x-async': true,
    'x-index': 1,
  },
};
