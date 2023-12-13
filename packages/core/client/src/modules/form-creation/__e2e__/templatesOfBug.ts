import { PageConfig } from '@nocobase/test/client';

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
        'x-initializer': 'BlockInitializers',
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
                        'x-initializer': 'TableActionInitializers',
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
                        'x-initializer': 'TableColumnInitializers',
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
                            'x-initializer': 'TableActionColumnInitializers',
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
                                                    'x-initializer': 'RecordBlockInitializers',
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
                                                                        'x-initializer': 'FormItemInitializers',
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
                                                                        'x-initializer': 'CreateFormActionInitializers',
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
                                                'x-initializer': 'RecordBlockInitializers',
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
        'x-initializer': 'BlockInitializers',
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
                        'x-initializer': 'TableActionInitializers',
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
                                                    'x-initializer': 'RecordBlockInitializers',
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
                                                                        'x-initializer':
                                                                          'ReadPrettyFormActionInitializers',
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
                                                                        'x-initializer':
                                                                          'ReadPrettyFormItemInitializers',
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
                                                                                              'FormItemInitializers',
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
                                                    'x-initializer': 'RecordBlockInitializers',
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
                                                                        'x-initializer': 'FormItemInitializers',
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
                                                                                              'FormItemInitializers',
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
                                                                        'x-initializer': 'UpdateFormActionInitializers',
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
        'x-initializer': 'BlockInitializers',
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
                        'x-initializer': 'TableActionInitializers',
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
                                            'x-initializer': 'CreateFormBlockInitializers',
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
                                                                'x-initializer': 'FormItemInitializers',
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
                                                                'x-initializer': 'CreateFormActionInitializers',
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
                                                    'x-initializer': 'RecordBlockInitializers',
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
                                                                        'x-initializer': 'FormItemInitializers',
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
                                                                        'x-initializer': 'UpdateFormActionInitializers',
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
                                                    'x-initializer': 'RecordBlockInitializers',
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
                                                                        'x-initializer':
                                                                          'ReadPrettyFormActionInitializers',
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
                                                                        'x-initializer':
                                                                          'ReadPrettyFormItemInitializers',
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
        'x-initializer': 'BlockInitializers',
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
                        'x-initializer': 'TableActionInitializers',
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
                                                    'x-initializer': 'RecordBlockInitializers',
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
                                                                        'x-initializer': 'FormItemInitializers',
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
                                                                        'x-initializer': 'UpdateFormActionInitializers',
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
