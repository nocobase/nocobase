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
