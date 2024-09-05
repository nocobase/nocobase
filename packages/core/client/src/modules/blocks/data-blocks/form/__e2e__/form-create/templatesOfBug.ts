/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PageConfig, generalWithM2oSingleSelect, generalWithMultiLevelM2mFields } from '@nocobase/test/e2e';

export const T2165 = {
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
        'x-initializer': 'page:addBlock',
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
                            'x-initializer': 'form:configureFields',
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
                            'x-initializer': 'createForm:configureActions',
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

export const T2174 = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-index': 1,
    properties: {
      x9ersztdq7x: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-index': 1,
        properties: {
          ppgwx2drpng: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-index': 1,
            properties: {
              c25gfj884oe: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-index': 1,
                properties: {
                  urmc26btvb5: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'test2174:list',
                    'x-decorator-props': {
                      collection: 'test2174',
                      resource: 'test2174',
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
                    'x-index': 1,
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
                        'x-index': 1,
                        'x-uid': '7wfu81uqxox',
                        'x-async': false,
                      },
                      yxgybgmfhkp: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'array',
                        'x-initializer': 'table:configureColumns',
                        'x-component': 'TableV2',
                        'x-component-props': {
                          rowKey: 'id',
                          rowSelection: {
                            type: 'checkbox',
                          },
                          useProps: '{{ useTableBlockProps }}',
                        },
                        'x-index': 2,
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
                            'x-index': 1,
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
                                'x-index': 1,
                                properties: {
                                  r51kgwrhpgd: {
                                    'x-uid': 'udzm8hggmmb',
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: 'View details',
                                    'x-action': 'view',
                                    'x-designer': 'Action.Designer',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'drawer',
                                      danger: false,
                                    },
                                    'x-decorator': 'ACLActionProvider',
                                    'x-designer-props': {
                                      linkageAction: true,
                                    },
                                    'x-index': 1,
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
                                        'x-index': 1,
                                        properties: {
                                          tabs: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Tabs',
                                            'x-component-props': {},
                                            'x-initializer': 'TabPaneInitializers',
                                            'x-index': 1,
                                            properties: {
                                              tab1: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                title: '{{t("Details")}}',
                                                'x-component': 'Tabs.TabPane',
                                                'x-designer': 'Tabs.Designer',
                                                'x-component-props': {},
                                                'x-index': 1,
                                                properties: {
                                                  grid: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid',
                                                    'x-initializer': 'popup:common:addBlock',
                                                    'x-index': 1,
                                                    properties: {
                                                      g8w7wq09bgo: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-index': 1,
                                                        properties: {
                                                          '42t1ais26x8': {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-index': 1,
                                                            properties: {
                                                              zmq6hmh2i3a: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action-props': {
                                                                  skipScopeCheck: true,
                                                                },
                                                                'x-acl-action': 'test2174.f_q32e4ieq49n:create',
                                                                'x-decorator': 'FormBlockProvider',
                                                                'x-decorator-props': {
                                                                  useSourceId: '{{ useSourceIdFromParentRecord }}',
                                                                  useParams: '{{ useParamsFromRecord }}',
                                                                  action: null,
                                                                  resource: 'test2174.f_q32e4ieq49n',
                                                                  collection: 'test2174',
                                                                  association: 'test2174.f_q32e4ieq49n',
                                                                },
                                                                'x-designer': 'FormV2.Designer',
                                                                'x-component': 'CardItem',
                                                                'x-component-props': {},
                                                                'x-index': 1,
                                                                properties: {
                                                                  qii0gw1cb8e: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'FormV2',
                                                                    'x-component-props': {
                                                                      useProps: '{{ useFormBlockProps }}',
                                                                    },
                                                                    'x-index': 1,
                                                                    properties: {
                                                                      grid: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid',
                                                                        'x-initializer': 'form:configureFields',
                                                                        'x-index': 1,
                                                                        properties: {
                                                                          s3hhb0ohnv1: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            'x-index': 1,
                                                                            properties: {
                                                                              t2qtgv250s0: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                'x-index': 1,
                                                                                properties: {
                                                                                  singleSelect: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field':
                                                                                      'test2174.singleSelect',
                                                                                    'x-component-props': {
                                                                                      style: {
                                                                                        width: '100%',
                                                                                      },
                                                                                    },
                                                                                    'x-index': 1,
                                                                                    'x-uid': '75ls3qlq3kw',
                                                                                    'x-async': false,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'ndb8zhrxgq0',
                                                                                'x-async': false,
                                                                              },
                                                                            },
                                                                            'x-uid': '14q94mijyx4',
                                                                            'x-async': false,
                                                                          },
                                                                        },
                                                                        'x-uid': '6vfyrsrkw29',
                                                                        'x-async': false,
                                                                      },
                                                                      actions: {
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
                                                                        'x-index': 2,
                                                                        properties: {
                                                                          afuxokt3osc: {
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
                                                                            'x-index': 1,
                                                                            'x-uid': '6idd8u0fs5v',
                                                                            'x-async': false,
                                                                          },
                                                                        },
                                                                        'x-uid': '8xm66k2wcbq',
                                                                        'x-async': false,
                                                                      },
                                                                    },
                                                                    'x-uid': 'ia7qdocnj0k',
                                                                    'x-async': false,
                                                                  },
                                                                },
                                                                'x-uid': 'ai78ycshc04',
                                                                'x-async': false,
                                                              },
                                                            },
                                                            'x-uid': 'gipnqnxa7c7',
                                                            'x-async': false,
                                                          },
                                                        },
                                                        'x-uid': '4fztm3s6pqr',
                                                        'x-async': false,
                                                      },
                                                    },
                                                    'x-uid': 'yiwh3chdjzg',
                                                    'x-async': false,
                                                  },
                                                },
                                                'x-uid': 'mar9ww8zdd6',
                                                'x-async': false,
                                              },
                                            },
                                            'x-uid': '29brl1obftp',
                                            'x-async': false,
                                          },
                                        },
                                        'x-uid': 'r4qbds05tcz',
                                        'x-async': false,
                                      },
                                    },
                                    'x-async': false,
                                  },
                                },
                                'x-uid': 'hp7glbaipmc',
                                'x-async': false,
                              },
                            },
                            'x-uid': 'k9u1fta4jdq',
                            'x-async': false,
                          },
                          x6soi4xw3yn: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-designer': 'TableV2.Column.Designer',
                            'x-component': 'TableV2.Column',
                            'x-index': 2,
                            properties: {
                              singleSelect: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'test2174.singleSelect',
                                'x-component': 'CollectionField',
                                'x-component-props': {
                                  style: {
                                    width: '100%',
                                  },
                                  ellipsis: true,
                                },
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                default: 'np55dbbny0e',
                                'x-index': 1,
                                'x-uid': 'ots1wvv436n',
                                'x-async': false,
                              },
                            },
                            'x-uid': 'yx4mdriq3jp',
                            'x-async': false,
                          },
                          aoj0myt8kgn: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-designer': 'TableV2.Column.Designer',
                            'x-component': 'TableV2.Column',
                            'x-index': 3,
                            properties: {
                              f_q32e4ieq49n: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'test2174.f_q32e4ieq49n',
                                'x-component': 'CollectionField',
                                'x-component-props': {
                                  ellipsis: true,
                                  size: 'small',
                                  fieldNames: {
                                    label: 'singleSelect',
                                    value: 'id',
                                  },
                                },
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-index': 1,
                                properties: {
                                  ony7hpl5247: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{ t("View record") }}',
                                    'x-component': 'AssociationField.Viewer',
                                    'x-component-props': {
                                      className: 'nb-action-popup',
                                    },
                                    'x-index': 1,
                                    properties: {
                                      tabs: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        'x-component': 'Tabs',
                                        'x-component-props': {},
                                        'x-initializer': 'TabPaneInitializers',
                                        'x-index': 1,
                                        properties: {
                                          tab1: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            title: '{{t("Details")}}',
                                            'x-component': 'Tabs.TabPane',
                                            'x-designer': 'Tabs.Designer',
                                            'x-component-props': {},
                                            'x-index': 1,
                                            properties: {
                                              grid: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid',
                                                'x-initializer': 'popup:common:addBlock',
                                                'x-index': 1,
                                                'x-uid': 'roog7uz0d2o',
                                                'x-async': false,
                                              },
                                            },
                                            'x-uid': 'x05lq9x1n0n',
                                            'x-async': false,
                                          },
                                        },
                                        'x-uid': 'hrymp5hthg3',
                                        'x-async': false,
                                      },
                                    },
                                    'x-uid': 'ujkf9096qwq',
                                    'x-async': false,
                                  },
                                },
                                'x-uid': '02kpdjz33yd',
                                'x-async': false,
                              },
                            },
                            'x-uid': 'e366r5cz2cv',
                            'x-async': false,
                          },
                        },
                        'x-uid': 'wkdjjugn3l8',
                        'x-async': false,
                      },
                    },
                    'x-uid': 'n3f07077krt',
                    'x-async': false,
                  },
                },
                'x-uid': 'i920mrykzkp',
                'x-async': false,
              },
            },
            'x-uid': '8a5n45kb55h',
            'x-async': false,
          },
        },
        'x-uid': 'wcobb00rn5y',
        'x-async': false,
      },
    },
    'x-uid': 'pfr9jap0zsf',
    'x-async': true,
  },
  collections: [
    {
      name: 'test2174',
      title: 'Test',
      fields: [
        {
          name: 'f_lkqy3eh4ag7',
          interface: 'integer',
          isForeignKey: true,
          uiSchema: {
            type: 'number',
            title: 'f_lkqy3eh4ag7',
            'x-component': 'InputNumber',
            'x-read-pretty': true,
          },
        },
        {
          name: 'f_rathx54cqpy',
          interface: 'integer',
          isForeignKey: true,
          uiSchema: {
            type: 'number',
            title: 'f_rathx54cqpy',
            'x-component': 'InputNumber',
            'x-read-pretty': true,
          },
        },
        {
          name: 'singleSelect',
          interface: 'select',
          uiSchema: {
            enum: [
              {
                value: 'np55dbbny0e',
                label: 'option1',
              },
              {
                value: 'zxteco8rjfc',
                label: 'option2',
              },
              {
                value: 'p7pi40zd91q',
                label: 'option3',
              },
            ],
            type: 'string',
            'x-component': 'Select',
            title: 'Single select',
          },
        },
        {
          name: 'f_q32e4ieq49n',
          interface: 'o2m',
          foreignKey: 'f_rathx54cqpy',
          uiSchema: {
            'x-component': 'AssociationField',
            'x-component-props': {
              multiple: true,
              fieldNames: {
                label: 'id',
                value: 'id',
              },
            },
            title: 'One to many',
          },
          target: 'test2174',
          targetKey: 'id',
          sourceKey: 'id',
        },
      ],
    },
  ],
};

export const T2614: PageConfig = {
  collections: [
    {
      name: 'T2614',
      fields: [
        {
          name: 'm2o',
          interface: 'm2o',
          target: 'T2614Target1',
        },
      ],
    },
    {
      name: 'T2614Target1',
      fields: [
        {
          name: 'm2oOfTarget1',
          interface: 'm2o',
          target: 'T2614Target2',
        },
      ],
    },
    {
      name: 'T2614Target2',
      fields: [
        {
          name: 'm2oOfTarget2',
          interface: 'm2o',
          target: 'users',
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
      oaeetth18tf: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          vv0l8wohslb: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              '7se9siwa4ce': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  '249fb0vofov': {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'T2614:list',
                    'x-decorator-props': {
                      collection: 'T2614',
                      resource: 'T2614',
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
                        'x-initializer': 'table:configureActions',
                        'x-component': 'ActionBar',
                        'x-component-props': {
                          style: {
                            marginBottom: 'var(--nb-spacing)',
                          },
                        },
                        'x-uid': 'vq4vg5mpbxz',
                        'x-async': false,
                        'x-index': 1,
                      },
                      v76qyn133dr: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'array',
                        'x-initializer': 'table:configureColumns',
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
                            'x-initializer': 'table:configureItemActions',
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
                                properties: {
                                  '02okcjna453': {
                                    'x-uid': 'xowhnp7a686',
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: 'View record',
                                    'x-action': 'view',
                                    'x-designer': 'Action.Designer',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'drawer',
                                      danger: false,
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
                                            'x-initializer': 'TabPaneInitializers',
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
                                                      qbl84fadyr0: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        properties: {
                                                          pfnr7qcapp2: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            properties: {
                                                              eomkz742tgm: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action': 'T2614:get',
                                                                'x-decorator': 'FormBlockProvider',
                                                                'x-decorator-props': {
                                                                  resource: 'T2614',
                                                                  collection: 'T2614',
                                                                  readPretty: true,
                                                                  action: 'get',
                                                                  useParams: '{{ useParamsFromRecord }}',
                                                                  useSourceId: '{{ useSourceIdFromParentRecord }}',
                                                                },
                                                                'x-designer': 'FormV2.ReadPrettyDesigner',
                                                                'x-component': 'CardItem',
                                                                properties: {
                                                                  sekfkpv5dh2: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'FormV2',
                                                                    'x-read-pretty': true,
                                                                    'x-component-props': {
                                                                      useProps: '{{ useFormBlockProps }}',
                                                                    },
                                                                    properties: {
                                                                      actions: {
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
                                                                        'x-uid': 'mt321nhie11',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                      grid: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid',
                                                                        'x-initializer': 'details:configureFields',
                                                                        properties: {
                                                                          i39cn9ve66b: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            properties: {
                                                                              h6aq6z28saw: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                properties: {
                                                                                  m2o: {
                                                                                    'x-uid': '5zamj2l0hxp',
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field': 'T2614.m2o',
                                                                                    'x-component-props': {
                                                                                      mode: 'Nester',
                                                                                    },
                                                                                    properties: {
                                                                                      sgu8ssav8z3: {
                                                                                        _isJSONSchemaObject: true,
                                                                                        version: '2.0',
                                                                                        type: 'void',
                                                                                        'x-component':
                                                                                          'AssociationField.Nester',
                                                                                        'x-index': 1,
                                                                                        properties: {
                                                                                          grid: {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            'x-component': 'Grid',
                                                                                            'x-initializer':
                                                                                              'form:configureFields',
                                                                                            properties: {
                                                                                              e5kqdzyj562: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component':
                                                                                                  'Grid.Row',
                                                                                                properties: {
                                                                                                  '36nwk5wtcze': {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Col',
                                                                                                    properties: {
                                                                                                      m2oOfTarget1: {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'string',
                                                                                                        'x-designer':
                                                                                                          'FormItem.Designer',
                                                                                                        'x-component':
                                                                                                          'CollectionField',
                                                                                                        'x-decorator':
                                                                                                          'FormItem',
                                                                                                        'x-collection-field':
                                                                                                          'T2614Target1.m2oOfTarget1',
                                                                                                        'x-component-props':
                                                                                                          {},
                                                                                                        'x-uid':
                                                                                                          '9x1i9kks2io',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'gnqmqaqs49i',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'sku445zzg07',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                              bnd1dnje70d: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component':
                                                                                                  'Grid.Row',
                                                                                                properties: {
                                                                                                  ygyvra5m18v: {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Col',
                                                                                                    properties: {
                                                                                                      'm2oOfTarget1.id':
                                                                                                        {
                                                                                                          _isJSONSchemaObject:
                                                                                                            true,
                                                                                                          version:
                                                                                                            '2.0',
                                                                                                          type: 'string',
                                                                                                          'x-designer':
                                                                                                            'FormItem.Designer',
                                                                                                          'x-component':
                                                                                                            'CollectionField',
                                                                                                          'x-read-pretty':
                                                                                                            true,
                                                                                                          'x-component-props':
                                                                                                            {
                                                                                                              'pattern-disable':
                                                                                                                true,
                                                                                                            },
                                                                                                          'x-decorator':
                                                                                                            'FormItem',
                                                                                                          'x-collection-field':
                                                                                                            'T2614Target1.m2oOfTarget1.id',
                                                                                                          'x-uid':
                                                                                                            '0trg79yim60',
                                                                                                          'x-async':
                                                                                                            false,
                                                                                                          'x-index': 1,
                                                                                                        },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'auigm7t6blc',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': '6ll6h4ii2td',
                                                                                                'x-async': false,
                                                                                                'x-index': 2,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'wxo0qlrm5ss',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': '73iro2istbt',
                                                                                        'x-async': false,
                                                                                      },
                                                                                    },
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'h3feczketbc',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'nb5fbboc504',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'dehspo2sh69',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': 'lyvcisiy2mz',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': 'u78ad3fqfdo',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'r8s2aj79b9q',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'fgsdtpfae0q',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'dzzom03ln6q',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'u8h5d2ecch0',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': '1dlp1swsc68',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'qa2uyudep13',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                  '697zke71z0l': {
                                    'x-uid': '7o63dwge91d',
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: 'Edit record',
                                    'x-action': 'update',
                                    'x-designer': 'Action.Designer',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'drawer',
                                      danger: false,
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
                                            'x-initializer': 'TabPaneInitializers',
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
                                                      z79dioevb4n: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        properties: {
                                                          krzxk68va81: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            properties: {
                                                              '7ms7r5wolwa': {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action-props': {
                                                                  skipScopeCheck: false,
                                                                },
                                                                'x-acl-action': 'T2614:update',
                                                                'x-decorator': 'FormBlockProvider',
                                                                'x-decorator-props': {
                                                                  useSourceId: '{{ useSourceIdFromParentRecord }}',
                                                                  useParams: '{{ useParamsFromRecord }}',
                                                                  action: 'get',
                                                                  resource: 'T2614',
                                                                  collection: 'T2614',
                                                                },
                                                                'x-designer': 'FormV2.Designer',
                                                                'x-component': 'CardItem',
                                                                'x-component-props': {},
                                                                properties: {
                                                                  '4pxevnwkd12': {
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
                                                                        'x-initializer': 'form:configureFields',
                                                                        properties: {
                                                                          j9egu0k0tkq: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            properties: {
                                                                              zpv9u8httu7: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                properties: {
                                                                                  m2o: {
                                                                                    'x-uid': '1pyjlpyhxue',
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field': 'T2614.m2o',
                                                                                    'x-component-props': {
                                                                                      mode: 'Nester',
                                                                                    },
                                                                                    properties: {
                                                                                      ts1e7dq92gw: {
                                                                                        _isJSONSchemaObject: true,
                                                                                        version: '2.0',
                                                                                        type: 'void',
                                                                                        'x-component':
                                                                                          'AssociationField.Nester',
                                                                                        'x-index': 1,
                                                                                        properties: {
                                                                                          grid: {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            'x-component': 'Grid',
                                                                                            'x-initializer':
                                                                                              'form:configureFields',
                                                                                            properties: {
                                                                                              esgv9d2n3jl: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component':
                                                                                                  'Grid.Row',
                                                                                                properties: {
                                                                                                  fvjf1i0u5tj: {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Col',
                                                                                                    properties: {
                                                                                                      m2oOfTarget1: {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'string',
                                                                                                        'x-designer':
                                                                                                          'FormItem.Designer',
                                                                                                        'x-component':
                                                                                                          'CollectionField',
                                                                                                        'x-decorator':
                                                                                                          'FormItem',
                                                                                                        'x-collection-field':
                                                                                                          'T2614Target1.m2oOfTarget1',
                                                                                                        'x-component-props':
                                                                                                          {},
                                                                                                        'x-uid':
                                                                                                          'tbl4cxpqqhr',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      '0inwt7v6zx1',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'ooid2e23vzk',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                              '8jo9e13m9pu': {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component':
                                                                                                  'Grid.Row',
                                                                                                properties: {
                                                                                                  dbwz7xfmcsf: {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Col',
                                                                                                    properties: {
                                                                                                      'm2oOfTarget1.id':
                                                                                                        {
                                                                                                          _isJSONSchemaObject:
                                                                                                            true,
                                                                                                          version:
                                                                                                            '2.0',
                                                                                                          type: 'string',
                                                                                                          'x-designer':
                                                                                                            'FormItem.Designer',
                                                                                                          'x-component':
                                                                                                            'CollectionField',
                                                                                                          'x-read-pretty':
                                                                                                            true,
                                                                                                          'x-component-props':
                                                                                                            {
                                                                                                              'pattern-disable':
                                                                                                                true,
                                                                                                            },
                                                                                                          'x-decorator':
                                                                                                            'FormItem',
                                                                                                          'x-collection-field':
                                                                                                            'T2614Target1.m2oOfTarget1.id',
                                                                                                          'x-uid':
                                                                                                            'no1h1z3kbqn',
                                                                                                          'x-async':
                                                                                                            false,
                                                                                                          'x-index': 1,
                                                                                                        },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'f1w8n47pxgk',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'v6x8pzyim4q',
                                                                                                'x-async': false,
                                                                                                'x-index': 2,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'ixnvtkde6ut',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': 'a0765a01l4v',
                                                                                        'x-async': false,
                                                                                      },
                                                                                    },
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'nhq72b5xej7',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': '0rchr17dcvr',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'fvfqd52uoaa',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                      actions: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-initializer': 'editForm:configureActions',
                                                                        'x-component': 'ActionBar',
                                                                        'x-component-props': {
                                                                          layout: 'one-column',
                                                                          style: {
                                                                            marginTop: 24,
                                                                          },
                                                                        },
                                                                        'x-uid': 'bm93ifuifak',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': '6s8ie14bci8',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': 'hljdd9nlub3',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'h14avrpxyu9',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'n54e5yj7uo8',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'o6q0ebwuei0',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'ej65121swhj',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': '521m41b059u',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': '6ddt1wgx8zu',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-async': false,
                                    'x-index': 2,
                                  },
                                },
                                'x-uid': '1oj9b60cf3w',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'qdzdffxf5da',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 't7svx0a3pce',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'w8kzfaxgchd',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'hg44qtd6uw6',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'vv4zzxbtbja',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': '6klhg23a43i',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': '9ebjl68x43b',
    'x-async': true,
    'x-index': 1,
  },
};

export const T2993: PageConfig = {
  collections: [
    {
      name: 'T2993',
      fields: [
        {
          name: 'm2o',
          interface: 'm2o',
          target: 'T2993Target1',
        },
      ],
    },
    {
      name: 'T2993Target1',
      fields: [
        {
          name: 'm2oOfTarget1',
          interface: 'm2o',
          target: 'T2993Target2',
        },
      ],
    },
    {
      name: 'T2993Target2',
      fields: [
        {
          name: 'm2oOfTarget2',
          interface: 'm2o',
          target: 'users',
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
      oaeetth18tf: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-index': 1,
        properties: {
          vv0l8wohslb: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-index': 1,
            properties: {
              '7se9siwa4ce': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-index': 1,
                properties: {
                  '249fb0vofov': {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'T2993:list',
                    'x-decorator-props': {
                      collection: 'T2993',
                      resource: 'T2993',
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
                    'x-index': 1,
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
                        'x-index': 1,
                        properties: {
                          '320je2i6xjp': {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-action': 'create',
                            'x-acl-action': 'create',
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
                                            'x-initializer': 'popup:addNew:addBlock',
                                            properties: {
                                              kvyqrrxvggn: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid.Row',
                                                properties: {
                                                  ohfczsepq4k: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid.Col',
                                                    properties: {
                                                      yybs6yl6vvm: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-acl-action-props': {
                                                          skipScopeCheck: true,
                                                        },
                                                        'x-acl-action': 'T2993:create',
                                                        'x-decorator': 'FormBlockProvider',
                                                        'x-decorator-props': {
                                                          resource: 'T2993',
                                                          collection: 'T2993',
                                                        },
                                                        'x-designer': 'FormV2.Designer',
                                                        'x-component': 'CardItem',
                                                        'x-component-props': {},
                                                        properties: {
                                                          myzgzqbjryj: {
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
                                                                'x-initializer': 'form:configureFields',
                                                                properties: {
                                                                  itg7al9oxaw: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'Grid.Row',
                                                                    properties: {
                                                                      hejnuwat4oc: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid.Col',
                                                                        properties: {
                                                                          m2o: {
                                                                            'x-uid': '3pvkdw7siwz',
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'string',
                                                                            'x-designer': 'FormItem.Designer',
                                                                            'x-component': 'CollectionField',
                                                                            'x-decorator': 'FormItem',
                                                                            'x-collection-field': 'T2993.m2o',
                                                                            'x-component-props': {
                                                                              mode: 'Nester',
                                                                            },
                                                                            default: null,
                                                                            properties: {
                                                                              xar1gsdp1sr: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component':
                                                                                  'AssociationField.Nester',
                                                                                'x-index': 1,
                                                                                properties: {
                                                                                  grid: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'void',
                                                                                    'x-component': 'Grid',
                                                                                    'x-initializer':
                                                                                      'form:configureFields',
                                                                                    properties: {
                                                                                      um4p1ariq2x: {
                                                                                        _isJSONSchemaObject: true,
                                                                                        version: '2.0',
                                                                                        type: 'void',
                                                                                        'x-component': 'Grid.Row',
                                                                                        properties: {
                                                                                          ako5fc5c6su: {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            'x-component': 'Grid.Col',
                                                                                            properties: {
                                                                                              m2oOfTarget1: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'string',
                                                                                                'x-designer':
                                                                                                  'FormItem.Designer',
                                                                                                'x-component':
                                                                                                  'CollectionField',
                                                                                                'x-decorator':
                                                                                                  'FormItem',
                                                                                                'x-collection-field':
                                                                                                  'T2993Target1.m2oOfTarget1',
                                                                                                'x-component-props': {},
                                                                                                'x-uid': 'k3u04sl4yzk',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'kb67g4ow7rv',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': 'vd9k8begch0',
                                                                                        'x-async': false,
                                                                                        'x-index': 1,
                                                                                      },
                                                                                      lgezjw87145: {
                                                                                        _isJSONSchemaObject: true,
                                                                                        version: '2.0',
                                                                                        type: 'void',
                                                                                        'x-component': 'Grid.Row',
                                                                                        properties: {
                                                                                          n3d2krsbvt3: {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            'x-component': 'Grid.Col',
                                                                                            properties: {
                                                                                              'm2oOfTarget1.m2oOfTarget2':
                                                                                                {
                                                                                                  'x-uid':
                                                                                                    'tt1wq5dvs3v',
                                                                                                  _isJSONSchemaObject:
                                                                                                    true,
                                                                                                  version: '2.0',
                                                                                                  type: 'string',
                                                                                                  'x-designer':
                                                                                                    'FormItem.Designer',
                                                                                                  'x-component':
                                                                                                    'CollectionField',
                                                                                                  'x-read-pretty': true,
                                                                                                  'x-component-props': {
                                                                                                    'pattern-disable':
                                                                                                      true,
                                                                                                    fieldNames: {
                                                                                                      label: 'id',
                                                                                                      value: 'id',
                                                                                                    },
                                                                                                    mode: 'Nester',
                                                                                                  },
                                                                                                  'x-decorator':
                                                                                                    'FormItem',
                                                                                                  'x-collection-field':
                                                                                                    'T2993Target1.m2oOfTarget1.m2oOfTarget2',
                                                                                                  default: null,
                                                                                                  properties: {
                                                                                                    ygskw048e1z: {
                                                                                                      _isJSONSchemaObject:
                                                                                                        true,
                                                                                                      version: '2.0',
                                                                                                      type: 'void',
                                                                                                      'x-component':
                                                                                                        'AssociationField.Nester',
                                                                                                      'x-index': 1,
                                                                                                      properties: {
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
                                                                                                          properties: {
                                                                                                            uscd5l8tu2t:
                                                                                                              {
                                                                                                                _isJSONSchemaObject:
                                                                                                                  true,
                                                                                                                version:
                                                                                                                  '2.0',
                                                                                                                type: 'void',
                                                                                                                'x-component':
                                                                                                                  'Grid.Row',
                                                                                                                properties:
                                                                                                                  {
                                                                                                                    jna3kowl6n0:
                                                                                                                      {
                                                                                                                        _isJSONSchemaObject:
                                                                                                                          true,
                                                                                                                        version:
                                                                                                                          '2.0',
                                                                                                                        type: 'void',
                                                                                                                        'x-component':
                                                                                                                          'Grid.Col',
                                                                                                                        properties:
                                                                                                                          {
                                                                                                                            nickname:
                                                                                                                              {
                                                                                                                                _isJSONSchemaObject:
                                                                                                                                  true,
                                                                                                                                version:
                                                                                                                                  '2.0',
                                                                                                                                type: 'string',
                                                                                                                                'x-designer':
                                                                                                                                  'FormItem.Designer',
                                                                                                                                'x-component':
                                                                                                                                  'CollectionField',
                                                                                                                                'x-decorator':
                                                                                                                                  'FormItem',
                                                                                                                                'x-collection-field':
                                                                                                                                  'users.nickname',
                                                                                                                                'x-component-props':
                                                                                                                                  {},
                                                                                                                                'x-uid':
                                                                                                                                  'kaks1ezjj98',
                                                                                                                                'x-async':
                                                                                                                                  false,
                                                                                                                                'x-index': 1,
                                                                                                                              },
                                                                                                                          },
                                                                                                                        'x-uid':
                                                                                                                          '9u2d1166uh0',
                                                                                                                        'x-async':
                                                                                                                          false,
                                                                                                                        'x-index': 1,
                                                                                                                      },
                                                                                                                  },
                                                                                                                'x-uid':
                                                                                                                  'lp13gnw7f9d',
                                                                                                                'x-async':
                                                                                                                  false,
                                                                                                                'x-index': 1,
                                                                                                              },
                                                                                                          },
                                                                                                          'x-uid':
                                                                                                            'fea7tmd6sbh',
                                                                                                          'x-async':
                                                                                                            false,
                                                                                                          'x-index': 1,
                                                                                                        },
                                                                                                      },
                                                                                                      'x-uid':
                                                                                                        'ts3zjwyo478',
                                                                                                      'x-async': false,
                                                                                                    },
                                                                                                  },
                                                                                                  'x-async': false,
                                                                                                  'x-index': 1,
                                                                                                },
                                                                                            },
                                                                                            'x-uid': 'oin3jlxc4gv',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': '16aqmqkwhfd',
                                                                                        'x-async': false,
                                                                                        'x-index': 2,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': '3gla3xjm61o',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'i46zhazjn7b',
                                                                                'x-async': false,
                                                                              },
                                                                            },
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'ciiv69n96t8',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                    },
                                                                    'x-uid': 'hiywtpw6on8',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': 'xknx3vzmjpx',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                              actions: {
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
                                                                'x-uid': 'zg7tf79gplk',
                                                                'x-async': false,
                                                                'x-index': 2,
                                                              },
                                                            },
                                                            'x-uid': 'k1302u47v0e',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'yyvjo6gad5o',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'u22hbq1ctdb',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'qy5lf41wr0x',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'ylibp9kzpn8',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'so9jo1bpw2s',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'vbhe3vpvwsj',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'thjjada865a',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'qki69uj0lrw',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'dddnddme2k0',
                        'x-async': false,
                      },
                      v76qyn133dr: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'array',
                        'x-initializer': 'table:configureColumns',
                        'x-component': 'TableV2',
                        'x-component-props': {
                          rowKey: 'id',
                          rowSelection: {
                            type: 'checkbox',
                          },
                          useProps: '{{ useTableBlockProps }}',
                        },
                        'x-index': 2,
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
                            'x-index': 1,
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
                                'x-index': 1,
                                'x-uid': '5whl9o7b89g',
                                'x-async': false,
                              },
                            },
                            'x-uid': 'q2mfg78ct2l',
                            'x-async': false,
                          },
                        },
                        'x-uid': 'h26orxh3oza',
                        'x-async': false,
                      },
                    },
                    'x-uid': 'cozbcpx31lh',
                    'x-async': false,
                  },
                },
                'x-uid': 'ogpj115jybu',
                'x-async': false,
              },
            },
            'x-uid': 'maeo2u6nqxd',
            'x-async': false,
          },
        },
        'x-uid': 'lc1u2cn2xbn',
        'x-async': false,
      },
    },
    'x-uid': 'x2q3p8forv1',
    'x-async': true,
  },
};

export const T2615: PageConfig = {
  collections: [
    {
      name: 'T2615',
      fields: [
        {
          name: 'm2o',
          interface: 'm2o',
          target: 'T2615Target1',
        },
      ],
    },
    {
      name: 'T2615Target1',
      fields: [
        {
          name: 'm2oOfTarget1',
          interface: 'm2o',
          target: 'T2615Target2',
        },
      ],
    },
    {
      name: 'T2615Target2',
      fields: [
        {
          name: 'm2oOfTarget2',
          interface: 'm2o',
          target: 'users',
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
      eoe6sphevnd: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          '1valv0kj8vs': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              nkq10mh10ps: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  '22lk2du0ib3': {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'T2615:list',
                    'x-decorator-props': {
                      collection: 'T2615',
                      resource: 'T2615',
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
                        'x-initializer': 'table:configureActions',
                        'x-component': 'ActionBar',
                        'x-component-props': {
                          style: {
                            marginBottom: 'var(--nb-spacing)',
                          },
                        },
                        properties: {
                          unexw8b0ued: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-action': 'create',
                            'x-acl-action': 'create',
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
                                            'x-initializer': 'popup:addNew:addBlock',
                                            properties: {
                                              '8ei3tsaojf6': {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid.Row',
                                                properties: {
                                                  '5u0ju1wsgkl': {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid.Col',
                                                    properties: {
                                                      zxwg35f8sg7: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-acl-action-props': {
                                                          skipScopeCheck: true,
                                                        },
                                                        'x-acl-action': 'T2615:create',
                                                        'x-decorator': 'FormBlockProvider',
                                                        'x-decorator-props': {
                                                          resource: 'T2615',
                                                          collection: 'T2615',
                                                        },
                                                        'x-designer': 'FormV2.Designer',
                                                        'x-component': 'CardItem',
                                                        'x-component-props': {},
                                                        properties: {
                                                          '9i2u8628hoz': {
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
                                                                'x-initializer': 'form:configureFields',
                                                                properties: {
                                                                  i7cb2o172ey: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'Grid.Row',
                                                                    properties: {
                                                                      enue1mnnt4g: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid.Col',
                                                                        properties: {
                                                                          m2o: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'string',
                                                                            'x-designer': 'FormItem.Designer',
                                                                            'x-component': 'CollectionField',
                                                                            'x-decorator': 'FormItem',
                                                                            'x-collection-field': 'T2615.m2o',
                                                                            'x-component-props': {},
                                                                            'x-uid': 'tif3ncbwwru',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'jh5w5yne4qt',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                    },
                                                                    'x-uid': 'aqo2rtciew5',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                  qfr6n6ymx77: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'Grid.Row',
                                                                    properties: {
                                                                      ldlk5ifn56r: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid.Col',
                                                                        properties: {
                                                                          'm2o.m2oOfTarget1': {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'string',
                                                                            'x-designer': 'FormItem.Designer',
                                                                            'x-component': 'CollectionField',
                                                                            'x-read-pretty': true,
                                                                            'x-component-props': {
                                                                              'pattern-disable': true,
                                                                              fieldNames: {
                                                                                label: 'id',
                                                                                value: 'id',
                                                                              },
                                                                            },
                                                                            'x-decorator': 'FormItem',
                                                                            'x-collection-field':
                                                                              'T2615.m2o.m2oOfTarget1',
                                                                            'x-uid': 'gii2rk1q4fx',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'k2k4hzsmxzw',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                    },
                                                                    'x-uid': 'tysg8zh5wpp',
                                                                    'x-async': false,
                                                                    'x-index': 2,
                                                                  },
                                                                },
                                                                'x-uid': '7ff0fvn1ci1',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                              actions: {
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
                                                                'x-uid': '6u35dl8quee',
                                                                'x-async': false,
                                                                'x-index': 2,
                                                              },
                                                            },
                                                            'x-uid': '5syf9qhcwch',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': '26kgmi2guwg',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'i1hdum7ju7d',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': '8e7td05t5rv',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'nlgcjcl7sm2',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'hzn4uinj3i7',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'qkv3lilo9ew',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'k945b89wggu',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'pz18nxb0x51',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': '94386mg3n6z',
                        'x-async': false,
                        'x-index': 1,
                      },
                      '3m6w3iz4c5t': {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'array',
                        'x-initializer': 'table:configureColumns',
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
                            'x-initializer': 'table:configureItemActions',
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
                                properties: {
                                  yych9x95hrp: {
                                    'x-uid': 'uv7zmtj0r5u',
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: 'Edit record',
                                    'x-action': 'update',
                                    'x-designer': 'Action.Designer',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'drawer',
                                      danger: false,
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
                                            'x-initializer': 'TabPaneInitializers',
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
                                                      l79xm6sfjst: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        properties: {
                                                          '7cyquusb2ca': {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            properties: {
                                                              '8dxzx9t0571': {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action-props': {
                                                                  skipScopeCheck: false,
                                                                },
                                                                'x-acl-action': 'T2615:update',
                                                                'x-decorator': 'FormBlockProvider',
                                                                'x-decorator-props': {
                                                                  useSourceId: '{{ useSourceIdFromParentRecord }}',
                                                                  useParams: '{{ useParamsFromRecord }}',
                                                                  action: 'get',
                                                                  resource: 'T2615',
                                                                  collection: 'T2615',
                                                                },
                                                                'x-designer': 'FormV2.Designer',
                                                                'x-component': 'CardItem',
                                                                'x-component-props': {},
                                                                properties: {
                                                                  '21sxtdkbcw0': {
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
                                                                        'x-initializer': 'form:configureFields',
                                                                        properties: {
                                                                          '7eayo28dgzo': {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            properties: {
                                                                              oj9yj21ujd8: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                properties: {
                                                                                  m2o: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field': 'T2615.m2o',
                                                                                    'x-component-props': {},
                                                                                    'x-uid': 'qxn8qacg682',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'axx7wvrxnem',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'qgkr6iz0e1t',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                          zsdbhvdvaru: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            properties: {
                                                                              '082hatydnd0': {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                properties: {
                                                                                  'm2o.m2oOfTarget1': {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-read-pretty': true,
                                                                                    'x-component-props': {
                                                                                      'pattern-disable': true,
                                                                                      fieldNames: {
                                                                                        label: 'id',
                                                                                        value: 'id',
                                                                                      },
                                                                                    },
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field':
                                                                                      'T2615.m2o.m2oOfTarget1',
                                                                                    'x-uid': 'n5s7j4n193r',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'nm9qq5hao2e',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'ey3595qsqyk',
                                                                            'x-async': false,
                                                                            'x-index': 2,
                                                                          },
                                                                        },
                                                                        'x-uid': 'w8zdw4dr89d',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                      actions: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-initializer': 'editForm:configureActions',
                                                                        'x-component': 'ActionBar',
                                                                        'x-component-props': {
                                                                          layout: 'one-column',
                                                                          style: {
                                                                            marginTop: 24,
                                                                          },
                                                                        },
                                                                        'x-uid': 'conyu4tdnsb',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': '6jeoainb2oa',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': '27azok1hcrs',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'x0gpfgjc0n1',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': '0up3rbfoby1',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'tul7kvn3s6m',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'jz2lb20hu1s',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'ssbzj9yrh8r',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'dak290d9mnz',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                  t452of8muaq: {
                                    'x-uid': 'q4op427zlfp',
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: 'View record',
                                    'x-action': 'view',
                                    'x-designer': 'Action.Designer',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'drawer',
                                      danger: false,
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
                                            'x-initializer': 'TabPaneInitializers',
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
                                                      nlnfd9hnl53: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        properties: {
                                                          o1mvvolrr3n: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            properties: {
                                                              '02tm0tr9gie': {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action': 'T2615:get',
                                                                'x-decorator': 'FormBlockProvider',
                                                                'x-decorator-props': {
                                                                  resource: 'T2615',
                                                                  collection: 'T2615',
                                                                  readPretty: true,
                                                                  action: 'get',
                                                                  useParams: '{{ useParamsFromRecord }}',
                                                                  useSourceId: '{{ useSourceIdFromParentRecord }}',
                                                                },
                                                                'x-designer': 'FormV2.ReadPrettyDesigner',
                                                                'x-component': 'CardItem',
                                                                properties: {
                                                                  xa10ops1tmr: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'FormV2',
                                                                    'x-read-pretty': true,
                                                                    'x-component-props': {
                                                                      useProps: '{{ useFormBlockProps }}',
                                                                    },
                                                                    properties: {
                                                                      actions: {
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
                                                                        'x-uid': 'jq1vdqw4oyy',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                      grid: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid',
                                                                        'x-initializer': 'details:configureFields',
                                                                        properties: {
                                                                          j9mxulol74m: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            properties: {
                                                                              r4alweypz03: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                properties: {
                                                                                  m2o: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field': 'T2615.m2o',
                                                                                    'x-component-props': {},
                                                                                    'x-uid': 'ttv0hjsnnsy',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'p9yvxr8b7vg',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'r198z5pv6c4',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                          xb97qr5ustn: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            properties: {
                                                                              wje8oyfbn1d: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                properties: {
                                                                                  'm2o.m2oOfTarget1': {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-read-pretty': true,
                                                                                    'x-component-props': {
                                                                                      'pattern-disable': true,
                                                                                      fieldNames: {
                                                                                        label: 'id',
                                                                                        value: 'id',
                                                                                      },
                                                                                    },
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field':
                                                                                      'T2615.m2o.m2oOfTarget1',
                                                                                    'x-uid': '6pdlbj34175',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'p2alwntoxkg',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'rgsbhuo0lzv',
                                                                            'x-async': false,
                                                                            'x-index': 2,
                                                                          },
                                                                        },
                                                                        'x-uid': 'a39j3mj83xp',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': 'd6xf1x23yzx',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': '5esxphd790l',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'pzr8i6utc83',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'u8wkbbgvb05',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'boh5n3tkmgu',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'd0cfvm929ca',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'wt7e6356t9k',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'cqnlqotquv9',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-async': false,
                                    'x-index': 2,
                                  },
                                },
                                'x-uid': 'x8yf6ex62ju',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 't4gcpw7ji0u',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': '8d8oe7qocry',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'vyf1ac9nsl5',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '8zp6xvttwvi',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'axknjuou42g',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'xtxm0hd6lbi',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'lbdmizeodxy',
    'x-async': true,
    'x-index': 1,
  },
};

export const T2845: PageConfig = {
  collections: [
    {
      name: 'T2615',
      fields: [
        {
          name: 'm2o',
          interface: 'm2o',
          target: 'T2615Target1',
        },
      ],
    },
    {
      name: 'T2615Target1',
      fields: [
        {
          name: 'm2oOfTarget1',
          interface: 'm2o',
          target: 'T2615Target2',
        },
      ],
    },
    {
      name: 'T2615Target2',
      fields: [
        {
          name: 'm2oOfTarget2',
          interface: 'm2o',
          target: 'users',
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
      eoe6sphevnd: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-index': 1,
        properties: {
          '1valv0kj8vs': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-index': 1,
            properties: {
              nkq10mh10ps: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-index': 1,
                properties: {
                  '22lk2du0ib3': {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'T2615:list',
                    'x-decorator-props': {
                      collection: 'T2615',
                      resource: 'T2615',
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
                    'x-index': 1,
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
                        'x-index': 1,
                        properties: {
                          unexw8b0ued: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-action': 'create',
                            'x-acl-action': 'create',
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
                            'x-index': 1,
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
                                'x-index': 1,
                                properties: {
                                  tabs: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Tabs',
                                    'x-component-props': {},
                                    'x-initializer': 'TabPaneInitializersForCreateFormBlock',
                                    'x-index': 1,
                                    properties: {
                                      tab1: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        title: '{{t("Add new")}}',
                                        'x-component': 'Tabs.TabPane',
                                        'x-designer': 'Tabs.Designer',
                                        'x-component-props': {},
                                        'x-index': 1,
                                        properties: {
                                          grid: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Grid',
                                            'x-initializer': 'popup:addNew:addBlock',
                                            'x-index': 1,
                                            properties: {
                                              '8ei3tsaojf6': {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid.Row',
                                                'x-index': 1,
                                                properties: {
                                                  '5u0ju1wsgkl': {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid.Col',
                                                    'x-index': 1,
                                                    properties: {
                                                      zxwg35f8sg7: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-acl-action-props': {
                                                          skipScopeCheck: true,
                                                        },
                                                        'x-acl-action': 'T2615:create',
                                                        'x-decorator': 'FormBlockProvider',
                                                        'x-decorator-props': {
                                                          resource: 'T2615',
                                                          collection: 'T2615',
                                                        },
                                                        'x-designer': 'FormV2.Designer',
                                                        'x-component': 'CardItem',
                                                        'x-component-props': {},
                                                        'x-index': 1,
                                                        properties: {
                                                          '9i2u8628hoz': {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'FormV2',
                                                            'x-component-props': {
                                                              useProps: '{{ useFormBlockProps }}',
                                                            },
                                                            'x-index': 1,
                                                            properties: {
                                                              grid: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-component': 'Grid',
                                                                'x-initializer': 'form:configureFields',
                                                                'x-index': 1,
                                                                properties: {
                                                                  i7cb2o172ey: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'Grid.Row',
                                                                    'x-index': 1,
                                                                    properties: {
                                                                      enue1mnnt4g: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid.Col',
                                                                        'x-index': 1,
                                                                        properties: {
                                                                          m2o: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'string',
                                                                            'x-designer': 'FormItem.Designer',
                                                                            'x-component': 'CollectionField',
                                                                            'x-decorator': 'FormItem',
                                                                            'x-collection-field': 'T2615.m2o',
                                                                            'x-component-props': {},
                                                                            'x-index': 1,
                                                                            'x-uid': 'vtclwzomalz',
                                                                            'x-async': false,
                                                                          },
                                                                        },
                                                                        'x-uid': 'g837gkiq4wy',
                                                                        'x-async': false,
                                                                      },
                                                                    },
                                                                    'x-uid': '7vumu2u8h6x',
                                                                    'x-async': false,
                                                                  },
                                                                  qfr6n6ymx77: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'Grid.Row',
                                                                    'x-index': 2,
                                                                    properties: {
                                                                      ldlk5ifn56r: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid.Col',
                                                                        'x-index': 1,
                                                                        properties: {
                                                                          'm2o.m2oOfTarget1': {
                                                                            'x-uid': 'sos7suq8jac',
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'string',
                                                                            'x-designer': 'FormItem.Designer',
                                                                            'x-component': 'CollectionField',
                                                                            'x-read-pretty': true,
                                                                            'x-component-props': {
                                                                              'pattern-disable': true,
                                                                              fieldNames: {
                                                                                label: 'id',
                                                                                value: 'id',
                                                                              },
                                                                              mode: 'Nester',
                                                                            },
                                                                            'x-decorator': 'FormItem',
                                                                            'x-collection-field':
                                                                              'T2615.m2o.m2oOfTarget1',
                                                                            'x-index': 1,
                                                                            default: null,
                                                                            properties: {
                                                                              f1l1qqex42p: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component':
                                                                                  'AssociationField.Nester',
                                                                                'x-index': 1,
                                                                                properties: {
                                                                                  grid: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'void',
                                                                                    'x-component': 'Grid',
                                                                                    'x-initializer':
                                                                                      'form:configureFields',
                                                                                    properties: {
                                                                                      '3wg2gga1tgx': {
                                                                                        _isJSONSchemaObject: true,
                                                                                        version: '2.0',
                                                                                        type: 'void',
                                                                                        'x-component': 'Grid.Row',
                                                                                        properties: {
                                                                                          jphbd0t9pya: {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            'x-component': 'Grid.Col',
                                                                                            properties: {
                                                                                              id: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'string',
                                                                                                'x-designer':
                                                                                                  'FormItem.Designer',
                                                                                                'x-component':
                                                                                                  'CollectionField',
                                                                                                'x-decorator':
                                                                                                  'FormItem',
                                                                                                'x-collection-field':
                                                                                                  'T2615Target2.id',
                                                                                                'x-component-props': {},
                                                                                                'x-read-pretty': true,
                                                                                                'x-uid': '7b8oc8mukl8',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                              m2oOfTarget2: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'string',
                                                                                                'x-designer':
                                                                                                  'FormItem.Designer',
                                                                                                'x-component':
                                                                                                  'CollectionField',
                                                                                                'x-decorator':
                                                                                                  'FormItem',
                                                                                                'x-collection-field':
                                                                                                  'T2615Target2.m2oOfTarget2',
                                                                                                'x-component-props': {},
                                                                                                properties: {
                                                                                                  gvf4lwpwqvr: {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    title:
                                                                                                      '{{ t("View record") }}',
                                                                                                    'x-component':
                                                                                                      'AssociationField.Viewer',
                                                                                                    'x-component-props':
                                                                                                      {
                                                                                                        className:
                                                                                                          'nb-action-popup',
                                                                                                      },
                                                                                                    'x-index': 1,
                                                                                                    properties: {
                                                                                                      tabs: {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'void',
                                                                                                        'x-component':
                                                                                                          'Tabs',
                                                                                                        'x-component-props':
                                                                                                          {},
                                                                                                        'x-initializer':
                                                                                                          'TabPaneInitializers',
                                                                                                        properties: {
                                                                                                          tab1: {
                                                                                                            _isJSONSchemaObject:
                                                                                                              true,
                                                                                                            version:
                                                                                                              '2.0',
                                                                                                            type: 'void',
                                                                                                            title:
                                                                                                              '{{t("Details")}}',
                                                                                                            'x-component':
                                                                                                              'Tabs.TabPane',
                                                                                                            'x-designer':
                                                                                                              'Tabs.Designer',
                                                                                                            'x-component-props':
                                                                                                              {},
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
                                                                                                                    'popup:common:addBlock',
                                                                                                                  'x-uid':
                                                                                                                    'fen65isdi05',
                                                                                                                  'x-async':
                                                                                                                    false,
                                                                                                                  'x-index': 1,
                                                                                                                },
                                                                                                              },
                                                                                                            'x-uid':
                                                                                                              'ict6mk9c9dg',
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                            'x-index': 1,
                                                                                                          },
                                                                                                        },
                                                                                                        'x-uid':
                                                                                                          'nld7ff0tdbv',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      '313g2f8cj1r',
                                                                                                    'x-async': false,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'ryf842sv29w',
                                                                                                'x-async': false,
                                                                                                'x-index': 2,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'crqnl1a6qzr',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': 'bjvuyt9tu2y',
                                                                                        'x-async': false,
                                                                                        'x-index': 1,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': '46ypgnhxfg2',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'kppb0578oc0',
                                                                                'x-async': false,
                                                                              },
                                                                              '0bqrmbk4dm0': {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                title: '{{ t("View record") }}',
                                                                                'x-component':
                                                                                  'AssociationField.Viewer',
                                                                                'x-component-props': {
                                                                                  className: 'nb-action-popup',
                                                                                },
                                                                                'x-index': 2,
                                                                                properties: {
                                                                                  tabs: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'void',
                                                                                    'x-component': 'Tabs',
                                                                                    'x-component-props': {},
                                                                                    'x-initializer':
                                                                                      'TabPaneInitializers',
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
                                                                                            'x-initializer':
                                                                                              'popup:common:addBlock',
                                                                                            properties: {
                                                                                              dksoesw9cnq: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component':
                                                                                                  'Grid.Row',
                                                                                                properties: {
                                                                                                  n82qzgbe8vp: {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Col',
                                                                                                    properties: {
                                                                                                      stqrc22o99g: {
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
                                                                                                          'T2615Target1.m2oOfTarget1:update',
                                                                                                        'x-decorator':
                                                                                                          'FormBlockProvider',
                                                                                                        'x-decorator-props':
                                                                                                          {
                                                                                                            useSourceId:
                                                                                                              '{{ useSourceIdFromParentRecord }}',
                                                                                                            useParams:
                                                                                                              '{{ useParamsFromRecord }}',
                                                                                                            action:
                                                                                                              'get',
                                                                                                            resource:
                                                                                                              'T2615Target1.m2oOfTarget1',
                                                                                                            collection:
                                                                                                              'T2615Target2',
                                                                                                            association:
                                                                                                              'T2615Target1.m2oOfTarget1',
                                                                                                          },
                                                                                                        'x-designer':
                                                                                                          'FormV2.Designer',
                                                                                                        'x-component':
                                                                                                          'CardItem',
                                                                                                        'x-component-props':
                                                                                                          {},
                                                                                                        properties: {
                                                                                                          j1wlc1fsg8h: {
                                                                                                            _isJSONSchemaObject:
                                                                                                              true,
                                                                                                            version:
                                                                                                              '2.0',
                                                                                                            type: 'void',
                                                                                                            'x-component':
                                                                                                              'FormV2',
                                                                                                            'x-component-props':
                                                                                                              {
                                                                                                                useProps:
                                                                                                                  '{{ useFormBlockProps }}',
                                                                                                              },
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
                                                                                                                  'x-uid':
                                                                                                                    'slesgjv4uxx',
                                                                                                                  'x-async':
                                                                                                                    false,
                                                                                                                  'x-index': 1,
                                                                                                                },
                                                                                                                actions:
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
                                                                                                                        style:
                                                                                                                          {
                                                                                                                            marginTop: 24,
                                                                                                                          },
                                                                                                                      },
                                                                                                                    'x-uid':
                                                                                                                      '530aei12n31',
                                                                                                                    'x-async':
                                                                                                                      false,
                                                                                                                    'x-index': 2,
                                                                                                                  },
                                                                                                              },
                                                                                                            'x-uid':
                                                                                                              'lj3m9mv944b',
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                            'x-index': 1,
                                                                                                          },
                                                                                                        },
                                                                                                        'x-uid':
                                                                                                          'evpd62m3q7k',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'dpnhmlgpxf6',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'ruk9rhunoa0',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'v260my8cg4k',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': 'o8cdftjs2lw',
                                                                                        'x-async': false,
                                                                                        'x-index': 1,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': 'bqke3e0jzo2',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'xmvwga75f7l',
                                                                                'x-async': false,
                                                                              },
                                                                            },
                                                                            'x-async': false,
                                                                          },
                                                                        },
                                                                        'x-uid': 'essybj9hlwd',
                                                                        'x-async': false,
                                                                      },
                                                                    },
                                                                    'x-uid': 'qb9mj6yj01j',
                                                                    'x-async': false,
                                                                  },
                                                                },
                                                                'x-uid': 'f2fhjs2ejnj',
                                                                'x-async': false,
                                                              },
                                                              actions: {
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
                                                                'x-index': 2,
                                                                'x-uid': 'c4b36vqkq6u',
                                                                'x-async': false,
                                                              },
                                                            },
                                                            'x-uid': 'm74kumi1e9a',
                                                            'x-async': false,
                                                          },
                                                        },
                                                        'x-uid': '18pkdz8ts5y',
                                                        'x-async': false,
                                                      },
                                                    },
                                                    'x-uid': 'bwhvrn3czfw',
                                                    'x-async': false,
                                                  },
                                                },
                                                'x-uid': '624h0vckaff',
                                                'x-async': false,
                                              },
                                            },
                                            'x-uid': 'zu8n5qkbcuq',
                                            'x-async': false,
                                          },
                                        },
                                        'x-uid': '8b46pgf3tj5',
                                        'x-async': false,
                                      },
                                    },
                                    'x-uid': 'sdxjbqf4iy6',
                                    'x-async': false,
                                  },
                                },
                                'x-uid': '5tv6ty40alj',
                                'x-async': false,
                              },
                            },
                            'x-uid': 'zdh1hzm1npt',
                            'x-async': false,
                          },
                        },
                        'x-uid': 'pryhuyw95qq',
                        'x-async': false,
                      },
                      '3m6w3iz4c5t': {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'array',
                        'x-initializer': 'table:configureColumns',
                        'x-component': 'TableV2',
                        'x-component-props': {
                          rowKey: 'id',
                          rowSelection: {
                            type: 'checkbox',
                          },
                          useProps: '{{ useTableBlockProps }}',
                        },
                        'x-index': 2,
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
                            'x-index': 1,
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
                                'x-index': 1,
                                properties: {
                                  yych9x95hrp: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: 'Edit record',
                                    'x-action': 'update',
                                    'x-designer': 'Action.Designer',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'drawer',
                                      danger: false,
                                    },
                                    'x-decorator': 'ACLActionProvider',
                                    'x-designer-props': {
                                      linkageAction: true,
                                    },
                                    'x-index': 1,
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
                                        'x-index': 1,
                                        properties: {
                                          tabs: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Tabs',
                                            'x-component-props': {},
                                            'x-initializer': 'TabPaneInitializers',
                                            'x-index': 1,
                                            properties: {
                                              tab1: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                title: '{{t("Edit")}}',
                                                'x-component': 'Tabs.TabPane',
                                                'x-designer': 'Tabs.Designer',
                                                'x-component-props': {},
                                                'x-index': 1,
                                                properties: {
                                                  grid: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid',
                                                    'x-initializer': 'popup:common:addBlock',
                                                    'x-index': 1,
                                                    properties: {
                                                      l79xm6sfjst: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-index': 1,
                                                        properties: {
                                                          '7cyquusb2ca': {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-index': 1,
                                                            properties: {
                                                              '8dxzx9t0571': {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action-props': {
                                                                  skipScopeCheck: false,
                                                                },
                                                                'x-acl-action': 'T2615:update',
                                                                'x-decorator': 'FormBlockProvider',
                                                                'x-decorator-props': {
                                                                  useSourceId: '{{ useSourceIdFromParentRecord }}',
                                                                  useParams: '{{ useParamsFromRecord }}',
                                                                  action: 'get',
                                                                  resource: 'T2615',
                                                                  collection: 'T2615',
                                                                },
                                                                'x-designer': 'FormV2.Designer',
                                                                'x-component': 'CardItem',
                                                                'x-component-props': {},
                                                                'x-index': 1,
                                                                properties: {
                                                                  '21sxtdkbcw0': {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'FormV2',
                                                                    'x-component-props': {
                                                                      useProps: '{{ useFormBlockProps }}',
                                                                    },
                                                                    'x-index': 1,
                                                                    properties: {
                                                                      grid: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid',
                                                                        'x-initializer': 'form:configureFields',
                                                                        'x-index': 1,
                                                                        properties: {
                                                                          '7eayo28dgzo': {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            'x-index': 1,
                                                                            properties: {
                                                                              oj9yj21ujd8: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                'x-index': 1,
                                                                                properties: {
                                                                                  m2o: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field': 'T2615.m2o',
                                                                                    'x-component-props': {},
                                                                                    'x-index': 1,
                                                                                    'x-uid': 'ldansmb778w',
                                                                                    'x-async': false,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'xdn43xxuamx',
                                                                                'x-async': false,
                                                                              },
                                                                            },
                                                                            'x-uid': 'baciuspht8n',
                                                                            'x-async': false,
                                                                          },
                                                                          zsdbhvdvaru: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            'x-index': 2,
                                                                            properties: {
                                                                              '082hatydnd0': {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                'x-index': 1,
                                                                                properties: {
                                                                                  'm2o.m2oOfTarget1': {
                                                                                    'x-uid': 'k9zjnfbcr35',
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-read-pretty': true,
                                                                                    'x-component-props': {
                                                                                      'pattern-disable': true,
                                                                                      fieldNames: {
                                                                                        label: 'id',
                                                                                        value: 'id',
                                                                                      },
                                                                                      mode: 'Nester',
                                                                                    },
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field':
                                                                                      'T2615.m2o.m2oOfTarget1',
                                                                                    'x-index': 1,
                                                                                    properties: {
                                                                                      '1fihmdamirf': {
                                                                                        _isJSONSchemaObject: true,
                                                                                        version: '2.0',
                                                                                        type: 'void',
                                                                                        'x-component':
                                                                                          'AssociationField.Nester',
                                                                                        'x-index': 1,
                                                                                        properties: {
                                                                                          grid: {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            'x-component': 'Grid',
                                                                                            'x-initializer':
                                                                                              'form:configureFields',
                                                                                            properties: {
                                                                                              ddo3fvkz6hw: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component':
                                                                                                  'Grid.Row',
                                                                                                properties: {
                                                                                                  '3vttqmamk12': {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Col',
                                                                                                    properties: {
                                                                                                      id: {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'string',
                                                                                                        'x-designer':
                                                                                                          'FormItem.Designer',
                                                                                                        'x-component':
                                                                                                          'CollectionField',
                                                                                                        'x-decorator':
                                                                                                          'FormItem',
                                                                                                        'x-collection-field':
                                                                                                          'T2615Target2.id',
                                                                                                        'x-component-props':
                                                                                                          {},
                                                                                                        'x-read-pretty':
                                                                                                          true,
                                                                                                        'x-uid':
                                                                                                          'k7r752iwwd5',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      '3hduhm9mz36',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': '7zuhu25svbi',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                              sckuusv6msv: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component':
                                                                                                  'Grid.Row',
                                                                                                properties: {
                                                                                                  '15osna9mddn': {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Col',
                                                                                                    properties: {
                                                                                                      m2oOfTarget2: {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'string',
                                                                                                        'x-designer':
                                                                                                          'FormItem.Designer',
                                                                                                        'x-component':
                                                                                                          'CollectionField',
                                                                                                        'x-decorator':
                                                                                                          'FormItem',
                                                                                                        'x-collection-field':
                                                                                                          'T2615Target2.m2oOfTarget2',
                                                                                                        'x-component-props':
                                                                                                          {},
                                                                                                        'x-uid':
                                                                                                          '74cv1njsuun',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'av4n8b963yx',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'rfkz4hhvner',
                                                                                                'x-async': false,
                                                                                                'x-index': 2,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'xq6xht5akci',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': '9jr86f58foi',
                                                                                        'x-async': false,
                                                                                      },
                                                                                    },
                                                                                    'x-async': false,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'vxhthrams8z',
                                                                                'x-async': false,
                                                                              },
                                                                            },
                                                                            'x-uid': 'd7agqc58s51',
                                                                            'x-async': false,
                                                                          },
                                                                        },
                                                                        'x-uid': 'uk9vpzq4pnj',
                                                                        'x-async': false,
                                                                      },
                                                                      actions: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-initializer': 'editForm:configureActions',
                                                                        'x-component': 'ActionBar',
                                                                        'x-component-props': {
                                                                          layout: 'one-column',
                                                                          style: {
                                                                            marginTop: 24,
                                                                          },
                                                                        },
                                                                        'x-index': 2,
                                                                        'x-uid': 'v632h6tvnme',
                                                                        'x-async': false,
                                                                      },
                                                                    },
                                                                    'x-uid': '1wqcw49vvf7',
                                                                    'x-async': false,
                                                                  },
                                                                },
                                                                'x-uid': 'nyfys5ovl5w',
                                                                'x-async': false,
                                                              },
                                                            },
                                                            'x-uid': 'tpwfljzj6jt',
                                                            'x-async': false,
                                                          },
                                                        },
                                                        'x-uid': 'klaug32w9fs',
                                                        'x-async': false,
                                                      },
                                                    },
                                                    'x-uid': 'um1sus2iors',
                                                    'x-async': false,
                                                  },
                                                },
                                                'x-uid': 'ezv19uwk15h',
                                                'x-async': false,
                                              },
                                            },
                                            'x-uid': 'nbprm1hziow',
                                            'x-async': false,
                                          },
                                        },
                                        'x-uid': '88xlxa1wznb',
                                        'x-async': false,
                                      },
                                    },
                                    'x-uid': 'oa9csm0i30h',
                                    'x-async': false,
                                  },
                                  t452of8muaq: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: 'View record',
                                    'x-action': 'view',
                                    'x-designer': 'Action.Designer',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'drawer',
                                      danger: false,
                                    },
                                    'x-decorator': 'ACLActionProvider',
                                    'x-designer-props': {
                                      linkageAction: true,
                                    },
                                    'x-index': 2,
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
                                        'x-index': 1,
                                        properties: {
                                          tabs: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Tabs',
                                            'x-component-props': {},
                                            'x-initializer': 'TabPaneInitializers',
                                            'x-index': 1,
                                            properties: {
                                              tab1: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                title: '{{t("Details")}}',
                                                'x-component': 'Tabs.TabPane',
                                                'x-designer': 'Tabs.Designer',
                                                'x-component-props': {},
                                                'x-index': 1,
                                                properties: {
                                                  grid: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid',
                                                    'x-initializer': 'popup:common:addBlock',
                                                    'x-index': 1,
                                                    properties: {
                                                      nlnfd9hnl53: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-index': 1,
                                                        properties: {
                                                          o1mvvolrr3n: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-index': 1,
                                                            properties: {
                                                              '02tm0tr9gie': {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action': 'T2615:get',
                                                                'x-decorator': 'FormBlockProvider',
                                                                'x-decorator-props': {
                                                                  resource: 'T2615',
                                                                  collection: 'T2615',
                                                                  readPretty: true,
                                                                  action: 'get',
                                                                  useParams: '{{ useParamsFromRecord }}',
                                                                  useSourceId: '{{ useSourceIdFromParentRecord }}',
                                                                },
                                                                'x-designer': 'FormV2.ReadPrettyDesigner',
                                                                'x-component': 'CardItem',
                                                                'x-index': 1,
                                                                properties: {
                                                                  xa10ops1tmr: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'FormV2',
                                                                    'x-read-pretty': true,
                                                                    'x-component-props': {
                                                                      useProps: '{{ useFormBlockProps }}',
                                                                    },
                                                                    'x-index': 1,
                                                                    properties: {
                                                                      actions: {
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
                                                                        'x-index': 1,
                                                                        'x-uid': 'j14isfxwsue',
                                                                        'x-async': false,
                                                                      },
                                                                      grid: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid',
                                                                        'x-initializer': 'details:configureFields',
                                                                        'x-index': 2,
                                                                        properties: {
                                                                          j9mxulol74m: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            'x-index': 1,
                                                                            properties: {
                                                                              r4alweypz03: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                'x-index': 1,
                                                                                properties: {
                                                                                  m2o: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field': 'T2615.m2o',
                                                                                    'x-component-props': {},
                                                                                    'x-index': 1,
                                                                                    'x-uid': 'x3rmljeq2cp',
                                                                                    'x-async': false,
                                                                                  },
                                                                                },
                                                                                'x-uid': '2csk6wqip9t',
                                                                                'x-async': false,
                                                                              },
                                                                            },
                                                                            'x-uid': '9kw27wn78fi',
                                                                            'x-async': false,
                                                                          },
                                                                          xb97qr5ustn: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            'x-index': 2,
                                                                            properties: {
                                                                              wje8oyfbn1d: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                'x-index': 1,
                                                                                properties: {
                                                                                  'm2o.m2oOfTarget1': {
                                                                                    'x-uid': 'yax1x9facdc',
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-read-pretty': true,
                                                                                    'x-component-props': {
                                                                                      'pattern-disable': true,
                                                                                      fieldNames: {
                                                                                        label: 'id',
                                                                                        value: 'id',
                                                                                      },
                                                                                      mode: 'Nester',
                                                                                    },
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field':
                                                                                      'T2615.m2o.m2oOfTarget1',
                                                                                    'x-index': 1,
                                                                                    properties: {
                                                                                      '025zh9o3ey9': {
                                                                                        _isJSONSchemaObject: true,
                                                                                        version: '2.0',
                                                                                        type: 'void',
                                                                                        'x-component':
                                                                                          'AssociationField.Nester',
                                                                                        'x-index': 1,
                                                                                        properties: {
                                                                                          grid: {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            'x-component': 'Grid',
                                                                                            'x-initializer':
                                                                                              'form:configureFields',
                                                                                            properties: {
                                                                                              c5mcb8foh05: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component':
                                                                                                  'Grid.Row',
                                                                                                properties: {
                                                                                                  cdxgpdl0ygx: {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Col',
                                                                                                    properties: {
                                                                                                      id: {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'string',
                                                                                                        'x-designer':
                                                                                                          'FormItem.Designer',
                                                                                                        'x-component':
                                                                                                          'CollectionField',
                                                                                                        'x-decorator':
                                                                                                          'FormItem',
                                                                                                        'x-collection-field':
                                                                                                          'T2615Target2.id',
                                                                                                        'x-component-props':
                                                                                                          {},
                                                                                                        'x-read-pretty':
                                                                                                          true,
                                                                                                        'x-uid':
                                                                                                          '52n1wmp7uc9',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'xpir96php8c',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'd0pnmwckejl',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                              '7mn5oytntt3': {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component':
                                                                                                  'Grid.Row',
                                                                                                properties: {
                                                                                                  dh2la7dad9l: {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Col',
                                                                                                    properties: {
                                                                                                      m2oOfTarget2: {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'string',
                                                                                                        'x-designer':
                                                                                                          'FormItem.Designer',
                                                                                                        'x-component':
                                                                                                          'CollectionField',
                                                                                                        'x-decorator':
                                                                                                          'FormItem',
                                                                                                        'x-collection-field':
                                                                                                          'T2615Target2.m2oOfTarget2',
                                                                                                        'x-component-props':
                                                                                                          {},
                                                                                                        'x-uid':
                                                                                                          'jbhrkr56jzm',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'khgwbf72ldf',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'vaddvt91z5v',
                                                                                                'x-async': false,
                                                                                                'x-index': 2,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'jfhkqtlqzng',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': 'wc0npkmsoro',
                                                                                        'x-async': false,
                                                                                      },
                                                                                    },
                                                                                    'x-async': false,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'y70rl9d06uj',
                                                                                'x-async': false,
                                                                              },
                                                                            },
                                                                            'x-uid': 'lgn85q6uj17',
                                                                            'x-async': false,
                                                                          },
                                                                        },
                                                                        'x-uid': '8w5c5hak1gr',
                                                                        'x-async': false,
                                                                      },
                                                                    },
                                                                    'x-uid': 'whvoy1l9hj9',
                                                                    'x-async': false,
                                                                  },
                                                                },
                                                                'x-uid': 'e84i0kfwhbf',
                                                                'x-async': false,
                                                              },
                                                            },
                                                            'x-uid': 'smmxsrl51a8',
                                                            'x-async': false,
                                                          },
                                                        },
                                                        'x-uid': 'ow16bzbg6ug',
                                                        'x-async': false,
                                                      },
                                                    },
                                                    'x-uid': 'ai4yry7e0vc',
                                                    'x-async': false,
                                                  },
                                                },
                                                'x-uid': '57iueiaapm4',
                                                'x-async': false,
                                              },
                                            },
                                            'x-uid': 'ai5i8ek5xw1',
                                            'x-async': false,
                                          },
                                        },
                                        'x-uid': 'x4lflnwlshu',
                                        'x-async': false,
                                      },
                                    },
                                    'x-uid': '2hlltge34f6',
                                    'x-async': false,
                                  },
                                },
                                'x-uid': '3zx8qacchqt',
                                'x-async': false,
                              },
                            },
                            'x-uid': 'jzvgiopg3tb',
                            'x-async': false,
                          },
                        },
                        'x-uid': 'dampx66bp7j',
                        'x-async': false,
                      },
                    },
                    'x-uid': 'il72zotxejz',
                    'x-async': false,
                  },
                },
                'x-uid': 'igvr5bmn6wg',
                'x-async': false,
              },
            },
            'x-uid': 'ggvkrz6cc9r',
            'x-async': false,
          },
        },
        'x-uid': 'mikatwm1nop',
        'x-async': false,
      },
    },
    'x-uid': 'sv7dxotrdmq',
    'x-async': true,
  },
};

export const T2200 = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      n7k4be0tpgt: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          ai6ojrzwkiv: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              amsy67ggjr3: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  ajob701dt18: {
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
                        'x-initializer': 'table:configureActions',
                        'x-component': 'ActionBar',
                        'x-component-props': {
                          style: {
                            marginBottom: 'var(--nb-spacing)',
                          },
                        },
                        'x-uid': 'farfrcvsydq',
                        'x-async': false,
                        'x-index': 1,
                      },
                      t1o3f4r1j4q: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'array',
                        'x-initializer': 'table:configureColumns',
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
                            'x-initializer': 'table:configureItemActions',
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
                                properties: {
                                  ezur2k7gz8k: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{ t("Edit") }}',
                                    'x-action': 'update',
                                    'x-designer': 'Action.Designer',
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
                                            'x-initializer': 'TabPaneInitializers',
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
                                                      dv88ljcl0qw: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        properties: {
                                                          '548w29v01eb': {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            properties: {
                                                              q83tzsynghl: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action-props': {
                                                                  skipScopeCheck: false,
                                                                },
                                                                'x-acl-action': 'users:update',
                                                                'x-decorator': 'FormBlockProvider',
                                                                'x-decorator-props': {
                                                                  useSourceId: '{{ useSourceIdFromParentRecord }}',
                                                                  useParams: '{{ useParamsFromRecord }}',
                                                                  action: 'get',
                                                                  resource: 'users',
                                                                  collection: 'users',
                                                                },
                                                                'x-designer': 'FormV2.Designer',
                                                                'x-component': 'CardItem',
                                                                'x-component-props': {},
                                                                properties: {
                                                                  '8kzqujhwsyl': {
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
                                                                        'x-initializer': 'form:configureFields',
                                                                        properties: {
                                                                          '3i87cpmv87x': {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            properties: {
                                                                              am7wls8qu12: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                properties: {
                                                                                  roles: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-designer': 'FormItem.Designer',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field': 'users.roles',
                                                                                    'x-component-props': {},
                                                                                    'x-uid': 'e196r19yspx',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'ato3s57xtbt',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'dx3bqu24t50',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'rjbjrnn88sq',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                      actions: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-initializer': 'editForm:configureActions',
                                                                        'x-component': 'ActionBar',
                                                                        'x-component-props': {
                                                                          layout: 'one-column',
                                                                          style: {
                                                                            marginTop: 24,
                                                                          },
                                                                        },
                                                                        'x-uid': 'zh8o2drtd9h',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': 'ytafkst3w0s',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': 'ioqb8wteiwr',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'iavf0r5sl2n',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': '994dlhgh1iz',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'k390f3n1rz7',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'xm264vyzmkf',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'asl2rgfrz7p',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'xfre469n0yi',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'gdjgqvxv6b1',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'fnctj4uc8xy',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '2dc4d3mlw3k',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': '51i2scjmis1',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': '75owqo6visj',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'r4bvdbzinup',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'h066j2xouwn',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'qrkik5iy790',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': '3vzzy7tipgq',
    'x-async': true,
    'x-index': 1,
  },
};

export const T3106: PageConfig = {
  collections: generalWithM2oSingleSelect,
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-index': 1,
    properties: {
      '1lqiou007g2': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-index': 1,
        properties: {
          cxk2aa058lc: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-index': 1,
            properties: {
              '4ulo13u15kt': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-index': 1,
                properties: {
                  '5mflo02rgff': {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action-props': {
                      skipScopeCheck: true,
                    },
                    'x-acl-action': 'general:create',
                    'x-decorator': 'FormBlockProvider',
                    'x-decorator-props': {
                      resource: 'general',
                      collection: 'general',
                    },
                    'x-designer': 'FormV2.Designer',
                    'x-component': 'CardItem',
                    'x-component-props': {},
                    'x-index': 1,
                    properties: {
                      ucvfcgnna36: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'FormV2',
                        'x-component-props': {
                          useProps: '{{ useFormBlockProps }}',
                        },
                        'x-index': 1,
                        properties: {
                          grid: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'form:configureFields',
                            'x-index': 1,
                            properties: {
                              wbvuzjzl83g: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                properties: {
                                  azpa6sirla4: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
                                    properties: {
                                      oneToMany: {
                                        'x-uid': 'eia8l8nfir4',
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'string',
                                        'x-designer': 'FormItem.Designer',
                                        'x-component': 'CollectionField',
                                        'x-decorator': 'FormItem',
                                        'x-collection-field': 'general.oneToMany',
                                        'x-component-props': {
                                          mode: 'SubTable',
                                        },
                                        default: null,
                                        properties: {
                                          '7lmlkxgw1b5': {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'AssociationField.SubTable',
                                            'x-initializer': 'table:configureColumns',
                                            'x-initializer-props': {
                                              action: false,
                                            },
                                            'x-index': 1,
                                            properties: {
                                              ymdcw5r51n4: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-decorator': 'TableV2.Column.Decorator',
                                                'x-designer': 'TableV2.Column.Designer',
                                                'x-component': 'TableV2.Column',
                                                properties: {
                                                  nickname: {
                                                    'x-uid': 'mb9f1rt5ntz',
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    'x-collection-field': 'users.nickname',
                                                    'x-component': 'CollectionField',
                                                    'x-component-props': {
                                                      ellipsis: true,
                                                    },
                                                    'x-decorator': 'FormItem',
                                                    'x-decorator-props': {
                                                      labelStyle: {
                                                        display: 'none',
                                                      },
                                                    },
                                                    default: 'test name',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'jfom9bv2q4x',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': '050ngca24nq',
                                            'x-async': false,
                                          },
                                        },
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'wtb8ez642ve',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'u8bc0cw1f3d',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'qz6evwj5dg0',
                            'x-async': false,
                          },
                          actions: {
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
                            'x-index': 2,
                            properties: {
                              rzvo5hzdj7o: {
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
                                'x-uid': 'rju16bgspem',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'gahv9zkc6v3',
                            'x-async': false,
                          },
                        },
                        'x-uid': '93hi2qyh1ku',
                        'x-async': false,
                      },
                    },
                    'x-uid': 'y2pyetixul3',
                    'x-async': false,
                  },
                },
                'x-uid': '2zy0gr02px1',
                'x-async': false,
              },
            },
            'x-uid': '80kyofmv32j',
            'x-async': false,
          },
        },
        'x-uid': 'dtvu1pmc6um',
        'x-async': false,
      },
    },
    'x-uid': 'i10t0bkpvlq',
    'x-async': true,
  },
};

export const T3251: PageConfig = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      wthxmf7a7vt: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          xovhjqo0uig: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              e6ltgswudd5: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  zhip07zf2sk: {
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
                      o14tnfwmiah: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'FormV2',
                        'x-component-props': {
                          useProps: '{{ useFormBlockProps }}',
                        },
                        properties: {
                          grid: {
                            'x-uid': 'fcczneadfb7',
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'form:configureFields',
                            'x-linkage-rules': [
                              {
                                condition: {
                                  $and: [
                                    {
                                      nickname: {
                                        $includes: 'nickname',
                                      },
                                    },
                                    {
                                      $and: [
                                        {
                                          username: {
                                            $includes: 'username',
                                          },
                                        },
                                      ],
                                    },
                                  ],
                                },
                                actions: [
                                  {
                                    targetFields: ['email'],
                                    operator: 'disabled',
                                  },
                                ],
                              },
                            ],
                            properties: {
                              gjzekanhi3t: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                properties: {
                                  ql3al6wtn1j: {
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
                                        'x-uid': 'by956vuuq17',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': '67iwm2hgafu',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': '66ccfjw2mqq',
                                'x-async': false,
                                'x-index': 1,
                              },
                              iw013a1ahid: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                properties: {
                                  frgfw52u7q1: {
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
                                        'x-uid': 'en26umyz49e',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'oc78q5uf599',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'xf0m0i82wx6',
                                'x-async': false,
                                'x-index': 2,
                              },
                              xeop5qaq5wo: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                properties: {
                                  x1uk4pvrsrj: {
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
                                        'x-uid': 'ow19p5g3ed3',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': '25jhpf6i8mi',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'ujz8f344x8l',
                                'x-async': false,
                                'x-index': 3,
                              },
                            },
                            'x-async': false,
                            'x-index': 1,
                          },
                          c1nzoyb7v3f: {
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
                            'x-uid': 'vnkbks8htxa',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'kwjha09k4k3',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': '8zffjdnv1ps',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'j2l9f3xw0j9',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'tqovgfp1kw0',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'kwi4lems81c',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'zq9yecy6wri',
    'x-async': true,
    'x-index': 1,
  },
};

export const T3469: PageConfig = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-index': 1,
    properties: {
      '9u463vapg0k': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-index': 1,
        properties: {
          isaxpp1w32b: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-index': 1,
            properties: {
              '5dld0j6dehi': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-index': 1,
                properties: {
                  '96xwhprgfdg': {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action-props': {
                      skipScopeCheck: true,
                    },
                    'x-acl-action': 'users:create',
                    'x-decorator': 'FormBlockProvider',
                    'x-decorator-props': {
                      dataSource: 'main',
                      resource: 'users',
                      collection: 'users',
                    },
                    'x-toolbar': 'BlockSchemaToolbar',
                    'x-settings': 'blockSettings:createForm',
                    'x-component': 'CardItem',
                    'x-component-props': {},
                    'x-index': 1,
                    properties: {
                      '0sj1sfgjoxa': {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'FormV2',
                        'x-component-props': {
                          useProps: '{{ useFormBlockProps }}',
                        },
                        'x-index': 1,
                        properties: {
                          grid: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'form:configureFields',
                            'x-index': 1,
                            properties: {
                              e4ke3wqxm2o: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                'x-index': 1,
                                properties: {
                                  l8uf6qeppmb: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
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
                                        default: 'Should be cleared after submission',
                                        'x-index': 1,
                                        'x-uid': 'lpgebrm0gig',
                                        'x-async': false,
                                      },
                                    },
                                    'x-uid': 'novdv1tcz37',
                                    'x-async': false,
                                  },
                                },
                                'x-uid': 'kzf3dxvr0mb',
                                'x-async': false,
                              },
                              s17cswscq2o: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                properties: {
                                  oh79jnxzotw: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
                                    properties: {
                                      username: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'string',
                                        'x-toolbar': 'FormItemSchemaToolbar',
                                        'x-settings': 'fieldSettings:FormItem',
                                        'x-component': 'CollectionField',
                                        'x-decorator': 'FormItem',
                                        'x-collection-field': 'users.username',
                                        'x-component-props': {},
                                        'x-uid': 'z9dn5rnc3oi',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': '62vb90prmzk',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'ti5u46epv08',
                                'x-async': false,
                                'x-index': 2,
                              },
                            },
                            'x-uid': 'e365kp0cwm9',
                            'x-async': false,
                          },
                          '7660qws6e4c': {
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
                            'x-index': 2,
                            properties: {
                              '79tmpu1usft': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                title: '{{ t("Submit") }}',
                                'x-action': 'submit',
                                'x-component': 'Action',
                                'x-toolbar': 'ActionSchemaToolbar',
                                'x-settings': 'actionSettings:createSubmit',
                                'x-component-props': {
                                  type: 'primary',
                                  htmlType: 'submit',
                                  useProps: '{{ useCreateActionProps }}',
                                },
                                'x-action-settings': {
                                  triggerWorkflows: [],
                                },
                                type: 'void',
                                'x-index': 1,
                                'x-uid': '96sageysorb',
                                'x-async': false,
                              },
                            },
                            'x-uid': 'nnn377hn4o4',
                            'x-async': false,
                          },
                        },
                        'x-uid': 'j5qpwo8d6su',
                        'x-async': false,
                      },
                    },
                    'x-uid': 'rlcmlnna7k8',
                    'x-async': false,
                  },
                },
                'x-uid': 'b6n82zkmrsh',
                'x-async': false,
              },
            },
            'x-uid': 'agdpemeoz1v',
            'x-async': false,
          },
        },
        'x-uid': 'dn5nok8na2g',
        'x-async': false,
      },
    },
    'x-uid': 'lb8hlm9oyv8',
    'x-async': true,
  },
};

// https://nocobase.height.app/T-3529
export const T3529: PageConfig = {
  collections: generalWithMultiLevelM2mFields,
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      '5i47muli5of': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          l62athlwjbe: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              gv12rstt0n6: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  '44sjepqege8': {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'general:list',
                    'x-decorator-props': {
                      collection: 'general',
                      dataSource: 'main',
                      resource: 'general',
                      action: 'list',
                      params: {
                        pageSize: 20,
                      },
                      rowKey: 'id',
                      showIndex: true,
                      dragSort: false,
                      disableTemplate: false,
                    },
                    'x-toolbar': 'BlockSchemaToolbar',
                    'x-settings': 'blockSettings:table',
                    'x-component': 'CardItem',
                    'x-filter-targets': [],
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
                        'x-uid': 'gcqzwfc98cz',
                        'x-async': false,
                        'x-index': 1,
                      },
                      cndkuudjlrn: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'array',
                        'x-initializer': 'table:configureColumns',
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
                            'x-initializer': 'table:configureItemActions',
                            properties: {
                              '7glkmum3znh': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                properties: {
                                  '34feo0sq1b1': {
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
                                            'x-initializer': 'TabPaneInitializers',
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
                                                      '5ubuvb82lbu': {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        properties: {
                                                          pe6vly71p50: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            properties: {
                                                              ls6i68y4q5r: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action-props': {
                                                                  skipScopeCheck: true,
                                                                },
                                                                'x-acl-action': 'general.m2mField0:create',
                                                                'x-decorator': 'FormBlockProvider',
                                                                'x-decorator-props': {
                                                                  useSourceId: '{{ useSourceIdFromParentRecord }}',
                                                                  useParams: '{{ useParamsFromRecord }}',
                                                                  action: null,
                                                                  dataSource: 'main',
                                                                  resource: 'general.m2mField0',
                                                                  collection: 'm2mField1',
                                                                  association: 'general.m2mField0',
                                                                },
                                                                'x-toolbar': 'BlockSchemaToolbar',
                                                                'x-settings': 'blockSettings:createForm',
                                                                'x-component': 'CardItem',
                                                                'x-component-props': {},
                                                                properties: {
                                                                  '4g1wyduvzzq': {
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
                                                                        'x-initializer': 'form:configureFields',
                                                                        'x-uid': 'aigmsbzdyeb',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                      v5tx6a8ya3q: {
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
                                                                        properties: {
                                                                          dhmchgjzu2d: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            title: '{{ t("Submit") }}',
                                                                            'x-action': 'submit',
                                                                            'x-component': 'Action',
                                                                            'x-toolbar': 'ActionSchemaToolbar',
                                                                            'x-settings': 'actionSettings:createSubmit',
                                                                            'x-component-props': {
                                                                              type: 'primary',
                                                                              htmlType: 'submit',
                                                                              useProps: '{{ useCreateActionProps }}',
                                                                            },
                                                                            'x-action-settings': {
                                                                              triggerWorkflows: [],
                                                                            },
                                                                            type: 'void',
                                                                            'x-uid': 'bgi90aunfbx',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': '6m4zb9wz65e',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': 'sbl64rh18y4',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': 'z76kadyn2d8',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'kb89ln0xf6j',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'zyqb93i3dfg',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'zxthz54u0wr',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': '4vis0296ryj',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'p23nq2w7s15',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'zaqeevlcwap',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'r1tzkph9sg3',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': '2k7344qkff4',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'jozmqdix3a6',
                            'x-async': false,
                            'x-index': 1,
                          },
                          exdcwiv8fnb: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            properties: {
                              m2mField0: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'general.m2mField0',
                                'x-component': 'CollectionField',
                                'x-component-props': {
                                  fieldNames: {
                                    value: 'id',
                                    label: 'id',
                                  },
                                  ellipsis: true,
                                  size: 'small',
                                },
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-uid': 'gzktad04dhq',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'fulrpp42vr2',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': '6rucf9up8f4',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'izfl6h66ch4',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'i8m1l6l6qg5',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'v0y71zujt89',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'vpa330z2xp5',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'l4kzvh7mdoa',
    'x-async': true,
    'x-index': 1,
  },
};

export const T3806: PageConfig = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      '6w8tkq3665g': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          '0k0yifwylj8': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              v5cdqnvyh3z: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  p9pszqbz1n5: {
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
                      '578cg3ao40s': {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'FormV2',
                        'x-use-component-props': 'useCreateFormBlockProps',
                        properties: {
                          grid: {
                            'x-uid': 'xpdqjz634mt',
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'form:configureFields',
                            'x-linkage-rules': [
                              {
                                condition: {
                                  $and: [],
                                },
                                actions: [
                                  {
                                    targetFields: ['username'],
                                    operator: 'value',
                                    value: {
                                      mode: 'express',
                                      value: '{{$nForm.nickname}}',
                                      result: '{{$nForm.nickname}}',
                                    },
                                  },
                                ],
                              },
                            ],
                            properties: {
                              gjck905cyws: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                properties: {
                                  i041myizzph: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
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
                                        'x-uid': 'afnfoxl5cbi',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'a3o7l08zz6e',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'zoakp82dymw',
                                'x-async': false,
                                'x-index': 1,
                              },
                              qffoo7lqua1: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                properties: {
                                  nq0rbuti1d9: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
                                    properties: {
                                      username: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'string',
                                        'x-toolbar': 'FormItemSchemaToolbar',
                                        'x-settings': 'fieldSettings:FormItem',
                                        'x-component': 'CollectionField',
                                        'x-decorator': 'FormItem',
                                        'x-collection-field': 'users.username',
                                        'x-component-props': {},
                                        'x-uid': 'mq80n8nyuq8',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'hf9bq4vjm80',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'ua08izsl514',
                                'x-async': false,
                                'x-index': 2,
                              },
                            },
                            'x-async': false,
                            'x-index': 1,
                          },
                          '006ip4mnr75': {
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
                            'x-uid': 'u6d026lia1x',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'p7ucl8ixcx4',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'hz9xoui3o9d',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'j1q201o2wju',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 't0olm6ygvas',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'aq4i1y0nf00',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'px8uapyslvw',
    'x-async': true,
    'x-index': 1,
  },
};

export const T3815: PageConfig = {
  collections: [
    {
      name: 'general',
      title: 'general',
      fields: [
        {
          key: '1uk7lqex9o4',
          name: 'number',
          type: 'double',
          interface: 'number',
          description: null,
          collectionName: 'general',
          parentKey: null,
          reverseKey: null,
          uiSchema: {
            'x-component-props': {
              step: '1',
              stringMode: true,
            },
            type: 'number',
            'x-component': 'InputNumber',
            title: 'number',
          },
        },
        {
          key: 'ymhle3x0w86',
          name: 'RadioGroup',
          type: 'string',
          interface: 'radioGroup',
          description: null,
          collectionName: 'general',
          parentKey: null,
          reverseKey: null,
          uiSchema: {
            enum: [
              {
                value: '001',
                label: '001',
              },
              {
                value: '002',
                label: '002',
              },
              {
                value: '003',
                label: '003',
              },
            ],
            type: 'string',
            'x-component': 'Radio.Group',
            title: 'RadioGroup',
          },
        },
        {
          key: 'bnmn0f12yz1',
          name: 'select',
          type: 'string',
          interface: 'select',
          description: null,
          collectionName: 'general',
          parentKey: null,
          reverseKey: null,
          uiSchema: {
            enum: [
              {
                value: '001',
                label: '001',
              },
              {
                value: '002',
                label: '002',
              },
            ],
            type: 'string',
            'x-component': 'Select',
            title: 'select',
          },
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
      nhr8mj576ht: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          p6xjvwkmmeq: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              mttf5p61t1x: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  '4tzpzqss38o': {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'general:list',
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'general',
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
                        properties: {
                          '1o0e395gfsh': {
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
                                            'x-initializer': 'popup:addNew:addBlock',
                                            properties: {
                                              '4fsnnaaestz': {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid.Row',
                                                properties: {
                                                  osb7r02dhfu: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid.Col',
                                                    properties: {
                                                      jid8ny6v3mj: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-acl-action-props': {
                                                          skipScopeCheck: true,
                                                        },
                                                        'x-acl-action': 'general:create',
                                                        'x-decorator': 'FormBlockProvider',
                                                        'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
                                                        'x-decorator-props': {
                                                          dataSource: 'main',
                                                          collection: 'general',
                                                        },
                                                        'x-toolbar': 'BlockSchemaToolbar',
                                                        'x-settings': 'blockSettings:createForm',
                                                        'x-component': 'CardItem',
                                                        properties: {
                                                          '2eeu8jiuxwa': {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'FormV2',
                                                            'x-use-component-props': 'useCreateFormBlockProps',
                                                            properties: {
                                                              grid: {
                                                                'x-uid': '7x8aol12h2w',
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-component': 'Grid',
                                                                'x-initializer': 'form:configureFields',
                                                                'x-linkage-rules': [
                                                                  {
                                                                    condition: {
                                                                      $and: [
                                                                        {
                                                                          RadioGroup: {
                                                                            $eq: '001',
                                                                          },
                                                                        },
                                                                      ],
                                                                    },
                                                                    actions: [
                                                                      {
                                                                        targetFields: ['number'],
                                                                        operator: 'value',
                                                                        value: {
                                                                          mode: 'constant',
                                                                          value: 88,
                                                                        },
                                                                      },
                                                                    ],
                                                                  },
                                                                ],
                                                                properties: {
                                                                  noz6nzl8na7: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'Grid.Row',
                                                                    properties: {
                                                                      sdzg1t5dw7h: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid.Col',
                                                                        properties: {
                                                                          RadioGroup: {
                                                                            'x-uid': 'xks5rpnseko',
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'string',
                                                                            'x-toolbar': 'FormItemSchemaToolbar',
                                                                            'x-settings': 'fieldSettings:FormItem',
                                                                            'x-component': 'CollectionField',
                                                                            'x-decorator': 'FormItem',
                                                                            'x-collection-field': 'general.RadioGroup',
                                                                            'x-component-props': {},
                                                                            default: '001',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'qz7vzsndftl',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                    },
                                                                    'x-uid': 'hsx84f2y6ua',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                  '55y5v9xzhrr': {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'Grid.Row',
                                                                    properties: {
                                                                      kllmw9omiy0: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid.Col',
                                                                        properties: {
                                                                          number: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'string',
                                                                            'x-toolbar': 'FormItemSchemaToolbar',
                                                                            'x-settings': 'fieldSettings:FormItem',
                                                                            'x-component': 'CollectionField',
                                                                            'x-decorator': 'FormItem',
                                                                            'x-collection-field': 'general.number',
                                                                            'x-component-props': {},
                                                                            'x-uid': '4qwesoyn2lv',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'oqgux8bvwus',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                    },
                                                                    'x-uid': 'cpky70ftn7n',
                                                                    'x-async': false,
                                                                    'x-index': 2,
                                                                  },
                                                                },
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                              t6s3uqz32i3: {
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
                                                                properties: {
                                                                  e77n01j6706: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    title: '{{ t("Submit") }}',
                                                                    'x-action': 'submit',
                                                                    'x-component': 'Action',
                                                                    'x-toolbar': 'ActionSchemaToolbar',
                                                                    'x-settings': 'actionSettings:createSubmit',
                                                                    'x-component-props': {
                                                                      type: 'primary',
                                                                      htmlType: 'submit',
                                                                      useProps: '{{ useCreateActionProps }}',
                                                                    },
                                                                    'x-action-settings': {
                                                                      triggerWorkflows: [],
                                                                    },
                                                                    type: 'void',
                                                                    'x-uid': 'i3m7mcprpsj',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': 'qgfh4mnqn47',
                                                                'x-async': false,
                                                                'x-index': 2,
                                                              },
                                                            },
                                                            'x-uid': 'yt356mb8su8',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'bir25av2h8c',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'yw8lzedzqa8',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': '2ali05rbh1t',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'cavysdb03y0',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'ghzaxyk7qj2',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': '2753r2whfbk',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'wm3t5fa9kbd',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '5esm05tfs46',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': '5buucn2bfe7',
                        'x-async': false,
                        'x-index': 1,
                      },
                      tpibv7vu56j: {
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
                            properties: {
                              ig2hd5z6klq: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                properties: {
                                  xyh1a9t00fx: {
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
                                            'x-initializer': 'TabPaneInitializers',
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
                                                      cpjlt6mmwzd: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        properties: {
                                                          jf9arnl1c1s: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            properties: {
                                                              '9ip2xowsjjv': {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action-props': {
                                                                  skipScopeCheck: false,
                                                                },
                                                                'x-acl-action': 'general:update',
                                                                'x-decorator': 'FormBlockProvider',
                                                                'x-use-decorator-props':
                                                                  'useEditFormBlockDecoratorProps',
                                                                'x-decorator-props': {
                                                                  action: 'get',
                                                                  dataSource: 'main',
                                                                  collection: 'general',
                                                                },
                                                                'x-toolbar': 'BlockSchemaToolbar',
                                                                'x-settings': 'blockSettings:editForm',
                                                                'x-component': 'CardItem',
                                                                properties: {
                                                                  icc7ijerfsm: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'FormV2',
                                                                    'x-use-component-props': 'useEditFormBlockProps',
                                                                    properties: {
                                                                      grid: {
                                                                        'x-uid': 'r6h74xj4jeo',
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid',
                                                                        'x-initializer': 'form:configureFields',
                                                                        'x-linkage-rules': [
                                                                          {
                                                                            condition: {
                                                                              $and: [
                                                                                {
                                                                                  RadioGroup: {
                                                                                    $empty: true,
                                                                                  },
                                                                                },
                                                                              ],
                                                                            },
                                                                            actions: [
                                                                              {
                                                                                targetFields: ['number'],
                                                                                operator: 'value',
                                                                                value: {
                                                                                  mode: 'constant',
                                                                                  value: 33,
                                                                                },
                                                                              },
                                                                            ],
                                                                          },
                                                                        ],
                                                                        properties: {
                                                                          allz7qqlxuk: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            properties: {
                                                                              gjvql4asspw: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                properties: {
                                                                                  RadioGroup: {
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
                                                                                      'general.RadioGroup',
                                                                                    'x-component-props': {},
                                                                                    'x-uid': 'e25m7niryeq',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'oecqrrznd0v',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'dduijjct95t',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                          trhja7zflmm: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            properties: {
                                                                              xf5cb7vo6ct: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                properties: {
                                                                                  number: {
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
                                                                                      'general.number',
                                                                                    'x-component-props': {},
                                                                                    'x-uid': 'vb1n12dt6bn',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'ifh8nu58qj3',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'soiv7nthgdg',
                                                                            'x-async': false,
                                                                            'x-index': 2,
                                                                          },
                                                                        },
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                      v3b9ap97bd2: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-initializer': 'editForm:configureActions',
                                                                        'x-component': 'ActionBar',
                                                                        'x-component-props': {
                                                                          layout: 'one-column',
                                                                          style: {
                                                                            marginTop: 24,
                                                                          },
                                                                        },
                                                                        'x-uid': 'rircmjh6moa',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': 'enxcig2gaes',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': '3oqp9l1k6af',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': '8bdt3qp62te',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'cxj16fgweac',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'e3l5tbygcyc',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'dui5obth7od',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'uyhhcn2go29',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': '8tmovl28ezr',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'cb2pq303nq1',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': '4wqf7u004dt',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'glisvno0yqy',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'jm0bu0makzv',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'q768rtdam1p',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'blf1f85fvce',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'hkj1q8tqey9',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': '6ij3k3ipjbe',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': '6dw4ah33eku',
    'x-async': true,
    'x-index': 1,
  },
};

export const T3871 = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      '9m9all1p4zp': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          '02tzq7atdt9': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              lzghz2pgvhl: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  '8v40jcgmklo': {
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
                      g5pkiijx0wn: {
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
                              evuq8pvgfcr: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                properties: {
                                  '6n9154vafdv': {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
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
                                        'x-uid': 'mzvgz6glxqd',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'zjckd4w7qh7',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'e0qznur08gc',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'opgc9jr6aar',
                            'x-async': false,
                            'x-index': 1,
                          },
                          '5f6hdxq53sj': {
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
                            'x-uid': 'a5xkzlansfz',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': '38xmbrv5jy8',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'ky4f5fkk9qg',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'ivzzj1f6cy8',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'k4ewrek5ch0',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'xpgviu9rqkm',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'v6u5vhjt0b6',
    'x-async': true,
    'x-index': 1,
  },
};
export const T3953 = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-app-version': '0.21.0-alpha.6',
    properties: {
      n666dtj6omu: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-app-version': '0.21.0-alpha.6',
        properties: {
          '9z4u9212i9d': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '0.21.0-alpha.6',
            properties: {
              syjj7mksnk1: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '0.21.0-alpha.6',
                properties: {
                  lv2u3j85fue: {
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
                    'x-app-version': '0.21.0-alpha.6',
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
                        'x-app-version': '0.21.0-alpha.6',
                        'x-uid': '9y1rpremah0',
                        'x-async': false,
                        'x-index': 1,
                      },
                      wrg1doc2s25: {
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
                        'x-app-version': '0.21.0-alpha.6',
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
                            'x-app-version': '0.21.0-alpha.6',
                            properties: {
                              li0jrjj5xzd: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '0.21.0-alpha.6',
                                properties: {
                                  lw1i9nvgj69: {
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
                                                      whxl1gjy2i1: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '0.21.0-alpha.6',
                                                        properties: {
                                                          ngbr0vzmply: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '0.21.0-alpha.6',
                                                            properties: {
                                                              muushivmktf: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action-props': {
                                                                  skipScopeCheck: true,
                                                                },
                                                                'x-acl-action': 'users.roles:create',
                                                                'x-decorator': 'FormBlockProvider',
                                                                'x-use-decorator-props':
                                                                  'useCreateFormBlockDecoratorProps',
                                                                'x-decorator-props': {
                                                                  dataSource: 'main',
                                                                  association: 'users.roles',
                                                                },
                                                                'x-toolbar': 'BlockSchemaToolbar',
                                                                'x-settings': 'blockSettings:createForm',
                                                                'x-component': 'CardItem',
                                                                'x-app-version': '0.21.0-alpha.6',
                                                                properties: {
                                                                  '4q1wobzy33u': {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'FormV2',
                                                                    'x-use-component-props': 'useCreateFormBlockProps',
                                                                    'x-app-version': '0.21.0-alpha.6',
                                                                    properties: {
                                                                      grid: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid',
                                                                        'x-initializer': 'form:configureFields',
                                                                        'x-app-version': '0.21.0-alpha.6',
                                                                        properties: {
                                                                          v84lrgs188k: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            'x-app-version': '0.21.0-alpha.6',
                                                                            properties: {
                                                                              '75qkhwgryu3': {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                'x-app-version': '0.21.0-alpha.6',
                                                                                properties: {
                                                                                  title: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-toolbar':
                                                                                      'FormItemSchemaToolbar',
                                                                                    'x-settings':
                                                                                      'fieldSettings:FormItem',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field': 'roles.title',
                                                                                    'x-component-props': {},
                                                                                    'x-app-version': '0.21.0-alpha.6',
                                                                                    'x-uid': 'mrh2r6j0oy1',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'fuzhfebdlft',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': '5e9kmlywtpu',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'abmijedxpmw',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                      '5aqhq3fck0w': {
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
                                                                        'x-app-version': '0.21.0-alpha.6',
                                                                        properties: {
                                                                          pji7mkqbg5w: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            title: '{{ t("Submit") }}',
                                                                            'x-action': 'submit',
                                                                            'x-component': 'Action',
                                                                            'x-use-component-props':
                                                                              'useCreateActionProps',
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
                                                                            'x-app-version': '0.21.0-alpha.6',
                                                                            'x-uid': 'ehlamh5jond',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'xpv3riybuuw',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': '46usos5j9c6',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': 'cdr83eb368w',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'bw993qtjlrz',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'tipccl4y5b8',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'x9xofyyfeso',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'mcucnbxpx76',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': '3208vu2vv5j',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'tdpo6b5f0n8',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'e3fqdkzfvy3',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'rnttf38vdco',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'naezr8t9rd6',
                            'x-async': false,
                            'x-index': 1,
                          },
                          wz4sx2in3zm: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '0.21.0-alpha.6',
                            properties: {
                              roles: {
                                'x-uid': 'l1i2ebbn5yp',
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'users.roles',
                                'x-component': 'CollectionField',
                                'x-component-props': {
                                  fieldNames: {
                                    label: 'title',
                                    value: 'name',
                                  },
                                  ellipsis: true,
                                  size: 'small',
                                },
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-app-version': '0.21.0-alpha.6',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'r1ag1f5w96p',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'oofh9gz63w5',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': '0ih4jhp49gd',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '5ubrq8koffa',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'dfnkmkw8u24',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': '5979mzb49da',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'fm798ucrett',
    'x-async': true,
    'x-index': 1,
  },
};

export const T3979: PageConfig = {
  collections: [
    {
      name: 'general',
      fields: [
        {
          key: 'rpxo494ufro',
          name: 'id',
          type: 'bigInt',
          interface: 'integer',
          description: null,
          collectionName: 'general',
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
          key: 'zwr5gak2xne',
          name: 'f_ay6rnz23q81',
          type: 'bigInt',
          interface: 'integer',
          description: null,
          collectionName: 'general',
          parentKey: null,
          reverseKey: null,
          isForeignKey: true,
          uiSchema: {
            type: 'number',
            title: 'f_ay6rnz23q81',
            'x-component': 'InputNumber',
            'x-read-pretty': true,
          },
        },
        {
          key: '42vzuonn27s',
          name: 'createdAt',
          type: 'date',
          interface: 'createdAt',
          description: null,
          collectionName: 'general',
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
          key: 'q3p9rbgvtix',
          name: 'createdBy',
          type: 'belongsTo',
          interface: 'createdBy',
          description: null,
          collectionName: 'general',
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
          key: '6l3j9ffbavm',
          name: 'updatedAt',
          type: 'date',
          interface: 'updatedAt',
          description: null,
          collectionName: 'general',
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
          key: 'vlitghmo9e4',
          name: 'updatedBy',
          type: 'belongsTo',
          interface: 'updatedBy',
          description: null,
          collectionName: 'general',
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
        {
          key: 'ga1xaptx2m5',
          name: 'f_4jozl4andtv',
          type: 'belongsTo',
          interface: 'm2o',
          description: null,
          collectionName: 'general',
          parentKey: null,
          reverseKey: null,
          foreignKey: 'f_ay6rnz23q81',
          onDelete: 'SET NULL',
          uiSchema: {
            'x-component': 'AssociationField',
            'x-component-props': {
              multiple: false,
            },
            title: 'user',
          },
          target: 'users',
          targetKey: 'id',
        },
      ],
    },
  ],
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-app-version': '0.21.0-alpha.6',
    properties: {
      '0osui04l650': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-app-version': '0.21.0-alpha.6',
        properties: {
          '3vwwts1qhfi': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '0.21.0-alpha.6',
            properties: {
              gnpakgl904x: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '0.21.0-alpha.6',
                properties: {
                  e1y9qp0um5a: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'general:list',
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'general',
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
                    'x-app-version': '0.21.0-alpha.6',
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
                        'x-app-version': '0.21.0-alpha.6',
                        properties: {
                          c5ctl0tju3g: {
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
                            'x-align': 'right',
                            'x-acl-action-props': {
                              skipScopeCheck: true,
                            },
                            'x-app-version': '0.21.0-alpha.6',
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
                                'x-app-version': '0.21.0-alpha.6',
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
                                    'x-app-version': '0.21.0-alpha.6',
                                    properties: {
                                      tab1: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        title: '{{t("Add new")}}',
                                        'x-component': 'Tabs.TabPane',
                                        'x-designer': 'Tabs.Designer',
                                        'x-component-props': {},
                                        'x-app-version': '0.21.0-alpha.6',
                                        properties: {
                                          grid: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Grid',
                                            'x-initializer': 'popup:addNew:addBlock',
                                            'x-app-version': '0.21.0-alpha.6',
                                            properties: {
                                              i087pxwwooh: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid.Row',
                                                'x-app-version': '0.21.0-alpha.6',
                                                properties: {
                                                  sg0dc5npnc4: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid.Col',
                                                    'x-app-version': '0.21.0-alpha.6',
                                                    properties: {
                                                      d3yrtf44e5o: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-acl-action-props': {
                                                          skipScopeCheck: true,
                                                        },
                                                        'x-acl-action': 'general:create',
                                                        'x-decorator': 'FormBlockProvider',
                                                        'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
                                                        'x-decorator-props': {
                                                          dataSource: 'main',
                                                          collection: 'general',
                                                        },
                                                        'x-toolbar': 'BlockSchemaToolbar',
                                                        'x-settings': 'blockSettings:createForm',
                                                        'x-component': 'CardItem',
                                                        'x-app-version': '0.21.0-alpha.6',
                                                        properties: {
                                                          zo3ueve2fe4: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'FormV2',
                                                            'x-use-component-props': 'useCreateFormBlockProps',
                                                            'x-app-version': '0.21.0-alpha.6',
                                                            properties: {
                                                              grid: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-component': 'Grid',
                                                                'x-initializer': 'form:configureFields',
                                                                'x-app-version': '0.21.0-alpha.6',
                                                                properties: {
                                                                  '4kz58m4p1ge': {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'Grid.Row',
                                                                    'x-app-version': '0.21.0-alpha.6',
                                                                    properties: {
                                                                      sm4cp07nna2: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid.Col',
                                                                        'x-app-version': '0.21.0-alpha.6',
                                                                        properties: {
                                                                          f_4jozl4andtv: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'string',
                                                                            'x-toolbar': 'FormItemSchemaToolbar',
                                                                            'x-settings': 'fieldSettings:FormItem',
                                                                            'x-component': 'CollectionField',
                                                                            'x-decorator': 'FormItem',
                                                                            'x-collection-field':
                                                                              'general.f_4jozl4andtv',
                                                                            'x-component-props': {
                                                                              fieldNames: {
                                                                                value: 'id',
                                                                                label: 'id',
                                                                              },
                                                                            },
                                                                            'x-app-version': '0.21.0-alpha.6',
                                                                            'x-uid': 'dwiggk4w4io',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'vthdr7ci1sm',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                    },
                                                                    'x-uid': '6q68zb0uals',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': 'n7637yzqcbq',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                              '80zytylsm1f': {
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
                                                                'x-app-version': '0.21.0-alpha.6',
                                                                properties: {
                                                                  '3gwww31ss2v': {
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
                                                                    'x-app-version': '0.21.0-alpha.6',
                                                                    'x-uid': '3nd6tzxwals',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': 'ax9xnhiuh2f',
                                                                'x-async': false,
                                                                'x-index': 2,
                                                              },
                                                            },
                                                            'x-uid': 'lcl7dnngk2e',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'v8w6pvj2wyj',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'det88qfvr6i',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'c5wt7syr5tk',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'q28facon923',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'kxgpkg0qirl',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'm0c622mltj2',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'cf2ad1u233x',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '63qns05ztgz',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'e3tr6vsw64p',
                        'x-async': false,
                        'x-index': 1,
                      },
                      tzemisxecwn: {
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
                        'x-app-version': '0.21.0-alpha.6',
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
                            'x-app-version': '0.21.0-alpha.6',
                            properties: {
                              ytsbuk3byb7: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '0.21.0-alpha.6',
                                'x-uid': 'nli0xiyvodh',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'dwh5nu7rdo6',
                            'x-async': false,
                            'x-index': 1,
                          },
                          '1z5ghlb5d8s': {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '0.21.0-alpha.6',
                            properties: {
                              f_4jozl4andtv: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'general.f_4jozl4andtv',
                                'x-component': 'CollectionField',
                                'x-component-props': {
                                  fieldNames: {
                                    value: 'id',
                                    label: 'id',
                                  },
                                  ellipsis: true,
                                  size: 'small',
                                },
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-app-version': '0.21.0-alpha.6',
                                properties: {
                                  hdqa75xvpgi: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{ t("View record") }}',
                                    'x-component': 'AssociationField.Viewer',
                                    'x-component-props': {
                                      className: 'nb-action-popup',
                                    },
                                    'x-index': 1,
                                    'x-app-version': '0.21.0-alpha.6',
                                    properties: {
                                      tabs: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        'x-component': 'Tabs',
                                        'x-component-props': {},
                                        'x-initializer': 'popup:addTab',
                                        'x-app-version': '0.21.0-alpha.6',
                                        properties: {
                                          tab1: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            title: '{{t("Details")}}',
                                            'x-component': 'Tabs.TabPane',
                                            'x-designer': 'Tabs.Designer',
                                            'x-component-props': {},
                                            'x-app-version': '0.21.0-alpha.6',
                                            properties: {
                                              grid: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid',
                                                'x-initializer': 'popup:common:addBlock',
                                                'x-app-version': '0.21.0-alpha.6',
                                                properties: {
                                                  nzyxfgv72na: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid.Row',
                                                    'x-app-version': '0.21.0-alpha.6',
                                                    properties: {
                                                      uwrfz3kzoao: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Col',
                                                        'x-app-version': '0.21.0-alpha.6',
                                                        properties: {
                                                          '7s7dpheeku7': {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-decorator': 'TableBlockProvider',
                                                            'x-acl-action': 'undefined:list',
                                                            'x-use-decorator-props': 'useTableBlockDecoratorProps',
                                                            'x-decorator-props': {
                                                              association: 'users.roles',
                                                              dataSource: 'main',
                                                              action: 'list',
                                                              params: {
                                                                pageSize: 20,
                                                              },
                                                              rowKey: 'name',
                                                              showIndex: true,
                                                              dragSort: false,
                                                            },
                                                            'x-toolbar': 'BlockSchemaToolbar',
                                                            'x-settings': 'blockSettings:table',
                                                            'x-component': 'CardItem',
                                                            'x-filter-targets': [],
                                                            'x-app-version': '0.21.0-alpha.6',
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
                                                                'x-app-version': '0.21.0-alpha.6',
                                                                properties: {
                                                                  '0gh9ejdo0l4': {
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
                                                                    'x-align': 'right',
                                                                    'x-acl-action-props': {
                                                                      skipScopeCheck: true,
                                                                    },
                                                                    'x-app-version': '0.21.0-alpha.6',
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
                                                                        'x-app-version': '0.21.0-alpha.6',
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
                                                                            'x-app-version': '0.21.0-alpha.6',
                                                                            properties: {
                                                                              tab1: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                title: '{{t("Add new")}}',
                                                                                'x-component': 'Tabs.TabPane',
                                                                                'x-designer': 'Tabs.Designer',
                                                                                'x-component-props': {},
                                                                                'x-app-version': '0.21.0-alpha.6',
                                                                                properties: {
                                                                                  grid: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'void',
                                                                                    'x-component': 'Grid',
                                                                                    'x-initializer':
                                                                                      'popup:addNew:addBlock',
                                                                                    'x-app-version': '0.21.0-alpha.6',
                                                                                    'x-uid': 'mgks7usp454',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'd1jgitzca3j',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'pjdiacug4c2',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': '3v73tpwq65y',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                    },
                                                                    'x-uid': '84uiovnwe0k',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': 'd1cuw6cyi18',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                              '4gspy2pqurh': {
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
                                                                'x-app-version': '0.21.0-alpha.6',
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
                                                                    'x-app-version': '0.21.0-alpha.6',
                                                                    properties: {
                                                                      qs986rjoczh: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-decorator': 'DndContext',
                                                                        'x-component': 'Space',
                                                                        'x-component-props': {
                                                                          split: '|',
                                                                        },
                                                                        'x-app-version': '0.21.0-alpha.6',
                                                                        'x-uid': '7cqescd8bmh',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                    },
                                                                    'x-uid': '1mt5dw050o8',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': 'cit3pdz0kba',
                                                                'x-async': false,
                                                                'x-index': 2,
                                                              },
                                                            },
                                                            'x-uid': 'idb290wr61g',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'wtqcusee4fd',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': '2qqec1x4j3w',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'oanidkvi9fs',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'qxwgw2ckxz4',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': '8zue3a5kk0f',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': '9vg0jwas3m3',
                                    'x-async': false,
                                  },
                                },
                                'x-uid': 'y193btra52j',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'e11uargvejv',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'iogsquqt02v',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': '29nrge6glvj',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'h8vnhofv1yr',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'zpyiipi79b2',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'ent3zuqrhyh',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'gsl3rfifzh5',
    'x-async': true,
    'x-index': 1,
  },
};
export const oneTableWithUsersForDeprecatedVariables = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      '0kf7f0ilx5p': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          '7nkrwaiut3c': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '0.21.0-alpha.12',
            properties: {
              okrwqoxd83x: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '0.21.0-alpha.12',
                properties: {
                  h00mdakub1n: {
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
                    'x-app-version': '0.21.0-alpha.12',
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
                        'x-app-version': '0.21.0-alpha.12',
                        'x-uid': 'esse5o4398b',
                        'x-async': false,
                        'x-index': 1,
                      },
                      '630zp06en3b': {
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
                        'x-app-version': '0.21.0-alpha.12',
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
                            'x-app-version': '0.21.0-alpha.12',
                            properties: {
                              '1my2j5tqtvu': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '0.21.0-alpha.12',
                                properties: {
                                  d0bwrtz9f7j: {
                                    'x-uid': '7mzammd9sbg',
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: 'Edit record',
                                    'x-action': 'update',
                                    'x-toolbar': 'ActionSchemaToolbar',
                                    'x-settings': 'actionSettings:edit',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'drawer',
                                      danger: false,
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
                                                      dq07f3u2u30: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '0.21.0-alpha.12',
                                                        properties: {
                                                          nxs6wg3n41c: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '0.21.0-alpha.12',
                                                            properties: {
                                                              mhk7rm0fw12: {
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
                                                                'x-app-version': '0.21.0-alpha.12',
                                                                properties: {
                                                                  '54b22mqfpmx': {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'FormV2',
                                                                    'x-use-component-props': 'useEditFormBlockProps',
                                                                    'x-app-version': '0.21.0-alpha.12',
                                                                    properties: {
                                                                      grid: {
                                                                        'x-uid': 'ufdkfceoidc',
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid',
                                                                        'x-initializer': 'form:configureFields',
                                                                        'x-app-version': '0.21.0-alpha.12',
                                                                        'x-linkage-rules': [
                                                                          {
                                                                            condition: {
                                                                              $and: [
                                                                                {
                                                                                  nickname: {
                                                                                    $includes: '{{$nRecord.nickname}}',
                                                                                  },
                                                                                },
                                                                              ],
                                                                            },
                                                                            actions: [
                                                                              {
                                                                                targetFields: ['nickname'],
                                                                                operator: 'value',
                                                                                value: {
                                                                                  mode: 'express',
                                                                                  value: '{{$nRecord.username}}',
                                                                                  result: '{{$nRecord.username}}',
                                                                                },
                                                                              },
                                                                            ],
                                                                          },
                                                                        ],
                                                                        properties: {
                                                                          g5r0oap3utr: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            'x-app-version': '0.21.0-alpha.12',
                                                                            properties: {
                                                                              lsugzv7lefq: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                'x-app-version': '0.21.0-alpha.12',
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
                                                                                    'x-app-version': '0.21.0-alpha.12',
                                                                                    'x-uid': '96ztt5zwj94',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'bx1yby02otk',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'ov7zgdkgw75',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                      iia8azf8515: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-initializer': 'editForm:configureActions',
                                                                        'x-component': 'ActionBar',
                                                                        'x-component-props': {
                                                                          layout: 'one-column',
                                                                          style: {
                                                                            marginTop: 24,
                                                                          },
                                                                        },
                                                                        'x-app-version': '0.21.0-alpha.12',
                                                                        properties: {
                                                                          m2ya2utojyv: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            title: '{{ t("Submit") }}',
                                                                            'x-action': 'submit',
                                                                            'x-component': 'Action',
                                                                            'x-use-component-props':
                                                                              'useUpdateActionProps',
                                                                            'x-toolbar': 'ActionSchemaToolbar',
                                                                            'x-settings': 'actionSettings:updateSubmit',
                                                                            'x-component-props': {
                                                                              type: 'primary',
                                                                              htmlType: 'submit',
                                                                            },
                                                                            'x-action-settings': {
                                                                              triggerWorkflows: [],
                                                                            },
                                                                            type: 'void',
                                                                            'x-app-version': '0.21.0-alpha.12',
                                                                            'x-uid': 'bk42qy23o72',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': '7l3e8eg5twd',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': 'hd2ivxz2yab',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': 'q66c3ygx762',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': '6lc4ohi2dro',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'e8wspaxavfr',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'ra8agi0pvsa',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'yos0bp0yikg',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': '45maugqwh7b',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'ksrayq74oxe',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-async': false,
                                    'x-index': 2,
                                  },
                                },
                                'x-uid': 'o0u2aidtwdw',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '14wmkjgx19j',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': '5bzwy79fbvz',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'qehg70dxj8b',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '1f9ilr6t1yn',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'fcvb1l15gv9',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': '2ahlv6ydwlp',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': '8uggi2e1r5s',
    'x-async': true,
    'x-index': 1,
  },
};

export const oneFormAndOneTableWithUsers: PageConfig = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-app-version': '0.21.0-alpha.13',
    'x-index': 1,
    properties: {
      a5je3qsyedz: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-app-version': '0.21.0-alpha.13',
        'x-index': 1,
        properties: {
          i19i3rr6vf1: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '0.21.0-alpha.15',
            'x-index': 1,
            properties: {
              hfwcy6caqnk: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '0.21.0-alpha.15',
                'x-index': 1,
                properties: {
                  tldnr8czm49: {
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
                    'x-app-version': '0.21.0-alpha.15',
                    'x-index': 1,
                    properties: {
                      '277vnh3hhj8': {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'FormV2',
                        'x-use-component-props': 'useCreateFormBlockProps',
                        'x-app-version': '0.21.0-alpha.15',
                        'x-index': 1,
                        properties: {
                          grid: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'form:configureFields',
                            'x-app-version': '0.21.0-alpha.15',
                            'x-index': 1,
                            'x-uid': 'ld0indfray1',
                            'x-async': false,
                          },
                          d9cn1kgxckc: {
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
                            'x-app-version': '0.21.0-alpha.15',
                            'x-index': 2,
                            'x-uid': 'k6zuwp7u9w6',
                            'x-async': false,
                          },
                        },
                        'x-uid': 'j8aw9rko2z3',
                        'x-async': false,
                      },
                    },
                    'x-uid': 'kgbqy1na2no',
                    'x-async': false,
                  },
                },
                'x-uid': 'wjnnhu9acbp',
                'x-async': false,
              },
            },
            'x-uid': '8g3dnjl6gg1',
            'x-async': false,
          },
          rwialdftgzc: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '0.21.0-alpha.15',
            'x-index': 2,
            properties: {
              kwnyh28foid: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '0.21.0-alpha.15',
                'x-index': 1,
                properties: {
                  luega8f3t66: {
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
                    'x-app-version': '0.21.0-alpha.15',
                    'x-index': 1,
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
                        'x-app-version': '0.21.0-alpha.15',
                        'x-index': 1,
                        properties: {
                          plqyq56bd1s: {
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
                            'x-app-version': '0.21.0-alpha.15',
                            'x-index': 1,
                            'x-uid': 'tekvxezs7fq',
                            'x-async': false,
                          },
                        },
                        'x-uid': 'pbiwv4v13ny',
                        'x-async': false,
                      },
                      '2bpww4bg6gl': {
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
                        'x-app-version': '0.21.0-alpha.15',
                        'x-index': 2,
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
                            'x-app-version': '0.21.0-alpha.15',
                            'x-index': 1,
                            properties: {
                              dp022t8opyt: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '0.21.0-alpha.15',
                                'x-index': 1,
                                'x-uid': 'weeiqquu365',
                                'x-async': false,
                              },
                            },
                            'x-uid': 'mrbnwas3bjj',
                            'x-async': false,
                          },
                          o86r52gopar: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '0.21.0-alpha.15',
                            'x-index': 2,
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
                                'x-app-version': '0.21.0-alpha.15',
                                'x-index': 1,
                                'x-uid': 'zhpnmk0jtlm',
                                'x-async': false,
                              },
                            },
                            'x-uid': 'qo0ipkzabor',
                            'x-async': false,
                          },
                        },
                        'x-uid': 'j24y8acxaih',
                        'x-async': false,
                      },
                    },
                    'x-uid': '9ypn04atyla',
                    'x-async': false,
                  },
                },
                'x-uid': 'cpb2pi4emkx',
                'x-async': false,
              },
            },
            'x-uid': 'sqzgc43tio1',
            'x-async': false,
          },
        },
        'x-uid': '2lsyffpy9uo',
        'x-async': false,
      },
    },
    'x-uid': 'u7zfdj6rpa5',
    'x-async': true,
  },
};
export const oneFormWithInheritFields = {
  collections: [
    {
      name: 'parent',
      fields: [
        {
          name: 'parentField1',
          interface: 'input',
        },
        {
          name: 'parentField2',
          interface: 'input',
        },
      ],
    },
    {
      name: 'child',
      fields: [
        {
          name: 'childField1',
          interface: 'input',
        },
        {
          name: 'childField2',
          interface: 'input',
        },
      ],
      inherits: ['parent'],
    },
  ],
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      '79kw0s9hd2t': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          '736hw3rfbbo': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '0.21.0-alpha.15',
            properties: {
              thsaywe90f0: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '0.21.0-alpha.15',
                properties: {
                  e1wo8fptwxq: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action-props': {
                      skipScopeCheck: true,
                    },
                    'x-acl-action': 'child:create',
                    'x-decorator': 'FormBlockProvider',
                    'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
                    'x-decorator-props': {
                      dataSource: 'main',
                      collection: 'child',
                    },
                    'x-toolbar': 'BlockSchemaToolbar',
                    'x-settings': 'blockSettings:createForm',
                    'x-component': 'CardItem',
                    'x-app-version': '0.21.0-alpha.15',
                    properties: {
                      '8f3ol7eyevs': {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'FormV2',
                        'x-use-component-props': 'useCreateFormBlockProps',
                        'x-app-version': '0.21.0-alpha.15',
                        properties: {
                          grid: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'form:configureFields',
                            'x-app-version': '0.21.0-alpha.15',
                            'x-uid': 'hpydlgpgdyp',
                            'x-async': false,
                            'x-index': 1,
                          },
                          lmexf0nzjgb: {
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
                            'x-app-version': '0.21.0-alpha.15',
                            'x-uid': 'i818vw5tv0g',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'xkj4q44w6ym',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': 't6ajhkkuys0',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'm6wz53dmfdu',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': '8x6245ii9nu',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'xtmna5prya7',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'cossd0o2fyh',
    'x-async': true,
    'x-index': 1,
  },
};
export const T4350 = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      '6g3up1ixn0e': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          zz6jm0ypeow: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.0.0-alpha.15',
            properties: {
              nfjwzwfooil: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.0.0-alpha.15',
                properties: {
                  eb5tj6m8078: {
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
                    'x-app-version': '1.0.0-alpha.15',
                    properties: {
                      qlagkj74r5l: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'FormV2',
                        'x-use-component-props': 'useCreateFormBlockProps',
                        'x-app-version': '1.0.0-alpha.15',
                        properties: {
                          grid: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'form:configureFields',
                            'x-app-version': '1.0.0-alpha.15',
                            properties: {
                              tmebz10558q: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                'x-app-version': '1.0.0-alpha.15',
                                properties: {
                                  wazwegnmu6m: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
                                    'x-app-version': '1.0.0-alpha.15',
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
                                        'x-app-version': '1.0.0-alpha.15',
                                        'x-uid': 'hcl36ww08lq',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                      roles: {
                                        'x-uid': '9rb5v1y2glu',
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
                                          mode: 'SubTable',
                                        },
                                        'x-app-version': '1.0.0-alpha.15',
                                        default: null,
                                        properties: {
                                          bjz9es8huix: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'AssociationField.SubTable',
                                            'x-initializer': 'table:configureColumns',
                                            'x-initializer-props': {
                                              action: false,
                                            },
                                            'x-index': 1,
                                            'x-app-version': '1.0.0-alpha.15',
                                            properties: {
                                              '9d5ov7v277m': {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-decorator': 'TableV2.Column.Decorator',
                                                'x-toolbar': 'TableColumnSchemaToolbar',
                                                'x-settings': 'fieldSettings:TableColumn',
                                                'x-component': 'TableV2.Column',
                                                'x-app-version': '1.0.0-alpha.15',
                                                properties: {
                                                  name: {
                                                    'x-uid': 'wpzetwze4ek',
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    'x-collection-field': 'roles.name',
                                                    'x-component': 'CollectionField',
                                                    'x-component-props': {
                                                      ellipsis: true,
                                                    },
                                                    'x-decorator': 'FormItem',
                                                    'x-decorator-props': {
                                                      labelStyle: {
                                                        display: 'none',
                                                      },
                                                    },
                                                    'x-app-version': '1.0.0-alpha.15',
                                                    default: '{{$nForm.nickname}}',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'narjenr4rkk',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                              '8vvqwrc5ess': {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-decorator': 'TableV2.Column.Decorator',
                                                'x-toolbar': 'TableColumnSchemaToolbar',
                                                'x-settings': 'fieldSettings:TableColumn',
                                                'x-component': 'TableV2.Column',
                                                'x-app-version': '1.0.0-alpha.15',
                                                properties: {
                                                  title: {
                                                    'x-uid': 'm51xrkffpmb',
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    'x-collection-field': 'roles.title',
                                                    'x-component': 'CollectionField',
                                                    'x-component-props': {
                                                      ellipsis: true,
                                                    },
                                                    'x-decorator': 'FormItem',
                                                    'x-decorator-props': {
                                                      labelStyle: {
                                                        display: 'none',
                                                      },
                                                    },
                                                    'x-app-version': '1.0.0-alpha.15',
                                                    default: '{{$iteration.name}}',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'dxytjbzzjkq',
                                                'x-async': false,
                                                'x-index': 2,
                                              },
                                            },
                                            'x-uid': 'csgvaip49jq',
                                            'x-async': false,
                                          },
                                        },
                                        'x-async': false,
                                        'x-index': 2,
                                      },
                                    },
                                    'x-uid': 'lyoupmqou5h',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': '6ur04dnm77v',
                                'x-async': false,
                                'x-index': 2,
                              },
                            },
                            'x-uid': 'u1pxwqssrj3',
                            'x-async': false,
                            'x-index': 1,
                          },
                          '2223820mphz': {
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
                            'x-app-version': '1.0.0-alpha.15',
                            properties: {
                              qzg24hn9ues: {
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
                                'x-app-version': '1.0.0-alpha.15',
                                'x-uid': 'yw4thogosv7',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'ox1we96hzow',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': '2son3avn14i',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': '5o81z2zb9ys',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '2bv5yv2xbhs',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': '98tya396a35',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'cl9bhyvlgue',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'ad7d05lkg3e',
    'x-async': true,
    'x-index': 1,
  },
};
export const expressionTemplateInLinkageRules = {
  collections: [
    {
      name: 'general1',
      fields: [
        {
          interface: 'm2m',
          name: 'm2m',
          target: 'general2',
        },
        {
          name: 'number1',
          interface: 'number',
        },
      ],
    },
    {
      name: 'general2',
      fields: [
        {
          name: 'number2',
          interface: 'number',
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
      a983qeowkws: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          '4hcplhhhjkd': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.0.0-alpha.17',
            properties: {
              '8vm4ku1ydvb': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.0.0-alpha.17',
                properties: {
                  vwr5s2ur5dq: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action-props': {
                      skipScopeCheck: true,
                    },
                    'x-acl-action': 'general1:create',
                    'x-decorator': 'FormBlockProvider',
                    'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
                    'x-decorator-props': {
                      dataSource: 'main',
                      collection: 'general1',
                    },
                    'x-toolbar': 'BlockSchemaToolbar',
                    'x-settings': 'blockSettings:createForm',
                    'x-component': 'CardItem',
                    'x-app-version': '1.0.0-alpha.17',
                    properties: {
                      arnq3dc33z2: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'FormV2',
                        'x-use-component-props': 'useCreateFormBlockProps',
                        'x-app-version': '1.0.0-alpha.17',
                        properties: {
                          grid: {
                            'x-uid': '4loai5g36vq',
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'form:configureFields',
                            'x-app-version': '1.0.0-alpha.17',
                            'x-linkage-rules': [
                              {
                                condition: {
                                  $and: [],
                                },
                                actions: [
                                  {
                                    targetFields: ['number1'],
                                    operator: 'value',
                                    value: {
                                      mode: 'express',
                                      value: 'SUM({{$nForm.m2m.number2}})',
                                      result: 'SUM({{$nForm.m2m.number2}})',
                                    },
                                  },
                                ],
                              },
                            ],
                            properties: {
                              '7ojiakwij91': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                'x-app-version': '1.0.0-alpha.17',
                                properties: {
                                  wqobiuf78k7: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
                                    'x-app-version': '1.0.0-alpha.17',
                                    properties: {
                                      m2m: {
                                        'x-uid': 'q2nspu2chvx',
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'string',
                                        'x-toolbar': 'FormItemSchemaToolbar',
                                        'x-settings': 'fieldSettings:FormItem',
                                        'x-component': 'CollectionField',
                                        'x-decorator': 'FormItem',
                                        'x-collection-field': 'general1.m2m',
                                        'x-component-props': {
                                          fieldNames: {
                                            label: 'id',
                                            value: 'id',
                                          },
                                          mode: 'SubTable',
                                        },
                                        'x-app-version': '1.0.0-alpha.17',
                                        default: null,
                                        properties: {
                                          c7xkm84bmt6: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'AssociationField.SubTable',
                                            'x-initializer': 'table:configureColumns',
                                            'x-initializer-props': {
                                              action: false,
                                            },
                                            'x-index': 1,
                                            'x-app-version': '1.0.0-alpha.17',
                                            properties: {
                                              oo3fc25zzad: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-decorator': 'TableV2.Column.Decorator',
                                                'x-toolbar': 'TableColumnSchemaToolbar',
                                                'x-settings': 'fieldSettings:TableColumn',
                                                'x-component': 'TableV2.Column',
                                                'x-app-version': '1.0.0-alpha.17',
                                                properties: {
                                                  number2: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    'x-collection-field': 'general2.number2',
                                                    'x-component': 'CollectionField',
                                                    'x-component-props': {},
                                                    'x-decorator': 'FormItem',
                                                    'x-decorator-props': {
                                                      labelStyle: {
                                                        display: 'none',
                                                      },
                                                    },
                                                    'x-app-version': '1.0.0-alpha.17',
                                                    'x-uid': '1ec44yt9vvc',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'fifizb929rl',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'vs0i5cea2lz',
                                            'x-async': false,
                                          },
                                        },
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'loi45wm38uc',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': '3mqmk65o5vj',
                                'x-async': false,
                                'x-index': 1,
                              },
                              ivo5sf0mer5: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                'x-app-version': '1.0.0-alpha.17',
                                properties: {
                                  m24lag9jftt: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
                                    'x-app-version': '1.0.0-alpha.17',
                                    properties: {
                                      number1: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'string',
                                        'x-toolbar': 'FormItemSchemaToolbar',
                                        'x-settings': 'fieldSettings:FormItem',
                                        'x-component': 'CollectionField',
                                        'x-decorator': 'FormItem',
                                        'x-collection-field': 'general1.number1',
                                        'x-component-props': {},
                                        'x-app-version': '1.0.0-alpha.17',
                                        'x-uid': '6ngy8dheikt',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'apnc7lgwbke',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'qvlz4twc80m',
                                'x-async': false,
                                'x-index': 2,
                              },
                            },
                            'x-async': false,
                            'x-index': 1,
                          },
                          ql31r9t3f0j: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-initializer': 'createForm:configureActions',
                            'x-component': 'ActionBar',
                            'x-component-props': {
                              layout: 'one-column',
                              style: {
                                marginTop: 'var(--nb-spacing)',
                              },
                            },
                            'x-app-version': '1.0.0-alpha.17',
                            'x-uid': 'ujy1hfdwh5z',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 's3wr5r6wopc',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'vf5sis7hzmy',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'kuzdktymvt9',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'o94tcqvgdy1',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'cxcm7gwygrz',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'mmhuwwmedwu',
    'x-async': true,
    'x-index': 1,
  },
};
export const T4596 = {
  collections: [
    {
      name: 'collectionC',
      fields: [
        {
          interface: 'input',
          name: 'singleLineText',
        },
      ],
    },
    {
      name: 'collectionB',
      fields: [
        {
          name: 'collectionBM2OField',
          interface: 'm2o',
          target: 'collectionC',
          sourceKey: 'sourceKey',
        },
        {
          name: 'sourceKey',
          interface: 'number',
        },
      ],
    },
    {
      name: 'collectionA',
      fields: [
        {
          name: 'collectionAM2OField',
          interface: 'm2o',
          target: 'collectionB',
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
      '8fabihs13u3': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-index': 1,
        properties: {
          '3nbfdp98hnv': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.2.4-alpha',
            'x-index': 1,
            properties: {
              e0hd016jask: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.2.4-alpha',
                'x-index': 1,
                properties: {
                  '1pmxkzimdau': {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action-props': {
                      skipScopeCheck: true,
                    },
                    'x-acl-action': 'collectionA:create',
                    'x-decorator': 'FormBlockProvider',
                    'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
                    'x-decorator-props': {
                      dataSource: 'main',
                      collection: 'collectionA',
                    },
                    'x-toolbar': 'BlockSchemaToolbar',
                    'x-settings': 'blockSettings:createForm',
                    'x-component': 'CardItem',
                    'x-app-version': '1.2.4-alpha',
                    'x-index': 1,
                    properties: {
                      '3nbd62urdzh': {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'FormV2',
                        'x-use-component-props': 'useCreateFormBlockProps',
                        'x-app-version': '1.2.4-alpha',
                        'x-index': 1,
                        properties: {
                          grid: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'form:configureFields',
                            'x-app-version': '1.2.4-alpha',
                            'x-index': 1,
                            properties: {
                              '2ljkh36y6n7': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                'x-app-version': '1.2.4-alpha',
                                'x-index': 1,
                                properties: {
                                  seg282crfdx: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
                                    'x-app-version': '1.2.4-alpha',
                                    'x-index': 1,
                                    properties: {
                                      collectionAM2OField: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'string',
                                        'x-toolbar': 'FormItemSchemaToolbar',
                                        'x-settings': 'fieldSettings:FormItem',
                                        'x-component': 'CollectionField',
                                        'x-decorator': 'FormItem',
                                        'x-collection-field': 'collectionA.collectionAM2OField',
                                        'x-component-props': {
                                          fieldNames: {
                                            label: 'id',
                                            value: 'id',
                                          },
                                        },
                                        'x-app-version': '1.2.4-alpha',
                                        'x-index': 1,
                                        'x-uid': 'do4yzr3scts',
                                        'x-async': false,
                                      },
                                    },
                                    'x-uid': 'f5omerdi0kn',
                                    'x-async': false,
                                  },
                                },
                                'x-uid': '1vxr8iqbc1m',
                                'x-async': false,
                              },
                              '8ez1aq0wv99': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                'x-app-version': '1.2.4-alpha',
                                'x-index': 2,
                                properties: {
                                  qxh5iov1310: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
                                    'x-app-version': '1.2.4-alpha',
                                    'x-index': 1,
                                    properties: {
                                      'collectionAM2OField.collectionBM2OField': {
                                        'x-uid': 'xm0dkxh1m8o',
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'string',
                                        'x-toolbar': 'FormItemSchemaToolbar',
                                        'x-settings': 'fieldSettings:FormItem',
                                        'x-component': 'CollectionField',
                                        'x-read-pretty': true,
                                        'x-component-props': {
                                          'pattern-disable': true,
                                          fieldNames: {
                                            label: 'singleLineText',
                                            value: 'id',
                                          },
                                        },
                                        'x-decorator': 'FormItem',
                                        'x-collection-field': 'collectionA.collectionAM2OField.collectionBM2OField',
                                        'x-app-version': '1.2.4-alpha',
                                        'x-index': 1,
                                        'x-async': false,
                                      },
                                    },
                                    'x-uid': '34edcrftixd',
                                    'x-async': false,
                                  },
                                },
                                'x-uid': 'ewykrxx0ln4',
                                'x-async': false,
                              },
                            },
                            'x-uid': 'wnea81u7ir5',
                            'x-async': false,
                          },
                          '2kbvvxyxgzj': {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-initializer': 'createForm:configureActions',
                            'x-component': 'ActionBar',
                            'x-component-props': {
                              layout: 'one-column',
                              style: {
                                marginTop: 'var(--nb-spacing)',
                              },
                            },
                            'x-app-version': '1.2.4-alpha',
                            'x-index': 2,
                            'x-uid': '0hstjjkvw9x',
                            'x-async': false,
                          },
                        },
                        'x-uid': 'qsxevezydxa',
                        'x-async': false,
                      },
                    },
                    'x-uid': 'zh9641pt4ws',
                    'x-async': false,
                  },
                },
                'x-uid': 'ps0spq4ya0k',
                'x-async': false,
              },
            },
            'x-uid': 'uy0bksjg6qk',
            'x-async': false,
          },
        },
        'x-uid': 'l5nc16o4pi5',
        'x-async': false,
      },
    },
    'x-uid': 'oqkl5enxwq1',
    'x-async': true,
  },
};
export const oneTableWithNestPopups = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-index': 1,
    properties: {
      zvj8cbqvt05: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-index': 1,
        properties: {
          j0zzcf3k2vc: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '0.21.0-alpha.6',
            'x-index': 1,
            properties: {
              pn0pgjxjlz2: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '0.21.0-alpha.6',
                'x-index': 1,
                properties: {
                  o9zor60xpvi: {
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
                    'x-app-version': '0.21.0-alpha.6',
                    'x-index': 1,
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
                        'x-app-version': '0.21.0-alpha.6',
                        'x-index': 1,
                        'x-uid': 'w9pvdbikqg3',
                        'x-async': false,
                      },
                      '3rr559rnt6k': {
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
                        'x-app-version': '0.21.0-alpha.6',
                        'x-index': 2,
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
                            'x-app-version': '0.21.0-alpha.6',
                            'x-index': 1,
                            properties: {
                              cf7dj1iffh3: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '0.21.0-alpha.6',
                                'x-index': 1,
                                properties: {
                                  oealnj6s2rw: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: 'View record',
                                    'x-action': 'view',
                                    'x-toolbar': 'ActionSchemaToolbar',
                                    'x-settings': 'actionSettings:view',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'drawer',
                                      danger: false,
                                    },
                                    'x-decorator': 'ACLActionProvider',
                                    'x-designer-props': {
                                      linkageAction: true,
                                    },
                                    'x-index': 1,
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
                                        'x-index': 1,
                                        properties: {
                                          tabs: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Tabs',
                                            'x-component-props': {},
                                            'x-initializer': 'popup:addTab',
                                            'x-index': 1,
                                            properties: {
                                              tab1: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                title: '{{t("Details")}}',
                                                'x-component': 'Tabs.TabPane',
                                                'x-designer': 'Tabs.Designer',
                                                'x-component-props': {},
                                                'x-index': 1,
                                                properties: {
                                                  grid: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid',
                                                    'x-initializer': 'popup:common:addBlock',
                                                    'x-index': 1,
                                                    properties: {
                                                      o3az953k64s: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '1.2.7-alpha',
                                                        properties: {
                                                          '09c7dcvslhi': {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '1.2.7-alpha',
                                                            properties: {
                                                              xv84k1hns7x: {
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
                                                                'x-app-version': '1.2.7-alpha',
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
                                                                    'x-app-version': '1.2.7-alpha',
                                                                    properties: {
                                                                      h6qhcp7es4z: {
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
                                                                        'x-align': 'right',
                                                                        'x-acl-action-props': {
                                                                          skipScopeCheck: true,
                                                                        },
                                                                        'x-app-version': '1.2.7-alpha',
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
                                                                            'x-app-version': '1.2.7-alpha',
                                                                            properties: {
                                                                              tabs: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Tabs',
                                                                                'x-component-props': {},
                                                                                'x-initializer': 'popup:addTab',
                                                                                'x-initializer-props': {
                                                                                  gridInitializer:
                                                                                    'popup:addNew:addBlock',
                                                                                },
                                                                                'x-app-version': '1.2.7-alpha',
                                                                                properties: {
                                                                                  tab1: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'void',
                                                                                    title: '{{t("Add new")}}',
                                                                                    'x-component': 'Tabs.TabPane',
                                                                                    'x-designer': 'Tabs.Designer',
                                                                                    'x-component-props': {},
                                                                                    'x-app-version': '1.2.7-alpha',
                                                                                    properties: {
                                                                                      grid: {
                                                                                        _isJSONSchemaObject: true,
                                                                                        version: '2.0',
                                                                                        type: 'void',
                                                                                        'x-component': 'Grid',
                                                                                        'x-initializer':
                                                                                          'popup:addNew:addBlock',
                                                                                        'x-app-version': '1.2.7-alpha',
                                                                                        properties: {
                                                                                          '84oe9zbk4i3': {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            'x-component': 'Grid.Row',
                                                                                            'x-app-version':
                                                                                              '1.2.7-alpha',
                                                                                            properties: {
                                                                                              g1ye1zczjy0: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component':
                                                                                                  'Grid.Col',
                                                                                                'x-app-version':
                                                                                                  '1.2.7-alpha',
                                                                                                properties: {
                                                                                                  '9boifjys3jn': {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-acl-action-props':
                                                                                                      {
                                                                                                        skipScopeCheck:
                                                                                                          true,
                                                                                                      },
                                                                                                    'x-acl-action':
                                                                                                      'users:create',
                                                                                                    'x-decorator':
                                                                                                      'FormBlockProvider',
                                                                                                    'x-use-decorator-props':
                                                                                                      'useCreateFormBlockDecoratorProps',
                                                                                                    'x-decorator-props':
                                                                                                      {
                                                                                                        dataSource:
                                                                                                          'main',
                                                                                                        collection:
                                                                                                          'users',
                                                                                                      },
                                                                                                    'x-toolbar':
                                                                                                      'BlockSchemaToolbar',
                                                                                                    'x-settings':
                                                                                                      'blockSettings:createForm',
                                                                                                    'x-component':
                                                                                                      'CardItem',
                                                                                                    'x-app-version':
                                                                                                      '1.2.7-alpha',
                                                                                                    properties: {
                                                                                                      rmsurarncfw: {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'void',
                                                                                                        'x-component':
                                                                                                          'FormV2',
                                                                                                        'x-use-component-props':
                                                                                                          'useCreateFormBlockProps',
                                                                                                        'x-app-version':
                                                                                                          '1.2.7-alpha',
                                                                                                        properties: {
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
                                                                                                              '1.2.7-alpha',
                                                                                                            properties:
                                                                                                              {
                                                                                                                akmulvncf99:
                                                                                                                  {
                                                                                                                    _isJSONSchemaObject:
                                                                                                                      true,
                                                                                                                    version:
                                                                                                                      '2.0',
                                                                                                                    type: 'void',
                                                                                                                    'x-component':
                                                                                                                      'Grid.Row',
                                                                                                                    'x-app-version':
                                                                                                                      '1.2.7-alpha',
                                                                                                                    properties:
                                                                                                                      {
                                                                                                                        nmmv2oujq4y:
                                                                                                                          {
                                                                                                                            _isJSONSchemaObject:
                                                                                                                              true,
                                                                                                                            version:
                                                                                                                              '2.0',
                                                                                                                            type: 'void',
                                                                                                                            'x-component':
                                                                                                                              'Grid.Col',
                                                                                                                            'x-app-version':
                                                                                                                              '1.2.7-alpha',
                                                                                                                            properties:
                                                                                                                              {
                                                                                                                                nickname:
                                                                                                                                  {
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
                                                                                                                                      'users.nickname',
                                                                                                                                    'x-component-props':
                                                                                                                                      {},
                                                                                                                                    'x-app-version':
                                                                                                                                      '1.2.7-alpha',
                                                                                                                                    'x-uid':
                                                                                                                                      'owh5563gdur',
                                                                                                                                    'x-async':
                                                                                                                                      false,
                                                                                                                                    'x-index': 1,
                                                                                                                                  },
                                                                                                                              },
                                                                                                                            'x-uid':
                                                                                                                              'bneikj8s65s',
                                                                                                                            'x-async':
                                                                                                                              false,
                                                                                                                            'x-index': 1,
                                                                                                                          },
                                                                                                                      },
                                                                                                                    'x-uid':
                                                                                                                      '6dq0qny7x7y',
                                                                                                                    'x-async':
                                                                                                                      false,
                                                                                                                    'x-index': 1,
                                                                                                                  },
                                                                                                              },
                                                                                                            'x-uid':
                                                                                                              'c6fz7t7skty',
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                            'x-index': 1,
                                                                                                          },
                                                                                                          '6b7iqambrl7':
                                                                                                            {
                                                                                                              _isJSONSchemaObject:
                                                                                                                true,
                                                                                                              version:
                                                                                                                '2.0',
                                                                                                              type: 'void',
                                                                                                              'x-initializer':
                                                                                                                'createForm:configureActions',
                                                                                                              'x-component':
                                                                                                                'ActionBar',
                                                                                                              'x-component-props':
                                                                                                                {
                                                                                                                  layout:
                                                                                                                    'one-column',
                                                                                                                  style:
                                                                                                                    {
                                                                                                                      marginTop:
                                                                                                                        'var(--nb-spacing)',
                                                                                                                    },
                                                                                                                },
                                                                                                              'x-app-version':
                                                                                                                '1.2.7-alpha',
                                                                                                              'x-uid':
                                                                                                                'iz5qh7pzfdl',
                                                                                                              'x-async':
                                                                                                                false,
                                                                                                              'x-index': 2,
                                                                                                            },
                                                                                                        },
                                                                                                        'x-uid':
                                                                                                          '6e80ocej2vr',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'nh98trp6j1i',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'q6q5sei1mky',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'xysmldkaxai',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': 'x0zp27tscd1',
                                                                                        'x-async': false,
                                                                                        'x-index': 1,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': 'mv1hedy02o5',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'jip3zywfel2',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'cweynnfbl16',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'jt5ud7f96h6',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                    },
                                                                    'x-uid': 'j9sx8xma2r0',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                  gjshpj169w3: {
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
                                                                    'x-app-version': '1.2.7-alpha',
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
                                                                        'x-app-version': '1.2.7-alpha',
                                                                        properties: {
                                                                          '6s1te9svg45': {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-decorator': 'DndContext',
                                                                            'x-component': 'Space',
                                                                            'x-component-props': {
                                                                              split: '|',
                                                                            },
                                                                            'x-app-version': '1.2.7-alpha',
                                                                            properties: {
                                                                              v2uyliqmu3s: {
                                                                                'x-uid': 'e2csion4yer',
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                title: 'View in popup',
                                                                                'x-action': 'view',
                                                                                'x-toolbar': 'ActionSchemaToolbar',
                                                                                'x-settings': 'actionSettings:view',
                                                                                'x-component': 'Action.Link',
                                                                                'x-component-props': {
                                                                                  openMode: 'drawer',
                                                                                  iconColor: '#1677FF',
                                                                                  danger: false,
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
                                                                                                'x-uid': 'qjvstlh8c3g',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'ast4jmympse',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': 'qc6nkjh7up0',
                                                                                        'x-async': false,
                                                                                        'x-index': 1,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': '33plknkxxgp',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'hx4i3ofxpax',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'yaowlbjo9nr',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                    },
                                                                    'x-uid': 'ezac62lon2k',
                                                                    'x-async': false,
                                                                    'x-index': 2,
                                                                  },
                                                                },
                                                                'x-uid': 'wh2b478biqn',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'npfxqga5wq5',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'w9rvitjqfoc',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 't3bzhtqt5vv',
                                                    'x-async': false,
                                                  },
                                                },
                                                'x-uid': 'n4rxef48z1x',
                                                'x-async': false,
                                              },
                                            },
                                            'x-uid': '56g3vhrv95f',
                                            'x-async': false,
                                          },
                                        },
                                        'x-uid': '9qq5b6kk5n3',
                                        'x-async': false,
                                      },
                                    },
                                    'x-uid': 'ae3e37qq83w',
                                    'x-async': false,
                                  },
                                },
                                'x-uid': '92lehcparox',
                                'x-async': false,
                              },
                            },
                            'x-uid': 'jek9wwqyz9m',
                            'x-async': false,
                          },
                        },
                        'x-uid': 'qw71i20y4ue',
                        'x-async': false,
                      },
                    },
                    'x-uid': 'kark3jk4bcl',
                    'x-async': false,
                  },
                },
                'x-uid': 'l4t5ymt09we',
                'x-async': false,
              },
            },
            'x-uid': 'puem6lfk26i',
            'x-async': false,
          },
        },
        'x-uid': 's3u70jb1bmr',
        'x-async': false,
      },
    },
    'x-uid': 'faokuf0k8lx',
    'x-async': true,
  },
};

export const T4891 = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-app-version': '1.2.22-alpha',
    properties: {
      p7ec8csgn5m: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-app-version': '1.2.22-alpha',
        properties: {
          fipjk1s5va8: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.2.22-alpha',
            properties: {
              zlf19lb14hs: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.2.22-alpha',
                properties: {
                  fjwbk9k41tb: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action-props': {
                      skipScopeCheck: true,
                    },
                    'x-acl-action': 'general:create',
                    'x-decorator': 'FormBlockProvider',
                    'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
                    'x-decorator-props': {
                      dataSource: 'main',
                      collection: 'general',
                    },
                    'x-toolbar': 'BlockSchemaToolbar',
                    'x-settings': 'blockSettings:createForm',
                    'x-component': 'CardItem',
                    'x-app-version': '1.2.22-alpha',
                    properties: {
                      xmabwei8v51: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'FormV2',
                        'x-use-component-props': 'useCreateFormBlockProps',
                        'x-app-version': '1.2.22-alpha',
                        properties: {
                          grid: {
                            'x-uid': 'thwwiietx3c',
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'form:configureFields',
                            'x-app-version': '1.2.22-alpha',
                            'x-linkage-rules': [
                              {
                                condition: {
                                  $and: [
                                    {
                                      select: {
                                        $eq: '111',
                                      },
                                    },
                                  ],
                                },
                                actions: [
                                  {
                                    targetFields: ['name'],
                                    operator: 'none',
                                  },
                                ],
                              },
                              {
                                condition: {
                                  $and: [
                                    {
                                      select: {
                                        $ne: '222',
                                      },
                                    },
                                  ],
                                },
                                actions: [
                                  {
                                    targetFields: ['name'],
                                    operator: 'required',
                                  },
                                ],
                              },
                            ],
                            properties: {
                              qz37m7j8p50: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                'x-app-version': '1.2.22-alpha',
                                properties: {
                                  gfj2a86vjfz: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
                                    'x-app-version': '1.2.22-alpha',
                                    properties: {
                                      select: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'string',
                                        'x-toolbar': 'FormItemSchemaToolbar',
                                        'x-settings': 'fieldSettings:FormItem',
                                        'x-component': 'CollectionField',
                                        'x-decorator': 'FormItem',
                                        'x-collection-field': 'general.select',
                                        'x-component-props': {
                                          style: {
                                            width: '100%',
                                          },
                                        },
                                        'x-app-version': '1.2.22-alpha',
                                        'x-uid': '4oktgb0hzag',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'wf3382k9190',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'zuvyztf2kr1',
                                'x-async': false,
                                'x-index': 1,
                              },
                              '0oy12yg7t7s': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                'x-app-version': '1.2.22-alpha',
                                properties: {
                                  d4payxmuozs: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
                                    'x-app-version': '1.2.22-alpha',
                                    properties: {
                                      name: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'string',
                                        'x-toolbar': 'FormItemSchemaToolbar',
                                        'x-settings': 'fieldSettings:FormItem',
                                        'x-component': 'CollectionField',
                                        'x-decorator': 'FormItem',
                                        'x-collection-field': 'general.name',
                                        'x-component-props': {},
                                        'x-app-version': '1.2.22-alpha',
                                        'x-uid': '36csihfic5y',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'iploqplmdrj',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': '6efired3279',
                                'x-async': false,
                                'x-index': 2,
                              },
                            },
                            'x-async': false,
                            'x-index': 1,
                          },
                          '0fcw5zex0ft': {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-initializer': 'createForm:configureActions',
                            'x-component': 'ActionBar',
                            'x-component-props': {
                              layout: 'one-column',
                            },
                            'x-app-version': '1.2.22-alpha',
                            'x-uid': 'qyuqi649spr',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 't4pse8uqnvk',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': '0xlj9rl4vyk',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'w87k52l39o8',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'dit5svq4m9w',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': '1zwnhhnthf2',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'fydci6wpqyj',
    'x-async': true,
    'x-index': 1,
  },
  collections: [
    {
      name: 'general',
      title: 'general',
      fields: [
        {
          key: 'liht1h04a4d',
          name: 'id',
          type: 'bigInt',
          interface: 'integer',
          description: null,
          collectionName: 'general',
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
          key: 'q0ciuu05rdr',
          name: 'name',
          type: 'string',
          interface: 'input',
          description: null,
          collectionName: 'general',
          parentKey: null,
          reverseKey: null,
          uiSchema: {
            type: 'string',
            'x-component': 'Input',
            title: 'name',
          },
        },
        {
          key: 'rfjxi2cwyjl',
          name: 'select',
          type: 'string',
          interface: 'select',
          description: null,
          collectionName: 'general',
          parentKey: null,
          reverseKey: null,
          uiSchema: {
            enum: [
              {
                value: '111',
                label: '111',
              },
              {
                value: '222',
                label: '222',
              },
              {
                value: '333',
                label: '333',
              },
            ],
            type: 'string',
            'x-component': 'Select',
            title: 'select',
          },
        },
      ],
      logging: true,
      autoGenId: true,
      filterTargetKey: 'id',
    },
  ],
};
export const parentPopupRecordInSubPageTheFirstLevelIsASubpageAndTheSecondLevelIsASubpageToo = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-index': 1,
    properties: {
      zvj8cbqvt05: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-index': 1,
        properties: {
          j0zzcf3k2vc: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '0.21.0-alpha.6',
            'x-index': 1,
            properties: {
              pn0pgjxjlz2: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '0.21.0-alpha.6',
                'x-index': 1,
                properties: {
                  o9zor60xpvi: {
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
                    'x-app-version': '0.21.0-alpha.6',
                    'x-index': 1,
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
                        'x-app-version': '0.21.0-alpha.6',
                        'x-index': 1,
                        'x-uid': 'ufwwzuvh0ii',
                        'x-async': false,
                      },
                      '3rr559rnt6k': {
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
                        'x-app-version': '0.21.0-alpha.6',
                        'x-index': 2,
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
                            'x-app-version': '0.21.0-alpha.6',
                            'x-index': 1,
                            properties: {
                              cf7dj1iffh3: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '0.21.0-alpha.6',
                                'x-index': 1,
                                properties: {
                                  oealnj6s2rw: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: 'View record',
                                    'x-action': 'view',
                                    'x-toolbar': 'ActionSchemaToolbar',
                                    'x-settings': 'actionSettings:view',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'page',
                                      danger: false,
                                    },
                                    'x-decorator': 'ACLActionProvider',
                                    'x-designer-props': {
                                      linkageAction: true,
                                    },
                                    'x-index': 1,
                                    'x-action-context': {
                                      dataSource: 'main',
                                      collection: 'users',
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
                                        'x-index': 1,
                                        properties: {
                                          tabs: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Tabs',
                                            'x-component-props': {},
                                            'x-initializer': 'popup:addTab',
                                            'x-index': 1,
                                            properties: {
                                              tab1: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                title: '{{t("Details")}}',
                                                'x-component': 'Tabs.TabPane',
                                                'x-designer': 'Tabs.Designer',
                                                'x-component-props': {},
                                                'x-index': 1,
                                                properties: {
                                                  grid: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid',
                                                    'x-initializer': 'popup:common:addBlock',
                                                    'x-index': 1,
                                                    properties: {
                                                      o3az953k64s: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '1.2.7-alpha',
                                                        'x-index': 1,
                                                        properties: {
                                                          '09c7dcvslhi': {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '1.2.7-alpha',
                                                            'x-index': 1,
                                                            properties: {
                                                              xv84k1hns7x: {
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
                                                                'x-app-version': '1.2.7-alpha',
                                                                'x-index': 1,
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
                                                                    'x-app-version': '1.2.7-alpha',
                                                                    'x-index': 1,
                                                                    properties: {
                                                                      h6qhcp7es4z: {
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
                                                                        'x-align': 'right',
                                                                        'x-acl-action-props': {
                                                                          skipScopeCheck: true,
                                                                        },
                                                                        'x-app-version': '1.2.7-alpha',
                                                                        'x-index': 1,
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
                                                                            'x-app-version': '1.2.7-alpha',
                                                                            'x-index': 1,
                                                                            properties: {
                                                                              tabs: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Tabs',
                                                                                'x-component-props': {},
                                                                                'x-initializer': 'popup:addTab',
                                                                                'x-initializer-props': {
                                                                                  gridInitializer:
                                                                                    'popup:addNew:addBlock',
                                                                                },
                                                                                'x-app-version': '1.2.7-alpha',
                                                                                'x-index': 1,
                                                                                properties: {
                                                                                  tab1: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'void',
                                                                                    title: '{{t("Add new")}}',
                                                                                    'x-component': 'Tabs.TabPane',
                                                                                    'x-designer': 'Tabs.Designer',
                                                                                    'x-component-props': {},
                                                                                    'x-app-version': '1.2.7-alpha',
                                                                                    'x-index': 1,
                                                                                    properties: {
                                                                                      grid: {
                                                                                        _isJSONSchemaObject: true,
                                                                                        version: '2.0',
                                                                                        type: 'void',
                                                                                        'x-component': 'Grid',
                                                                                        'x-initializer':
                                                                                          'popup:addNew:addBlock',
                                                                                        'x-app-version': '1.2.7-alpha',
                                                                                        'x-index': 1,
                                                                                        properties: {
                                                                                          '84oe9zbk4i3': {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            'x-component': 'Grid.Row',
                                                                                            'x-app-version':
                                                                                              '1.2.7-alpha',
                                                                                            'x-index': 1,
                                                                                            properties: {
                                                                                              g1ye1zczjy0: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component':
                                                                                                  'Grid.Col',
                                                                                                'x-app-version':
                                                                                                  '1.2.7-alpha',
                                                                                                'x-index': 1,
                                                                                                properties: {
                                                                                                  '9boifjys3jn': {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-acl-action-props':
                                                                                                      {
                                                                                                        skipScopeCheck:
                                                                                                          true,
                                                                                                      },
                                                                                                    'x-acl-action':
                                                                                                      'users:create',
                                                                                                    'x-decorator':
                                                                                                      'FormBlockProvider',
                                                                                                    'x-use-decorator-props':
                                                                                                      'useCreateFormBlockDecoratorProps',
                                                                                                    'x-decorator-props':
                                                                                                      {
                                                                                                        dataSource:
                                                                                                          'main',
                                                                                                        collection:
                                                                                                          'users',
                                                                                                      },
                                                                                                    'x-toolbar':
                                                                                                      'BlockSchemaToolbar',
                                                                                                    'x-settings':
                                                                                                      'blockSettings:createForm',
                                                                                                    'x-component':
                                                                                                      'CardItem',
                                                                                                    'x-app-version':
                                                                                                      '1.2.7-alpha',
                                                                                                    'x-index': 1,
                                                                                                    properties: {
                                                                                                      rmsurarncfw: {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'void',
                                                                                                        'x-component':
                                                                                                          'FormV2',
                                                                                                        'x-use-component-props':
                                                                                                          'useCreateFormBlockProps',
                                                                                                        'x-app-version':
                                                                                                          '1.2.7-alpha',
                                                                                                        'x-index': 1,
                                                                                                        properties: {
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
                                                                                                              '1.2.7-alpha',
                                                                                                            'x-index': 1,
                                                                                                            properties:
                                                                                                              {
                                                                                                                akmulvncf99:
                                                                                                                  {
                                                                                                                    _isJSONSchemaObject:
                                                                                                                      true,
                                                                                                                    version:
                                                                                                                      '2.0',
                                                                                                                    type: 'void',
                                                                                                                    'x-component':
                                                                                                                      'Grid.Row',
                                                                                                                    'x-app-version':
                                                                                                                      '1.2.7-alpha',
                                                                                                                    'x-index': 1,
                                                                                                                    properties:
                                                                                                                      {
                                                                                                                        nmmv2oujq4y:
                                                                                                                          {
                                                                                                                            _isJSONSchemaObject:
                                                                                                                              true,
                                                                                                                            version:
                                                                                                                              '2.0',
                                                                                                                            type: 'void',
                                                                                                                            'x-component':
                                                                                                                              'Grid.Col',
                                                                                                                            'x-app-version':
                                                                                                                              '1.2.7-alpha',
                                                                                                                            'x-index': 1,
                                                                                                                            properties:
                                                                                                                              {
                                                                                                                                nickname:
                                                                                                                                  {
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
                                                                                                                                      'users.nickname',
                                                                                                                                    'x-component-props':
                                                                                                                                      {},
                                                                                                                                    'x-app-version':
                                                                                                                                      '1.2.7-alpha',
                                                                                                                                    'x-index': 1,
                                                                                                                                    'x-uid':
                                                                                                                                      '3wdw5ur6zbj',
                                                                                                                                    'x-async':
                                                                                                                                      false,
                                                                                                                                  },
                                                                                                                              },
                                                                                                                            'x-uid':
                                                                                                                              '0etm4dgenpw',
                                                                                                                            'x-async':
                                                                                                                              false,
                                                                                                                          },
                                                                                                                      },
                                                                                                                    'x-uid':
                                                                                                                      'rgi68bc4uvr',
                                                                                                                    'x-async':
                                                                                                                      false,
                                                                                                                  },
                                                                                                              },
                                                                                                            'x-uid':
                                                                                                              'ns36964nznx',
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                          },
                                                                                                          '6b7iqambrl7':
                                                                                                            {
                                                                                                              _isJSONSchemaObject:
                                                                                                                true,
                                                                                                              version:
                                                                                                                '2.0',
                                                                                                              type: 'void',
                                                                                                              'x-initializer':
                                                                                                                'createForm:configureActions',
                                                                                                              'x-component':
                                                                                                                'ActionBar',
                                                                                                              'x-component-props':
                                                                                                                {
                                                                                                                  layout:
                                                                                                                    'one-column',
                                                                                                                  style:
                                                                                                                    {
                                                                                                                      marginTop:
                                                                                                                        'var(--nb-spacing)',
                                                                                                                    },
                                                                                                                },
                                                                                                              'x-app-version':
                                                                                                                '1.2.7-alpha',
                                                                                                              'x-index': 2,
                                                                                                              'x-uid':
                                                                                                                'r2uf2sjeus1',
                                                                                                              'x-async':
                                                                                                                false,
                                                                                                            },
                                                                                                        },
                                                                                                        'x-uid':
                                                                                                          'tjed9hp0w6t',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      '380wbgkhahs',
                                                                                                    'x-async': false,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'h5niq5h5tn2',
                                                                                                'x-async': false,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'f76pufhckas',
                                                                                            'x-async': false,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': '2dd396w43br',
                                                                                        'x-async': false,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': '87g6mq3ys2y',
                                                                                    'x-async': false,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'spx9ipa7o9d',
                                                                                'x-async': false,
                                                                              },
                                                                            },
                                                                            'x-uid': 'ne2nrb2lisk',
                                                                            'x-async': false,
                                                                          },
                                                                        },
                                                                        'x-uid': 'tyiqn1q8qdc',
                                                                        'x-async': false,
                                                                      },
                                                                    },
                                                                    'x-uid': 'cdw5o18gg4r',
                                                                    'x-async': false,
                                                                  },
                                                                  gjshpj169w3: {
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
                                                                    'x-app-version': '1.2.7-alpha',
                                                                    'x-index': 2,
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
                                                                        'x-app-version': '1.2.7-alpha',
                                                                        'x-index': 1,
                                                                        properties: {
                                                                          '6s1te9svg45': {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-decorator': 'DndContext',
                                                                            'x-component': 'Space',
                                                                            'x-component-props': {
                                                                              split: '|',
                                                                            },
                                                                            'x-app-version': '1.2.7-alpha',
                                                                            'x-index': 1,
                                                                            properties: {
                                                                              v2uyliqmu3s: {
                                                                                'x-uid': 'nufuf2do0vb',
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                title: 'View in popup',
                                                                                'x-action': 'view',
                                                                                'x-toolbar': 'ActionSchemaToolbar',
                                                                                'x-settings': 'actionSettings:view',
                                                                                'x-component': 'Action.Link',
                                                                                'x-component-props': {
                                                                                  openMode: 'page',
                                                                                  iconColor: '#1677FF',
                                                                                  danger: false,
                                                                                },
                                                                                'x-decorator': 'ACLActionProvider',
                                                                                'x-designer-props': {
                                                                                  linkageAction: true,
                                                                                },
                                                                                'x-index': 1,
                                                                                'x-action-context': {
                                                                                  dataSource: 'main',
                                                                                  collection: 'users',
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
                                                                                    'x-index': 1,
                                                                                    properties: {
                                                                                      tabs: {
                                                                                        _isJSONSchemaObject: true,
                                                                                        version: '2.0',
                                                                                        type: 'void',
                                                                                        'x-component': 'Tabs',
                                                                                        'x-component-props': {},
                                                                                        'x-initializer': 'popup:addTab',
                                                                                        'x-index': 1,
                                                                                        properties: {
                                                                                          tab1: {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            title: '{{t("Details")}}',
                                                                                            'x-component':
                                                                                              'Tabs.TabPane',
                                                                                            'x-designer':
                                                                                              'Tabs.Designer',
                                                                                            'x-component-props': {},
                                                                                            'x-index': 1,
                                                                                            properties: {
                                                                                              grid: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component': 'Grid',
                                                                                                'x-initializer':
                                                                                                  'popup:common:addBlock',
                                                                                                'x-index': 1,
                                                                                                'x-uid': 'tfkctokyxye',
                                                                                                'x-async': false,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'h45bcm99kga',
                                                                                            'x-async': false,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': 'a6u2hu5hm4q',
                                                                                        'x-async': false,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': 'zs94ks6dasi',
                                                                                    'x-async': false,
                                                                                  },
                                                                                },
                                                                                'x-async': false,
                                                                              },
                                                                            },
                                                                            'x-uid': 'n2mwxmac09n',
                                                                            'x-async': false,
                                                                          },
                                                                        },
                                                                        'x-uid': '2vb4ytmwm5e',
                                                                        'x-async': false,
                                                                      },
                                                                    },
                                                                    'x-uid': 'j0sj1zrdy6m',
                                                                    'x-async': false,
                                                                  },
                                                                },
                                                                'x-uid': 'rimxpmmoeuh',
                                                                'x-async': false,
                                                              },
                                                            },
                                                            'x-uid': '7sf6sglzrj1',
                                                            'x-async': false,
                                                          },
                                                        },
                                                        'x-uid': '50hkamulao2',
                                                        'x-async': false,
                                                      },
                                                    },
                                                    'x-uid': '6sbty7usxsx',
                                                    'x-async': false,
                                                  },
                                                },
                                                'x-uid': '5r2023moo61',
                                                'x-async': false,
                                              },
                                            },
                                            'x-uid': 'fjnaekdahgs',
                                            'x-async': false,
                                          },
                                        },
                                        'x-uid': '8dgjhobpef4',
                                        'x-async': false,
                                      },
                                    },
                                    'x-uid': 'qy2ht7pnx61',
                                    'x-async': false,
                                  },
                                },
                                'x-uid': 'vlat9iyiv2s',
                                'x-async': false,
                              },
                            },
                            'x-uid': '1mea5zyj1le',
                            'x-async': false,
                          },
                        },
                        'x-uid': 'gqvwr17tjut',
                        'x-async': false,
                      },
                    },
                    'x-uid': 'x3hjuulm454',
                    'x-async': false,
                  },
                },
                'x-uid': 'jxgc0f8lxq0',
                'x-async': false,
              },
            },
            'x-uid': '2w29ujc9nsk',
            'x-async': false,
          },
        },
        'x-uid': 'usm2zydty2c',
        'x-async': false,
      },
    },
    'x-uid': 'ds4yojdxmoj',
    'x-async': true,
  },
};
export const parentPopupRecordInSubPageTheFirstLevelIsASubpageAndTheSecondLevelIsAPopup = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-index': 1,
    properties: {
      zvj8cbqvt05: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-index': 1,
        properties: {
          j0zzcf3k2vc: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '0.21.0-alpha.6',
            'x-index': 1,
            properties: {
              pn0pgjxjlz2: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '0.21.0-alpha.6',
                'x-index': 1,
                properties: {
                  o9zor60xpvi: {
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
                    'x-app-version': '0.21.0-alpha.6',
                    'x-index': 1,
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
                        'x-app-version': '0.21.0-alpha.6',
                        'x-index': 1,
                        'x-uid': 'oz266esv0u9',
                        'x-async': false,
                      },
                      '3rr559rnt6k': {
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
                        'x-app-version': '0.21.0-alpha.6',
                        'x-index': 2,
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
                            'x-app-version': '0.21.0-alpha.6',
                            'x-index': 1,
                            properties: {
                              cf7dj1iffh3: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '0.21.0-alpha.6',
                                'x-index': 1,
                                properties: {
                                  oealnj6s2rw: {
                                    'x-uid': 'cclcsigumvo',
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: 'View record',
                                    'x-action': 'view',
                                    'x-toolbar': 'ActionSchemaToolbar',
                                    'x-settings': 'actionSettings:view',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'page',
                                      danger: false,
                                    },
                                    'x-decorator': 'ACLActionProvider',
                                    'x-designer-props': {
                                      linkageAction: true,
                                    },
                                    'x-index': 1,
                                    'x-action-context': {
                                      dataSource: 'main',
                                      collection: 'users',
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
                                        'x-index': 1,
                                        properties: {
                                          tabs: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Tabs',
                                            'x-component-props': {},
                                            'x-initializer': 'popup:addTab',
                                            'x-index': 1,
                                            properties: {
                                              tab1: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                title: '{{t("Details")}}',
                                                'x-component': 'Tabs.TabPane',
                                                'x-designer': 'Tabs.Designer',
                                                'x-component-props': {},
                                                'x-index': 1,
                                                properties: {
                                                  grid: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid',
                                                    'x-initializer': 'popup:common:addBlock',
                                                    'x-index': 1,
                                                    properties: {
                                                      o3az953k64s: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '1.2.7-alpha',
                                                        'x-index': 1,
                                                        properties: {
                                                          '09c7dcvslhi': {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '1.2.7-alpha',
                                                            'x-index': 1,
                                                            properties: {
                                                              xv84k1hns7x: {
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
                                                                'x-app-version': '1.2.7-alpha',
                                                                'x-index': 1,
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
                                                                    'x-app-version': '1.2.7-alpha',
                                                                    'x-index': 1,
                                                                    properties: {
                                                                      h6qhcp7es4z: {
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
                                                                        'x-align': 'right',
                                                                        'x-acl-action-props': {
                                                                          skipScopeCheck: true,
                                                                        },
                                                                        'x-app-version': '1.2.7-alpha',
                                                                        'x-index': 1,
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
                                                                            'x-app-version': '1.2.7-alpha',
                                                                            'x-index': 1,
                                                                            properties: {
                                                                              tabs: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Tabs',
                                                                                'x-component-props': {},
                                                                                'x-initializer': 'popup:addTab',
                                                                                'x-initializer-props': {
                                                                                  gridInitializer:
                                                                                    'popup:addNew:addBlock',
                                                                                },
                                                                                'x-app-version': '1.2.7-alpha',
                                                                                'x-index': 1,
                                                                                properties: {
                                                                                  tab1: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'void',
                                                                                    title: '{{t("Add new")}}',
                                                                                    'x-component': 'Tabs.TabPane',
                                                                                    'x-designer': 'Tabs.Designer',
                                                                                    'x-component-props': {},
                                                                                    'x-app-version': '1.2.7-alpha',
                                                                                    'x-index': 1,
                                                                                    properties: {
                                                                                      grid: {
                                                                                        _isJSONSchemaObject: true,
                                                                                        version: '2.0',
                                                                                        type: 'void',
                                                                                        'x-component': 'Grid',
                                                                                        'x-initializer':
                                                                                          'popup:addNew:addBlock',
                                                                                        'x-app-version': '1.2.7-alpha',
                                                                                        'x-index': 1,
                                                                                        properties: {
                                                                                          '84oe9zbk4i3': {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            'x-component': 'Grid.Row',
                                                                                            'x-app-version':
                                                                                              '1.2.7-alpha',
                                                                                            'x-index': 1,
                                                                                            properties: {
                                                                                              g1ye1zczjy0: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component':
                                                                                                  'Grid.Col',
                                                                                                'x-app-version':
                                                                                                  '1.2.7-alpha',
                                                                                                'x-index': 1,
                                                                                                properties: {
                                                                                                  '9boifjys3jn': {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-acl-action-props':
                                                                                                      {
                                                                                                        skipScopeCheck:
                                                                                                          true,
                                                                                                      },
                                                                                                    'x-acl-action':
                                                                                                      'users:create',
                                                                                                    'x-decorator':
                                                                                                      'FormBlockProvider',
                                                                                                    'x-use-decorator-props':
                                                                                                      'useCreateFormBlockDecoratorProps',
                                                                                                    'x-decorator-props':
                                                                                                      {
                                                                                                        dataSource:
                                                                                                          'main',
                                                                                                        collection:
                                                                                                          'users',
                                                                                                      },
                                                                                                    'x-toolbar':
                                                                                                      'BlockSchemaToolbar',
                                                                                                    'x-settings':
                                                                                                      'blockSettings:createForm',
                                                                                                    'x-component':
                                                                                                      'CardItem',
                                                                                                    'x-app-version':
                                                                                                      '1.2.7-alpha',
                                                                                                    'x-index': 1,
                                                                                                    properties: {
                                                                                                      rmsurarncfw: {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'void',
                                                                                                        'x-component':
                                                                                                          'FormV2',
                                                                                                        'x-use-component-props':
                                                                                                          'useCreateFormBlockProps',
                                                                                                        'x-app-version':
                                                                                                          '1.2.7-alpha',
                                                                                                        'x-index': 1,
                                                                                                        properties: {
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
                                                                                                              '1.2.7-alpha',
                                                                                                            'x-index': 1,
                                                                                                            properties:
                                                                                                              {
                                                                                                                akmulvncf99:
                                                                                                                  {
                                                                                                                    _isJSONSchemaObject:
                                                                                                                      true,
                                                                                                                    version:
                                                                                                                      '2.0',
                                                                                                                    type: 'void',
                                                                                                                    'x-component':
                                                                                                                      'Grid.Row',
                                                                                                                    'x-app-version':
                                                                                                                      '1.2.7-alpha',
                                                                                                                    'x-index': 1,
                                                                                                                    properties:
                                                                                                                      {
                                                                                                                        nmmv2oujq4y:
                                                                                                                          {
                                                                                                                            _isJSONSchemaObject:
                                                                                                                              true,
                                                                                                                            version:
                                                                                                                              '2.0',
                                                                                                                            type: 'void',
                                                                                                                            'x-component':
                                                                                                                              'Grid.Col',
                                                                                                                            'x-app-version':
                                                                                                                              '1.2.7-alpha',
                                                                                                                            'x-index': 1,
                                                                                                                            properties:
                                                                                                                              {
                                                                                                                                nickname:
                                                                                                                                  {
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
                                                                                                                                      'users.nickname',
                                                                                                                                    'x-component-props':
                                                                                                                                      {},
                                                                                                                                    'x-app-version':
                                                                                                                                      '1.2.7-alpha',
                                                                                                                                    'x-index': 1,
                                                                                                                                    'x-uid':
                                                                                                                                      'qwihrljz4ig',
                                                                                                                                    'x-async':
                                                                                                                                      false,
                                                                                                                                  },
                                                                                                                              },
                                                                                                                            'x-uid':
                                                                                                                              'cw7ujbu7kvb',
                                                                                                                            'x-async':
                                                                                                                              false,
                                                                                                                          },
                                                                                                                      },
                                                                                                                    'x-uid':
                                                                                                                      'craxy98y2zx',
                                                                                                                    'x-async':
                                                                                                                      false,
                                                                                                                  },
                                                                                                              },
                                                                                                            'x-uid':
                                                                                                              'zgchm9fihtk',
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                          },
                                                                                                          '6b7iqambrl7':
                                                                                                            {
                                                                                                              _isJSONSchemaObject:
                                                                                                                true,
                                                                                                              version:
                                                                                                                '2.0',
                                                                                                              type: 'void',
                                                                                                              'x-initializer':
                                                                                                                'createForm:configureActions',
                                                                                                              'x-component':
                                                                                                                'ActionBar',
                                                                                                              'x-component-props':
                                                                                                                {
                                                                                                                  layout:
                                                                                                                    'one-column',
                                                                                                                  style:
                                                                                                                    {
                                                                                                                      marginTop:
                                                                                                                        'var(--nb-spacing)',
                                                                                                                    },
                                                                                                                },
                                                                                                              'x-app-version':
                                                                                                                '1.2.7-alpha',
                                                                                                              'x-index': 2,
                                                                                                              'x-uid':
                                                                                                                'fvzf6110ke8',
                                                                                                              'x-async':
                                                                                                                false,
                                                                                                            },
                                                                                                        },
                                                                                                        'x-uid':
                                                                                                          '83w04j8tqut',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'dk69v1igksh',
                                                                                                    'x-async': false,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': '31mvbq2kmar',
                                                                                                'x-async': false,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': '9h75xux5p9l',
                                                                                            'x-async': false,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': 'y28yooyjmsd',
                                                                                        'x-async': false,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': 'ux1anvsf7cl',
                                                                                    'x-async': false,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'alki9oi1nr1',
                                                                                'x-async': false,
                                                                              },
                                                                            },
                                                                            'x-uid': 'wki8c7a8rwj',
                                                                            'x-async': false,
                                                                          },
                                                                        },
                                                                        'x-uid': 'iobdqxecbbx',
                                                                        'x-async': false,
                                                                      },
                                                                    },
                                                                    'x-uid': '0johya9mys9',
                                                                    'x-async': false,
                                                                  },
                                                                  gjshpj169w3: {
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
                                                                    'x-app-version': '1.2.7-alpha',
                                                                    'x-index': 2,
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
                                                                        'x-app-version': '1.2.7-alpha',
                                                                        'x-index': 1,
                                                                        properties: {
                                                                          '6s1te9svg45': {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-decorator': 'DndContext',
                                                                            'x-component': 'Space',
                                                                            'x-component-props': {
                                                                              split: '|',
                                                                            },
                                                                            'x-app-version': '1.2.7-alpha',
                                                                            'x-index': 1,
                                                                            properties: {
                                                                              v2uyliqmu3s: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                title: 'View in popup',
                                                                                'x-action': 'view',
                                                                                'x-toolbar': 'ActionSchemaToolbar',
                                                                                'x-settings': 'actionSettings:view',
                                                                                'x-component': 'Action.Link',
                                                                                'x-component-props': {
                                                                                  openMode: 'drawer',
                                                                                  iconColor: '#1677FF',
                                                                                  danger: false,
                                                                                },
                                                                                'x-decorator': 'ACLActionProvider',
                                                                                'x-designer-props': {
                                                                                  linkageAction: true,
                                                                                },
                                                                                'x-index': 1,
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
                                                                                    'x-index': 1,
                                                                                    properties: {
                                                                                      tabs: {
                                                                                        _isJSONSchemaObject: true,
                                                                                        version: '2.0',
                                                                                        type: 'void',
                                                                                        'x-component': 'Tabs',
                                                                                        'x-component-props': {},
                                                                                        'x-initializer': 'popup:addTab',
                                                                                        'x-index': 1,
                                                                                        properties: {
                                                                                          tab1: {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            title: '{{t("Details")}}',
                                                                                            'x-component':
                                                                                              'Tabs.TabPane',
                                                                                            'x-designer':
                                                                                              'Tabs.Designer',
                                                                                            'x-component-props': {},
                                                                                            'x-index': 1,
                                                                                            properties: {
                                                                                              grid: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component': 'Grid',
                                                                                                'x-initializer':
                                                                                                  'popup:common:addBlock',
                                                                                                'x-index': 1,
                                                                                                'x-uid': '8noqw3h04eq',
                                                                                                'x-async': false,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'ylw2eo9rt8e',
                                                                                            'x-async': false,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': 'bvperanp4fp',
                                                                                        'x-async': false,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': 'viw4us41at0',
                                                                                    'x-async': false,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'vlp312vjopp',
                                                                                'x-async': false,
                                                                              },
                                                                            },
                                                                            'x-uid': 'yzq33vwz0tg',
                                                                            'x-async': false,
                                                                          },
                                                                        },
                                                                        'x-uid': '7e3t95j7ts5',
                                                                        'x-async': false,
                                                                      },
                                                                    },
                                                                    'x-uid': '2n0gerupo20',
                                                                    'x-async': false,
                                                                  },
                                                                },
                                                                'x-uid': 'tqik6e5h7k4',
                                                                'x-async': false,
                                                              },
                                                            },
                                                            'x-uid': 'mrl8hno9wqu',
                                                            'x-async': false,
                                                          },
                                                        },
                                                        'x-uid': 'vjh64ro97uh',
                                                        'x-async': false,
                                                      },
                                                    },
                                                    'x-uid': 'hbavbxd32qk',
                                                    'x-async': false,
                                                  },
                                                },
                                                'x-uid': 'xd58013ua2y',
                                                'x-async': false,
                                              },
                                            },
                                            'x-uid': 'h5vyd61upnk',
                                            'x-async': false,
                                          },
                                        },
                                        'x-uid': 'txy45vnnj48',
                                        'x-async': false,
                                      },
                                    },
                                    'x-async': false,
                                  },
                                },
                                'x-uid': 'jheggi5va13',
                                'x-async': false,
                              },
                            },
                            'x-uid': 'g6d0rjs4tnm',
                            'x-async': false,
                          },
                        },
                        'x-uid': 'wzoo17xq36h',
                        'x-async': false,
                      },
                    },
                    'x-uid': 'x7wly65os5m',
                    'x-async': false,
                  },
                },
                'x-uid': 'lnx96j64sjz',
                'x-async': false,
              },
            },
            'x-uid': 'qa35qwbuh0o',
            'x-async': false,
          },
        },
        'x-uid': 'jq4pfrlja72',
        'x-async': false,
      },
    },
    'x-uid': '43za15mtl55',
    'x-async': true,
  },
};
export const currentPopupRecordInPopupThatOpenedByAssociationField = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      '7v3jq0c7ci8': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          sg5huq1g79r: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.2.11-alpha',
            properties: {
              xjdcefk975q: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.2.11-alpha',
                properties: {
                  kjak3j6azmi: {
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
                    'x-app-version': '1.2.11-alpha',
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
                        'x-app-version': '1.2.11-alpha',
                        'x-uid': 'jhmatcdkyge',
                        'x-async': false,
                        'x-index': 1,
                      },
                      tahnpoowd47: {
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
                        'x-app-version': '1.2.11-alpha',
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
                            'x-app-version': '1.2.11-alpha',
                            properties: {
                              d2rkmk6o37z: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '1.2.11-alpha',
                                'x-uid': '9vkwc13th9o',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'ya1toa6tq7u',
                            'x-async': false,
                            'x-index': 1,
                          },
                          pk40atz013x: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '1.2.11-alpha',
                            properties: {
                              roles: {
                                'x-uid': 'tbo1jb8yh9l',
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'users.roles',
                                'x-component': 'CollectionField',
                                'x-component-props': {
                                  fieldNames: {
                                    label: 'title',
                                    value: 'name',
                                  },
                                  ellipsis: true,
                                  size: 'small',
                                },
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-app-version': '1.2.11-alpha',
                                'x-action-context': {
                                  dataSource: 'main',
                                  association: 'users.roles',
                                  sourceId: 1,
                                },
                                properties: {
                                  '9qgmmodwbrm': {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{ t("View record") }}',
                                    'x-component': 'AssociationField.Viewer',
                                    'x-component-props': {
                                      className: 'nb-action-popup',
                                    },
                                    'x-index': 1,
                                    'x-app-version': '1.2.11-alpha',
                                    properties: {
                                      tabs: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        'x-component': 'Tabs',
                                        'x-component-props': {},
                                        'x-initializer': 'popup:addTab',
                                        'x-app-version': '1.2.11-alpha',
                                        properties: {
                                          tab1: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            title: '{{t("Details")}}',
                                            'x-component': 'Tabs.TabPane',
                                            'x-designer': 'Tabs.Designer',
                                            'x-component-props': {},
                                            'x-app-version': '1.2.11-alpha',
                                            properties: {
                                              grid: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid',
                                                'x-initializer': 'popup:common:addBlock',
                                                'x-app-version': '1.2.11-alpha',
                                                properties: {
                                                  hlui5td2mzx: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid.Row',
                                                    'x-app-version': '1.2.11-alpha',
                                                    properties: {
                                                      qslzbc2i4g7: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Col',
                                                        'x-app-version': '1.2.11-alpha',
                                                        properties: {
                                                          qmkisnspbcn: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-acl-action': 'users.roles:get',
                                                            'x-decorator': 'DetailsBlockProvider',
                                                            'x-use-decorator-props': 'useDetailsDecoratorProps',
                                                            'x-decorator-props': {
                                                              dataSource: 'main',
                                                              association: 'users.roles',
                                                              readPretty: true,
                                                              action: 'get',
                                                            },
                                                            'x-toolbar': 'BlockSchemaToolbar',
                                                            'x-settings': 'blockSettings:details',
                                                            'x-component': 'CardItem',
                                                            'x-is-current': true,
                                                            'x-app-version': '1.2.11-alpha',
                                                            properties: {
                                                              h7bydxoz048: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-component': 'Details',
                                                                'x-read-pretty': true,
                                                                'x-use-component-props': 'useDetailsProps',
                                                                'x-app-version': '1.2.11-alpha',
                                                                properties: {
                                                                  '5p2nc8tujzi': {
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
                                                                    'x-app-version': '1.2.11-alpha',
                                                                    properties: {
                                                                      eonkpnfwuje: {
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
                                                                          association: 'users.roles',
                                                                          sourceId: 1,
                                                                        },
                                                                        'x-decorator': 'ACLActionProvider',
                                                                        'x-app-version': '1.2.11-alpha',
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
                                                                            'x-app-version': '1.2.11-alpha',
                                                                            properties: {
                                                                              tabs: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Tabs',
                                                                                'x-component-props': {},
                                                                                'x-initializer': 'popup:addTab',
                                                                                'x-app-version': '1.2.11-alpha',
                                                                                properties: {
                                                                                  tab1: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'void',
                                                                                    title: '{{t("Edit")}}',
                                                                                    'x-component': 'Tabs.TabPane',
                                                                                    'x-designer': 'Tabs.Designer',
                                                                                    'x-component-props': {},
                                                                                    'x-app-version': '1.2.11-alpha',
                                                                                    properties: {
                                                                                      grid: {
                                                                                        _isJSONSchemaObject: true,
                                                                                        version: '2.0',
                                                                                        type: 'void',
                                                                                        'x-component': 'Grid',
                                                                                        'x-initializer':
                                                                                          'popup:common:addBlock',
                                                                                        'x-app-version': '1.2.11-alpha',
                                                                                        properties: {
                                                                                          vpuoragajl4: {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            'x-component': 'Grid.Row',
                                                                                            'x-app-version':
                                                                                              '1.2.11-alpha',
                                                                                            properties: {
                                                                                              dw0bbrtfwam: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component':
                                                                                                  'Grid.Col',
                                                                                                'x-app-version':
                                                                                                  '1.2.11-alpha',
                                                                                                properties: {
                                                                                                  '93be63wygk1': {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-acl-action-props':
                                                                                                      {
                                                                                                        skipScopeCheck:
                                                                                                          true,
                                                                                                      },
                                                                                                    'x-acl-action':
                                                                                                      'users:create',
                                                                                                    'x-decorator':
                                                                                                      'FormBlockProvider',
                                                                                                    'x-use-decorator-props':
                                                                                                      'useCreateFormBlockDecoratorProps',
                                                                                                    'x-decorator-props':
                                                                                                      {
                                                                                                        dataSource:
                                                                                                          'main',
                                                                                                        collection:
                                                                                                          'users',
                                                                                                        isCusomeizeCreate:
                                                                                                          true,
                                                                                                      },
                                                                                                    'x-toolbar':
                                                                                                      'BlockSchemaToolbar',
                                                                                                    'x-settings':
                                                                                                      'blockSettings:createForm',
                                                                                                    'x-component':
                                                                                                      'CardItem',
                                                                                                    'x-app-version':
                                                                                                      '1.2.11-alpha',
                                                                                                    properties: {
                                                                                                      rgnp5z1guas: {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'void',
                                                                                                        'x-component':
                                                                                                          'FormV2',
                                                                                                        'x-use-component-props':
                                                                                                          'useCreateFormBlockProps',
                                                                                                        'x-app-version':
                                                                                                          '1.2.11-alpha',
                                                                                                        properties: {
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
                                                                                                              '1.2.11-alpha',
                                                                                                            properties:
                                                                                                              {
                                                                                                                edldb7vjp9h:
                                                                                                                  {
                                                                                                                    _isJSONSchemaObject:
                                                                                                                      true,
                                                                                                                    version:
                                                                                                                      '2.0',
                                                                                                                    type: 'void',
                                                                                                                    'x-component':
                                                                                                                      'Grid.Row',
                                                                                                                    'x-app-version':
                                                                                                                      '1.2.11-alpha',
                                                                                                                    properties:
                                                                                                                      {
                                                                                                                        '8b29nba6lwu':
                                                                                                                          {
                                                                                                                            _isJSONSchemaObject:
                                                                                                                              true,
                                                                                                                            version:
                                                                                                                              '2.0',
                                                                                                                            type: 'void',
                                                                                                                            'x-component':
                                                                                                                              'Grid.Col',
                                                                                                                            'x-app-version':
                                                                                                                              '1.2.11-alpha',
                                                                                                                            properties:
                                                                                                                              {
                                                                                                                                nickname:
                                                                                                                                  {
                                                                                                                                    'x-uid':
                                                                                                                                      '3efbg7ev85y',
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
                                                                                                                                      'users.nickname',
                                                                                                                                    'x-component-props':
                                                                                                                                      {},
                                                                                                                                    'x-app-version':
                                                                                                                                      '1.2.11-alpha',
                                                                                                                                    default:
                                                                                                                                      '{{$nPopupRecord.title}}',
                                                                                                                                    title:
                                                                                                                                      'Current popup record',
                                                                                                                                    'x-async':
                                                                                                                                      false,
                                                                                                                                    'x-index': 1,
                                                                                                                                  },
                                                                                                                              },
                                                                                                                            'x-uid':
                                                                                                                              'vt5glvexxmy',
                                                                                                                            'x-async':
                                                                                                                              false,
                                                                                                                            'x-index': 1,
                                                                                                                          },
                                                                                                                      },
                                                                                                                    'x-uid':
                                                                                                                      '2nu8acu05bq',
                                                                                                                    'x-async':
                                                                                                                      false,
                                                                                                                    'x-index': 1,
                                                                                                                  },
                                                                                                                elank4j6ejl:
                                                                                                                  {
                                                                                                                    _isJSONSchemaObject:
                                                                                                                      true,
                                                                                                                    version:
                                                                                                                      '2.0',
                                                                                                                    type: 'void',
                                                                                                                    'x-component':
                                                                                                                      'Grid.Row',
                                                                                                                    'x-app-version':
                                                                                                                      '1.2.11-alpha',
                                                                                                                    properties:
                                                                                                                      {
                                                                                                                        '0vd4xfrz4ym':
                                                                                                                          {
                                                                                                                            _isJSONSchemaObject:
                                                                                                                              true,
                                                                                                                            version:
                                                                                                                              '2.0',
                                                                                                                            type: 'void',
                                                                                                                            'x-component':
                                                                                                                              'Grid.Col',
                                                                                                                            'x-app-version':
                                                                                                                              '1.2.11-alpha',
                                                                                                                            properties:
                                                                                                                              {
                                                                                                                                username:
                                                                                                                                  {
                                                                                                                                    'x-uid':
                                                                                                                                      '5wca4h5qm30',
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
                                                                                                                                      'users.username',
                                                                                                                                    'x-component-props':
                                                                                                                                      {},
                                                                                                                                    'x-app-version':
                                                                                                                                      '1.2.11-alpha',
                                                                                                                                    default:
                                                                                                                                      '{{$nParentPopupRecord.title}}',
                                                                                                                                    title:
                                                                                                                                      'Parent popup record',
                                                                                                                                    'x-async':
                                                                                                                                      false,
                                                                                                                                    'x-index': 1,
                                                                                                                                  },
                                                                                                                              },
                                                                                                                            'x-uid':
                                                                                                                              't014ef85vps',
                                                                                                                            'x-async':
                                                                                                                              false,
                                                                                                                            'x-index': 1,
                                                                                                                          },
                                                                                                                      },
                                                                                                                    'x-uid':
                                                                                                                      'ey8m2ww2i22',
                                                                                                                    'x-async':
                                                                                                                      false,
                                                                                                                    'x-index': 2,
                                                                                                                  },
                                                                                                              },
                                                                                                            'x-uid':
                                                                                                              'fbkdzitehma',
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                            'x-index': 1,
                                                                                                          },
                                                                                                          hzwm7i7osp5: {
                                                                                                            _isJSONSchemaObject:
                                                                                                              true,
                                                                                                            version:
                                                                                                              '2.0',
                                                                                                            type: 'void',
                                                                                                            'x-initializer':
                                                                                                              'createForm:configureActions',
                                                                                                            'x-component':
                                                                                                              'ActionBar',
                                                                                                            'x-component-props':
                                                                                                              {
                                                                                                                layout:
                                                                                                                  'one-column',
                                                                                                              },
                                                                                                            'x-app-version':
                                                                                                              '1.2.11-alpha',
                                                                                                            'x-uid':
                                                                                                              'txhv0ztp8df',
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                            'x-index': 2,
                                                                                                          },
                                                                                                        },
                                                                                                        'x-uid':
                                                                                                          'y0n8wniikrm',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'g3xrmvnx1f2',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'esr4dmnh247',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': '23ja6mm6cjn',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': 'qt4i6s5dbm6',
                                                                                        'x-async': false,
                                                                                        'x-index': 1,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': 'll1fml22y3k',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'jzdmyzykcjp',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'ydcosha2ywu',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': '613dykptvzt',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                    },
                                                                    'x-uid': 'mxawqyonxcm',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                  grid: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'Grid',
                                                                    'x-initializer': 'details:configureFields',
                                                                    'x-app-version': '1.2.11-alpha',
                                                                    'x-uid': 'xdsgygv5ddd',
                                                                    'x-async': false,
                                                                    'x-index': 2,
                                                                  },
                                                                },
                                                                'x-uid': 'ctz5vwsyqxl',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'zdmrlz13iv4',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'ykywzr06b0d',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'vlb6idas0u0',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                  sqob98vfvn5: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid.Row',
                                                    'x-app-version': '1.2.11-alpha',
                                                    properties: {
                                                      '0tqerdtlph4': {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Col',
                                                        'x-app-version': '1.2.11-alpha',
                                                        properties: {
                                                          whrb78tisi9: {
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
                                                              isCusomeizeCreate: true,
                                                            },
                                                            'x-toolbar': 'BlockSchemaToolbar',
                                                            'x-settings': 'blockSettings:createForm',
                                                            'x-component': 'CardItem',
                                                            'x-app-version': '1.2.11-alpha',
                                                            properties: {
                                                              okwa9isvg20: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-component': 'FormV2',
                                                                'x-use-component-props': 'useCreateFormBlockProps',
                                                                'x-app-version': '1.2.11-alpha',
                                                                properties: {
                                                                  grid: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'Grid',
                                                                    'x-initializer': 'form:configureFields',
                                                                    'x-app-version': '1.2.11-alpha',
                                                                    properties: {
                                                                      w0z5w1ravav: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid.Row',
                                                                        'x-app-version': '1.2.11-alpha',
                                                                        properties: {
                                                                          hdxme12nbvn: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Col',
                                                                            'x-app-version': '1.2.11-alpha',
                                                                            properties: {
                                                                              nickname: {
                                                                                'x-uid': 'arbmzko8ucm',
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'string',
                                                                                'x-toolbar': 'FormItemSchemaToolbar',
                                                                                'x-settings': 'fieldSettings:FormItem',
                                                                                'x-component': 'CollectionField',
                                                                                'x-decorator': 'FormItem',
                                                                                'x-collection-field': 'users.nickname',
                                                                                'x-component-props': {},
                                                                                'x-app-version': '1.2.11-alpha',
                                                                                default: '{{$nPopupRecord.title}}',
                                                                                title: 'Current popup record',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': '5aa1sejg87n',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'zjxkw7sj3ju',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                    },
                                                                    'x-uid': 'xnytyxmxxhb',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                  td0a76ltry9: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-initializer': 'createForm:configureActions',
                                                                    'x-component': 'ActionBar',
                                                                    'x-component-props': {
                                                                      layout: 'one-column',
                                                                    },
                                                                    'x-app-version': '1.2.11-alpha',
                                                                    'x-uid': 'tiidq1ieutt',
                                                                    'x-async': false,
                                                                    'x-index': 2,
                                                                  },
                                                                },
                                                                'x-uid': '5e54dj8hxyi',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'huc0cu06cor',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': '6lng7hegc6i',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': '6otvy2i4idn',
                                                    'x-async': false,
                                                    'x-index': 2,
                                                  },
                                                },
                                                'x-uid': '6lveg9s090p',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': '0wiln39l5au',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'r9unvop3xz7',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'frj9wy0ykp9',
                                    'x-async': false,
                                  },
                                },
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'u7230hzmgaq',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': '64o8pdgvvto',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'ckllg5qkcv6',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'eskjoxwqfd2',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'r1j05mcyuld',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': '5pw8082pcqr',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'k7jako03z9s',
    'x-async': true,
    'x-index': 1,
  },
};
