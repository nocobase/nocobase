/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const formFieldDependsOnSubtableFieldsWithLinkageRules = {
  collections: [
    {
      name: 'test',
      fields: [
        {
          name: 'subtable',
          interface: 'm2m',
          target: 'A',
        },
        {
          name: 'result',
          interface: 'integer',
        },
      ],
    },
    {
      name: 'A',
      fields: [
        {
          name: 'count',
          interface: 'integer',
        },
        {
          name: 'price',
          interface: 'integer',
        },
        {
          name: 'totalPrice',
          interface: 'integer',
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
      s9fsohlzw8f: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          v7w7gyk1f5i: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.5.0-beta.6',
            properties: {
              uind6ar45tp: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.5.0-beta.6',
                properties: {
                  m51dz0t9b6y: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'test:list',
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'test',
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
                    'x-app-version': '1.5.0-beta.6',
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
                        'x-app-version': '1.5.0-beta.6',
                        properties: {
                          rt2cjy9rsvk: {
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
                              collection: 'test',
                            },
                            'x-align': 'right',
                            'x-acl-action-props': {
                              skipScopeCheck: true,
                            },
                            'x-app-version': '1.5.0-beta.6',
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
                                'x-app-version': '1.5.0-beta.6',
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
                                    'x-app-version': '1.5.0-beta.6',
                                    properties: {
                                      tab1: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        title: '{{t("Add new")}}',
                                        'x-component': 'Tabs.TabPane',
                                        'x-designer': 'Tabs.Designer',
                                        'x-component-props': {},
                                        'x-app-version': '1.5.0-beta.6',
                                        properties: {
                                          grid: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Grid',
                                            'x-initializer': 'popup:addNew:addBlock',
                                            'x-app-version': '1.5.0-beta.6',
                                            properties: {
                                              ywxffhjclua: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid.Row',
                                                'x-app-version': '1.5.0-beta.6',
                                                properties: {
                                                  a9kvacdg2tc: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid.Col',
                                                    'x-app-version': '1.5.0-beta.6',
                                                    properties: {
                                                      o8zjbma555j: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-acl-action-props': {
                                                          skipScopeCheck: true,
                                                        },
                                                        'x-acl-action': 'test:create',
                                                        'x-decorator': 'FormBlockProvider',
                                                        'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
                                                        'x-decorator-props': {
                                                          dataSource: 'main',
                                                          collection: 'test',
                                                        },
                                                        'x-toolbar': 'BlockSchemaToolbar',
                                                        'x-settings': 'blockSettings:createForm',
                                                        'x-component': 'CardItem',
                                                        'x-app-version': '1.5.0-beta.6',
                                                        properties: {
                                                          tm8ivq7t4am: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'FormV2',
                                                            'x-use-component-props': 'useCreateFormBlockProps',
                                                            'x-app-version': '1.5.0-beta.6',
                                                            properties: {
                                                              grid: {
                                                                'x-uid': 'n9mnrndx0su',
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-component': 'Grid',
                                                                'x-initializer': 'form:configureFields',
                                                                'x-app-version': '1.5.0-beta.6',
                                                                'x-linkage-rules': [
                                                                  {
                                                                    condition: {
                                                                      $and: [],
                                                                    },
                                                                    actions: [
                                                                      {
                                                                        targetFields: ['result'],
                                                                        operator: 'value',
                                                                        value: {
                                                                          mode: 'express',
                                                                          value: 'SUM({{$nForm.subtable.totalPrice}})',
                                                                          result: 'SUM({{$nForm.subtable.totalPrice}})',
                                                                        },
                                                                      },
                                                                    ],
                                                                  },
                                                                ],
                                                                properties: {
                                                                  dps74740h83: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'Grid.Row',
                                                                    'x-app-version': '1.5.0-beta.6',
                                                                    properties: {
                                                                      es5wn4kpq0n: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid.Col',
                                                                        'x-app-version': '1.5.0-beta.6',
                                                                        properties: {
                                                                          subtable: {
                                                                            'x-uid': '5cy392nt0ue',
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'string',
                                                                            'x-toolbar': 'FormItemSchemaToolbar',
                                                                            'x-settings': 'fieldSettings:FormItem',
                                                                            'x-component': 'CollectionField',
                                                                            'x-decorator': 'FormItem',
                                                                            'x-collection-field': 'test.subtable',
                                                                            'x-component-props': {
                                                                              fieldNames: {
                                                                                label: 'id',
                                                                                value: 'id',
                                                                              },
                                                                              mode: 'SubTable',
                                                                            },
                                                                            'x-app-version': '1.5.0-beta.6',
                                                                            default: null,
                                                                            'x-linkage-rules': [
                                                                              {
                                                                                condition: {
                                                                                  $and: [],
                                                                                },
                                                                                actions: [
                                                                                  {
                                                                                    targetFields: ['totalPrice'],
                                                                                    operator: 'value',
                                                                                    value: {
                                                                                      mode: 'express',
                                                                                      value:
                                                                                        '{{$iteration.count}} * {{$iteration.price}}',
                                                                                      result:
                                                                                        '{{$iteration.count}} * {{$iteration.price}}',
                                                                                    },
                                                                                  },
                                                                                ],
                                                                              },
                                                                            ],
                                                                            properties: {
                                                                              fudb5i21fut: {
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
                                                                                'x-app-version': '1.5.0-beta.6',
                                                                                properties: {
                                                                                  '6x5wkmj87ds': {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'void',
                                                                                    'x-decorator':
                                                                                      'TableV2.Column.Decorator',
                                                                                    'x-toolbar':
                                                                                      'TableColumnSchemaToolbar',
                                                                                    'x-settings':
                                                                                      'fieldSettings:TableColumn',
                                                                                    'x-component': 'TableV2.Column',
                                                                                    'x-app-version': '1.5.0-beta.6',
                                                                                    properties: {
                                                                                      count: {
                                                                                        _isJSONSchemaObject: true,
                                                                                        version: '2.0',
                                                                                        'x-collection-field': 'A.count',
                                                                                        'x-component':
                                                                                          'CollectionField',
                                                                                        'x-component-props': {},
                                                                                        'x-decorator': 'FormItem',
                                                                                        'x-decorator-props': {
                                                                                          labelStyle: {
                                                                                            display: 'none',
                                                                                          },
                                                                                        },
                                                                                        'x-app-version': '1.5.0-beta.6',
                                                                                        'x-uid': 'tejnrvflzcc',
                                                                                        'x-async': false,
                                                                                        'x-index': 1,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': 'xo439o33oad',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                  o25avq2mf8k: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'void',
                                                                                    'x-decorator':
                                                                                      'TableV2.Column.Decorator',
                                                                                    'x-toolbar':
                                                                                      'TableColumnSchemaToolbar',
                                                                                    'x-settings':
                                                                                      'fieldSettings:TableColumn',
                                                                                    'x-component': 'TableV2.Column',
                                                                                    'x-app-version': '1.5.0-beta.6',
                                                                                    properties: {
                                                                                      price: {
                                                                                        _isJSONSchemaObject: true,
                                                                                        version: '2.0',
                                                                                        'x-collection-field': 'A.price',
                                                                                        'x-component':
                                                                                          'CollectionField',
                                                                                        'x-component-props': {},
                                                                                        'x-decorator': 'FormItem',
                                                                                        'x-decorator-props': {
                                                                                          labelStyle: {
                                                                                            display: 'none',
                                                                                          },
                                                                                        },
                                                                                        'x-app-version': '1.5.0-beta.6',
                                                                                        'x-uid': 'jsbtond5omz',
                                                                                        'x-async': false,
                                                                                        'x-index': 1,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': '9f63c4olrwn',
                                                                                    'x-async': false,
                                                                                    'x-index': 2,
                                                                                  },
                                                                                  '60tkt9imffo': {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'void',
                                                                                    'x-decorator':
                                                                                      'TableV2.Column.Decorator',
                                                                                    'x-toolbar':
                                                                                      'TableColumnSchemaToolbar',
                                                                                    'x-settings':
                                                                                      'fieldSettings:TableColumn',
                                                                                    'x-component': 'TableV2.Column',
                                                                                    'x-app-version': '1.5.0-beta.6',
                                                                                    properties: {
                                                                                      totalPrice: {
                                                                                        _isJSONSchemaObject: true,
                                                                                        version: '2.0',
                                                                                        'x-collection-field':
                                                                                          'A.totalPrice',
                                                                                        'x-component':
                                                                                          'CollectionField',
                                                                                        'x-component-props': {},
                                                                                        'x-decorator': 'FormItem',
                                                                                        'x-decorator-props': {
                                                                                          labelStyle: {
                                                                                            display: 'none',
                                                                                          },
                                                                                        },
                                                                                        'x-app-version': '1.5.0-beta.6',
                                                                                        'x-uid': '3t5mcxqnvug',
                                                                                        'x-async': false,
                                                                                        'x-index': 1,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': 'ia6b07nznai',
                                                                                    'x-async': false,
                                                                                    'x-index': 3,
                                                                                  },
                                                                                },
                                                                                'x-uid': '7mfo2ghlm1u',
                                                                                'x-async': false,
                                                                              },
                                                                            },
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': '4ybaip2vsom',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                    },
                                                                    'x-uid': '0htuiv6h9q3',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                  '5nb0mqfghxn': {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'Grid.Row',
                                                                    'x-app-version': '1.5.0-beta.6',
                                                                    properties: {
                                                                      '7s16r268pzg': {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid.Col',
                                                                        'x-app-version': '1.5.0-beta.6',
                                                                        properties: {
                                                                          result: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'string',
                                                                            'x-toolbar': 'FormItemSchemaToolbar',
                                                                            'x-settings': 'fieldSettings:FormItem',
                                                                            'x-component': 'CollectionField',
                                                                            'x-decorator': 'FormItem',
                                                                            'x-collection-field': 'test.result',
                                                                            'x-component-props': {},
                                                                            'x-app-version': '1.5.0-beta.6',
                                                                            'x-uid': 'oox2v051uny',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'hrdncy8zala',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                    },
                                                                    'x-uid': '5e0rr72styk',
                                                                    'x-async': false,
                                                                    'x-index': 2,
                                                                  },
                                                                },
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                              skjmcwe0p20: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-initializer': 'createForm:configureActions',
                                                                'x-component': 'ActionBar',
                                                                'x-component-props': {
                                                                  layout: 'one-column',
                                                                },
                                                                'x-app-version': '1.5.0-beta.6',
                                                                'x-uid': '18t8ku582fy',
                                                                'x-async': false,
                                                                'x-index': 2,
                                                              },
                                                            },
                                                            'x-uid': 'fm804i55bj5',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'zywps9uss57',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': '2rflbnog4zn',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'vp4003775uj',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'pfbg2t0s0xq',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': '8zvo8pxibxw',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 's9lqnj4dbmh',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'lsfsv0rhz3z',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'wtqgiyld6w5',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'ix7m1ttw4qc',
                        'x-async': false,
                        'x-index': 1,
                      },
                      c2soycrurkj: {
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
                        'x-app-version': '1.5.0-beta.6',
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
                            'x-app-version': '1.5.0-beta.6',
                            properties: {
                              t2ffxdsxbyn: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '1.5.0-beta.6',
                                properties: {
                                  y7vo4p2gfyl: {
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
                                      collection: 'test',
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
                                                      oupr0q9l79t: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '1.5.0-beta.6',
                                                        properties: {
                                                          ktzwrj8g09a: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '1.5.0-beta.6',
                                                            properties: {
                                                              fsgs3lhyhaq: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action-props': {
                                                                  skipScopeCheck: false,
                                                                },
                                                                'x-acl-action': 'test:update',
                                                                'x-decorator': 'FormBlockProvider',
                                                                'x-use-decorator-props':
                                                                  'useEditFormBlockDecoratorProps',
                                                                'x-decorator-props': {
                                                                  action: 'get',
                                                                  dataSource: 'main',
                                                                  collection: 'test',
                                                                },
                                                                'x-toolbar': 'BlockSchemaToolbar',
                                                                'x-settings': 'blockSettings:editForm',
                                                                'x-component': 'CardItem',
                                                                'x-app-version': '1.5.0-beta.6',
                                                                properties: {
                                                                  '1xi8hkpsalu': {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'FormV2',
                                                                    'x-use-component-props': 'useEditFormBlockProps',
                                                                    'x-app-version': '1.5.0-beta.6',
                                                                    properties: {
                                                                      grid: {
                                                                        'x-uid': 'xvc3xco2z03',
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid',
                                                                        'x-initializer': 'form:configureFields',
                                                                        'x-app-version': '1.5.0-beta.6',
                                                                        'x-linkage-rules': [
                                                                          {
                                                                            condition: {
                                                                              $and: [],
                                                                            },
                                                                            actions: [
                                                                              {
                                                                                targetFields: ['result'],
                                                                                operator: 'value',
                                                                                value: {
                                                                                  mode: 'express',
                                                                                  value:
                                                                                    'SUM({{$nForm.subtable.totalPrice}})',
                                                                                  result:
                                                                                    'SUM({{$nForm.subtable.totalPrice}})',
                                                                                },
                                                                              },
                                                                            ],
                                                                          },
                                                                        ],
                                                                        properties: {
                                                                          q8u7c53id3k: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            'x-app-version': '1.5.0-beta.6',
                                                                            properties: {
                                                                              jng7w3s4wcv: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                'x-app-version': '1.5.0-beta.6',
                                                                                properties: {
                                                                                  subtable: {
                                                                                    'x-uid': 'vvqvpcok2f2',
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
                                                                                      'test.subtable',
                                                                                    'x-component-props': {
                                                                                      fieldNames: {
                                                                                        label: 'id',
                                                                                        value: 'id',
                                                                                      },
                                                                                      mode: 'SubTable',
                                                                                    },
                                                                                    'x-app-version': '1.5.0-beta.6',
                                                                                    'x-linkage-rules': [
                                                                                      {
                                                                                        condition: {
                                                                                          $and: [],
                                                                                        },
                                                                                        actions: [
                                                                                          {
                                                                                            targetFields: [
                                                                                              'totalPrice',
                                                                                            ],
                                                                                            operator: 'value',
                                                                                            value: {
                                                                                              mode: 'express',
                                                                                              value:
                                                                                                '{{$iteration.count}} * {{$iteration.price}}',
                                                                                              result:
                                                                                                '{{$iteration.count}} * {{$iteration.price}}',
                                                                                            },
                                                                                          },
                                                                                        ],
                                                                                      },
                                                                                    ],
                                                                                    properties: {
                                                                                      znd2re8ssi4: {
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
                                                                                        'x-app-version': '1.5.0-beta.6',
                                                                                        properties: {
                                                                                          n4vmmrdqjzl: {
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
                                                                                              '1.5.0-beta.6',
                                                                                            properties: {
                                                                                              count: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                'x-collection-field':
                                                                                                  'A.count',
                                                                                                'x-component':
                                                                                                  'CollectionField',
                                                                                                'x-component-props': {},
                                                                                                'x-decorator':
                                                                                                  'FormItem',
                                                                                                'x-decorator-props': {
                                                                                                  labelStyle: {
                                                                                                    display: 'none',
                                                                                                  },
                                                                                                },
                                                                                                'x-app-version':
                                                                                                  '1.5.0-beta.6',
                                                                                                'x-uid': 'zv2z6805whp',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'r1ungnjfbgu',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                          jz1by8rmwfk: {
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
                                                                                              '1.5.0-beta.6',
                                                                                            properties: {
                                                                                              price: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                'x-collection-field':
                                                                                                  'A.price',
                                                                                                'x-component':
                                                                                                  'CollectionField',
                                                                                                'x-component-props': {},
                                                                                                'x-decorator':
                                                                                                  'FormItem',
                                                                                                'x-decorator-props': {
                                                                                                  labelStyle: {
                                                                                                    display: 'none',
                                                                                                  },
                                                                                                },
                                                                                                'x-app-version':
                                                                                                  '1.5.0-beta.6',
                                                                                                'x-uid': '88jtwgdvfm8',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'ytfcqn0iaof',
                                                                                            'x-async': false,
                                                                                            'x-index': 2,
                                                                                          },
                                                                                          yv763dj36k6: {
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
                                                                                              '1.5.0-beta.6',
                                                                                            properties: {
                                                                                              totalPrice: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                'x-collection-field':
                                                                                                  'A.totalPrice',
                                                                                                'x-component':
                                                                                                  'CollectionField',
                                                                                                'x-component-props': {},
                                                                                                'x-decorator':
                                                                                                  'FormItem',
                                                                                                'x-decorator-props': {
                                                                                                  labelStyle: {
                                                                                                    display: 'none',
                                                                                                  },
                                                                                                },
                                                                                                'x-app-version':
                                                                                                  '1.5.0-beta.6',
                                                                                                'x-uid': 'hmo5jyy232z',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': '9ydu5bfuane',
                                                                                            'x-async': false,
                                                                                            'x-index': 3,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': 'r15f9730kx9',
                                                                                        'x-async': false,
                                                                                      },
                                                                                    },
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': '8etldmvdcuk',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'phzdazcju65',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                          iub3idfpdh4: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            'x-app-version': '1.5.0-beta.6',
                                                                            properties: {
                                                                              lanveo0xcn8: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                'x-app-version': '1.5.0-beta.6',
                                                                                properties: {
                                                                                  result: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-toolbar':
                                                                                      'FormItemSchemaToolbar',
                                                                                    'x-settings':
                                                                                      'fieldSettings:FormItem',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field': 'test.result',
                                                                                    'x-component-props': {},
                                                                                    'x-app-version': '1.5.0-beta.6',
                                                                                    'x-uid': 'dx1iv4qkd1b',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'uopqm34ayjo',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'fzfarnr4w4j',
                                                                            'x-async': false,
                                                                            'x-index': 2,
                                                                          },
                                                                        },
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                      '2t6nvnwkbnw': {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-initializer': 'editForm:configureActions',
                                                                        'x-component': 'ActionBar',
                                                                        'x-component-props': {
                                                                          layout: 'one-column',
                                                                        },
                                                                        'x-app-version': '1.5.0-beta.6',
                                                                        'x-uid': 'uxn3xrgzvtz',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': 'pn1nhhwzbsg',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': '8d6rs0f8wzh',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'r678ucgswj3',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'nvaaet6kz8g',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'xjmk0qr3mbt',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'vc90fgylb6h',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'w5xitaqziom',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'ehdyxv75fuw',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': '42vuhd1ofz1',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'k36zbevibrq',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'ugqxdneo59c',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'salmxthgmls',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'czxd4c86gvq',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'jqbr04lfqlk',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'ae2fs884ol4',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'p568ms2llzx',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'plh5cv01fwd',
    'x-async': true,
    'x-index': 1,
  },
};
export const whenSetToHideRetainedValueItShouldNotImpactTheFieldSDefaultValueVariables = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-app-version': '1.2.22-alpha',
    'x-index': 1,
    properties: {
      p7ec8csgn5m: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-app-version': '1.2.22-alpha',
        'x-index': 1,
        properties: {
          zv4cspv6a29: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.5.0',
            properties: {
              '8g82nnx49px': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.5.0',
                properties: {
                  o81qu0qr58k: {
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
                    'x-app-version': '1.5.0',
                    properties: {
                      '2y5nqom11x2': {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'FormV2',
                        'x-use-component-props': 'useCreateFormBlockProps',
                        'x-app-version': '1.5.0',
                        properties: {
                          grid: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'form:configureFields',
                            'x-app-version': '1.5.0',
                            properties: {
                              jw9u2or5ao3: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                'x-app-version': '1.5.0',
                                properties: {
                                  '2hjic42gro0': {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
                                    'x-app-version': '1.5.0',
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
                                        'x-app-version': '1.5.0',
                                        'x-uid': 'wiyq5i1cy3p',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                      roles: {
                                        'x-uid': 'hq9rpolzkgy',
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
                                          mode: 'Nester',
                                        },
                                        'x-app-version': '1.5.0',
                                        default: null,
                                        'x-linkage-rules': [
                                          {
                                            condition: {
                                              $and: [],
                                            },
                                            actions: [
                                              {
                                                targetFields: ['title'],
                                                operator: 'hidden',
                                              },
                                            ],
                                          },
                                        ],
                                        properties: {
                                          '61xdu2xz0id': {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'AssociationField.Nester',
                                            'x-index': 1,
                                            'x-app-version': '1.5.0',
                                            properties: {
                                              grid: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid',
                                                'x-initializer': 'form:configureFields',
                                                'x-app-version': '1.5.0',
                                                properties: {
                                                  cwi4824alag: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid.Row',
                                                    'x-app-version': '1.5.0',
                                                    properties: {
                                                      nciz3wbcwov: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Col',
                                                        'x-app-version': '1.5.0',
                                                        properties: {
                                                          title: {
                                                            'x-uid': 'o1sjow3kb6d',
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'string',
                                                            'x-toolbar': 'FormItemSchemaToolbar',
                                                            'x-settings': 'fieldSettings:FormItem',
                                                            'x-component': 'CollectionField',
                                                            'x-decorator': 'FormItem',
                                                            'x-collection-field': 'roles.title',
                                                            'x-component-props': {},
                                                            'x-app-version': '1.5.0',
                                                            default: '{{$nForm.nickname}}',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'iau70tmmg0v',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'xtcm8jw27yn',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'zxwzyi9zno6',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'i5bbqlpixaq',
                                            'x-async': false,
                                          },
                                        },
                                        'x-async': false,
                                        'x-index': 2,
                                      },
                                    },
                                    'x-uid': 'ly4pbhn86ad',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'iwrf9t6dua7',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'elv4yj02qvv',
                            'x-async': false,
                            'x-index': 1,
                          },
                          dbffcw0hegz: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-initializer': 'createForm:configureActions',
                            'x-component': 'ActionBar',
                            'x-component-props': {
                              layout: 'one-column',
                            },
                            'x-app-version': '1.5.0',
                            properties: {
                              t108zgbcxit: {
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
                                'x-app-version': '1.5.0',
                                'x-uid': 'i50ygu2vieu',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'zcsydga2buf',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'gslsn7jl6l1',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'wuoxu2y21vt',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'r5fug8doi7a',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'dhkuk4q7xwy',
            'x-async': false,
            'x-index': 1,
          },
          '9s2vc6evb31': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.5.0',
            properties: {
              '07vx4eek458': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.5.0',
                properties: {
                  ac0eo4uwy8n: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'roles:list',
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'roles',
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
                    'x-app-version': '1.5.0',
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
                        'x-app-version': '1.5.0',
                        properties: {
                          '4qvejownfhj': {
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
                            'x-app-version': '1.5.0',
                            'x-uid': '933a1iqb1gv',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'm9ahqhvyuek',
                        'x-async': false,
                        'x-index': 1,
                      },
                      mbylkrg6gvr: {
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
                        'x-app-version': '1.5.0',
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
                            'x-app-version': '1.5.0',
                            properties: {
                              s81pexo4gn0: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '1.5.0',
                                'x-uid': '02wz01i4co3',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'kgpz7biqj4q',
                            'x-async': false,
                            'x-index': 1,
                          },
                          '4s3t81kkedx': {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '1.5.0',
                            properties: {
                              title: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'roles.title',
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
                                'x-app-version': '1.5.0',
                                'x-uid': '0z4vb8b513t',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'iv2u1zb9oad',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': '96xrr05qtay',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': '66vv1xjjs0t',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '86pw777iy5v',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'af30xqxeajk',
            'x-async': false,
            'x-index': 2,
          },
        },
        'x-uid': 'l7gm4k3394m',
        'x-async': false,
      },
    },
    'x-uid': 'ch2620lhiqs',
    'x-async': true,
  },
};
export const whenClearingARelationshipFieldTheValueOfTheAssociatedFieldShouldBeCleared = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-app-version': '1.5.16',
    properties: {
      '3fiy31f6txn': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-app-version': '1.5.16',
        properties: {
          '0rcyz4b3efw': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.5.16',
            properties: {
              u3mg5s9lzv6: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.5.16',
                properties: {
                  ezm6z8plx83: {
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
                    'x-app-version': '1.5.16',
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
                        'x-app-version': '1.5.16',
                        'x-uid': 'tt6xllenhim',
                        'x-async': false,
                        'x-index': 1,
                      },
                      jv0ofysjinb: {
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
                        'x-app-version': '1.5.16',
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
                            'x-app-version': '1.5.16',
                            properties: {
                              bngzha8iw7k: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '1.5.16',
                                properties: {
                                  tkzbokuc018: {
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
                                                      q2nw699fdes: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '1.5.16',
                                                        properties: {
                                                          '8rf37n96jy1': {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '1.5.16',
                                                            properties: {
                                                              '83f2yyxkgew': {
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
                                                                'x-app-version': '1.5.16',
                                                                properties: {
                                                                  ztcsjl3kutq: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'FormV2',
                                                                    'x-use-component-props': 'useEditFormBlockProps',
                                                                    'x-app-version': '1.5.16',
                                                                    properties: {
                                                                      grid: {
                                                                        'x-uid': 'jk5os75m30w',
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid',
                                                                        'x-initializer': 'form:configureFields',
                                                                        'x-app-version': '1.5.16',
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
                                                                                  value: '{{$nForm.roles.title}}',
                                                                                  result: '{{$nForm.roles.title}}',
                                                                                },
                                                                              },
                                                                            ],
                                                                          },
                                                                        ],
                                                                        properties: {
                                                                          al791aryfpm: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            'x-app-version': '1.5.16',
                                                                            properties: {
                                                                              s2o1ubyy97y: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                'x-app-version': '1.5.16',
                                                                                properties: {
                                                                                  roles: {
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
                                                                                    },
                                                                                    'x-app-version': '1.5.16',
                                                                                    'x-uid': 'y5r3pw94du5',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': '1mlc7m6h27k',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'l5bz655ppju',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                          jsl0ebbnp4x: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            'x-app-version': '1.5.16',
                                                                            properties: {
                                                                              e19ihogekwg: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                'x-app-version': '1.5.16',
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
                                                                                    'x-app-version': '1.5.16',
                                                                                    'x-uid': 'nr2wsugko9w',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'vmsrhpme9qo',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'b7v16npd5y2',
                                                                            'x-async': false,
                                                                            'x-index': 2,
                                                                          },
                                                                        },
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                      p3zp9livz6w: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-initializer': 'editForm:configureActions',
                                                                        'x-component': 'ActionBar',
                                                                        'x-component-props': {
                                                                          layout: 'one-column',
                                                                        },
                                                                        'x-app-version': '1.5.16',
                                                                        'x-uid': 'd3qzyf73gu6',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': 'j4j1fy7tkmh',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': 't4mmnie8cll',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'bnugjy38s7u',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'tb4c9r9s844',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'dlbfog0xc8b',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'nvl54jerwsi',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': '8d1h9bm3lnb',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'f7xutqb1iyw',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'kquc4rim0g2',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'sb10ua8lfsl',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'wa210opt4kb',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'sumvmy4epmf',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'jyssn2zrfs6',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'n1iy8cfg2nj',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'q9we7w410nr',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'hajsh396zq6',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'utv8yv0hu55',
    'x-async': true,
    'x-index': 1,
  },
};

export const accessControlActionWithTable = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-app-version': '1.6.0-beta.9',
    properties: {
      fvgd0c2akgf: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-app-version': '1.6.0-beta.9',
        properties: {
          '0c4zy47hhyq': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.6.0-beta.9',
            properties: {
              b1y881c771g: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.6.0-beta.9',
                properties: {
                  hccefuo80kx: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action': 'users:view',
                    'x-decorator': 'DetailsBlockProvider',
                    'x-use-decorator-props': 'useDetailsWithPaginationDecoratorProps',
                    'x-decorator-props': {
                      dataSource: 'main',
                      collection: 'users',
                      readPretty: true,
                      action: 'list',
                      params: {
                        pageSize: 1,
                      },
                    },
                    'x-toolbar': 'BlockSchemaToolbar',
                    'x-settings': 'blockSettings:detailsWithPagination',
                    'x-component': 'CardItem',
                    'x-app-version': '1.6.0-beta.9',
                    properties: {
                      fctprt7i7ut: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'Details',
                        'x-read-pretty': true,
                        'x-use-component-props': 'useDetailsWithPaginationProps',
                        'x-app-version': '1.6.0-beta.9',
                        properties: {
                          b2xrbq4a060: {
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
                            'x-app-version': '1.6.0-beta.9',
                            properties: {
                              e2ccvx3c7o5: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                title: '{{ t("Popup") }}',
                                'x-action': 'customize:popup',
                                'x-toolbar': 'ActionSchemaToolbar',
                                'x-settings': 'actionSettings:popup',
                                'x-component': 'Action',
                                'x-component-props': {
                                  openMode: 'drawer',
                                  refreshDataBlockRequest: true,
                                },
                                'x-decorator': 'ACLActionProvider',
                                'x-action-context': {
                                  dataSource: 'main',
                                  collection: 'users',
                                },
                                'x-app-version': '1.6.0-beta.9',
                                properties: {
                                  drawer: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{ t("Popup") }}',
                                    'x-component': 'Action.Container',
                                    'x-component-props': {
                                      className: 'nb-action-popup',
                                    },
                                    'x-app-version': '1.6.0-beta.9',
                                    properties: {
                                      tabs: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        'x-component': 'Tabs',
                                        'x-component-props': {},
                                        'x-initializer': 'popup:addTab',
                                        'x-app-version': '1.6.0-beta.9',
                                        properties: {
                                          tab1: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            title: '{{t("Details")}}',
                                            'x-component': 'Tabs.TabPane',
                                            'x-designer': 'Tabs.Designer',
                                            'x-component-props': {},
                                            'x-app-version': '1.6.0-beta.9',
                                            properties: {
                                              grid: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid',
                                                'x-initializer': 'popup:common:addBlock',
                                                'x-app-version': '1.6.0-beta.9',
                                                'x-uid': '3qfg5qfvsth',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'n0574ydwdua',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'm0039599o9q',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': '5t7ol82dt74',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'gn76wlmk619',
                                'x-async': false,
                                'x-index': 1,
                              },
                              '3jat4vour4y': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                title: '{{ t("Custom request") }}',
                                'x-component': 'CustomRequestAction',
                                'x-action': 'customize:form:request',
                                'x-toolbar': 'ActionSchemaToolbar',
                                'x-settings': 'actionSettings:customRequest',
                                'x-decorator': 'CustomRequestAction.Decorator',
                                'x-action-settings': {
                                  onSuccess: {
                                    manualClose: false,
                                    redirecting: false,
                                    successMessage: '{{t("Request success")}}',
                                  },
                                },
                                type: 'void',
                                'x-app-version': '1.6.0-beta.9',
                                'x-uid': 'gu0shkseqoa',
                                'x-async': false,
                                'x-index': 2,
                              },
                              '0tevnuro5d4': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                title: '{{ t("Link") }}',
                                'x-action': 'customize:link',
                                'x-toolbar': 'ActionSchemaToolbar',
                                'x-settings': 'actionSettings:link',
                                'x-component': 'Action',
                                'x-use-component-props': 'useLinkActionProps',
                                'x-decorator': 'ACLActionProvider',
                                'x-app-version': '1.6.0-beta.9',
                                'x-uid': 'swtrz2mpnm4',
                                'x-async': false,
                                'x-index': 3,
                              },
                            },
                            'x-uid': '32u6fnlj0ti',
                            'x-async': false,
                            'x-index': 1,
                          },
                          grid: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'details:configureFields',
                            'x-app-version': '1.6.0-beta.9',
                            'x-uid': '21ksski5wgs',
                            'x-async': false,
                            'x-index': 2,
                          },
                          pagination: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Pagination',
                            'x-use-component-props': 'useDetailsPaginationProps',
                            'x-app-version': '1.6.0-beta.9',
                            'x-uid': '2cz3ilk7hmv',
                            'x-async': false,
                            'x-index': 3,
                          },
                        },
                        'x-uid': 'f6xosucy75q',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': '33tsqeap83o',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'ppglkb7uvt8',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'af78vam04ux',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'askp9xe9uag',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'huon5vcb8u8',
    'x-async': true,
    'x-index': 1,
  },
};
