import { CollectionSetting, PageConfig, general } from '@nocobase/test/e2e';

/**
 * 1. 创建一个名为 general 的 collection，其包含 时间、Percent 类型的字段
 */
export const generalWithDatetimeFields: CollectionSetting[] = [
  {
    name: 'general',
    title: 'General',
    fields: [
      {
        name: 'singleLineText',
        interface: 'input',
        uiSchema: {
          type: 'string',
          'x-component': 'Input',
          title: 'Single line text',
        },
      },
      {
        name: 'startDatetime',
        interface: 'datetime',
        uiSchema: {
          type: 'string',
          'x-component': 'DatePicker',
          title: 'Start date time',
          required: true,
        },
      },
      {
        name: 'endDatetime',
        interface: 'datetime',
        uiSchema: {
          type: 'string',
          'x-component': 'DatePicker',
          title: 'End date time',
          required: true,
        },
      },
      {
        name: 'f_t22o7loai3j',
        interface: 'integer',
        isForeignKey: true,
        uiSchema: {
          type: 'number',
          title: 'f_t22o7loai3j',
          'x-component': 'InputNumber',
          'x-read-pretty': true,
        },
      },
      {
        name: 'manyToOne',
        interface: 'm2o',
        foreignKey: 'f_t22o7loai3j',
        uiSchema: {
          'x-component': 'AssociationField',
          'x-component-props': {
            multiple: false,
            fieldNames: {
              label: 'id',
              value: 'id',
            },
          },
          title: 'Many to one',
        },
        target: 'users',
        targetKey: 'id',
      },
      {
        name: 'percent',
        type: 'float',
        interface: 'percent',
        uiSchema: {
          'x-component-props': {
            step: '0.01',
            stringMode: true,
            addonAfter: '%',
          },
          'x-component': 'Percent',
          title: 'Percent',
        },
      },
    ],
  },
];

export const oneEmptyGantt: PageConfig = {
  collections: generalWithDatetimeFields,
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      jebhzap4dzi: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          gl57m4hyewf: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              jm7n5dybw6t: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  nsq0rdemz4i: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action': 'general:list',
                    'x-decorator': 'GanttBlockProvider',
                    'x-decorator-props': {
                      collection: 'general',
                      resource: 'general',
                      action: 'list',
                      fieldNames: {
                        id: 'id',
                        start: 'startDatetime',
                        range: 'day',
                        title: 'singleLineText',
                        end: 'endDatetime',
                      },
                      params: {
                        paginate: false,
                      },
                    },
                    'x-designer': 'Gantt.Designer',
                    'x-component': 'CardItem',
                    properties: {
                      zf07g7relim: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'Gantt',
                        'x-component-props': {
                          useProps: '{{ useGanttBlockProps }}',
                        },
                        properties: {
                          toolBar: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'ActionBar',
                            'x-component-props': {
                              style: {
                                marginBottom: 24,
                              },
                            },
                            'x-initializer': 'gantt:configureActions',
                            'x-uid': 'guwovmwt4c0',
                            'x-async': false,
                            'x-index': 1,
                          },
                          table: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'array',
                            'x-decorator': 'div',
                            'x-decorator-props': {
                              style: {
                                float: 'left',
                                maxWidth: '35%',
                              },
                            },
                            'x-initializer': 'table:configureColumns',
                            'x-component': 'TableV2',
                            'x-component-props': {
                              rowKey: 'id',
                              rowSelection: {
                                type: 'checkbox',
                              },
                              useProps: '{{ useTableBlockProps }}',
                              pagination: false,
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
                                    'x-uid': '9in7s3pymsd',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'rgpbsjwvq2h',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'g7qwompxaeo',
                            'x-async': false,
                            'x-index': 2,
                          },
                          detail: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Gantt.Event',
                            properties: {
                              drawer: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Action.Drawer',
                                'x-component-props': {
                                  className: 'nb-action-popup',
                                },
                                title: '{{ t("View record") }}',
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
                                            'x-uid': 'gxtfjqzxbfu',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'zxwwx4358p1',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': '1p0tnmzpsim',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'hcue8v3fwti',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'fg7cjxu4hxp',
                            'x-async': false,
                            'x-index': 3,
                          },
                        },
                        'x-uid': 'rf47sf7k16z',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'tritqukkd86',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '3am2ctuhyka',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'p8pesbc7fiv',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'ddm9fhkvrbw',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'vpk8sp3eap1',
    'x-async': true,
    'x-index': 1,
  },
};

/**
 * 页面中有一个空的 Table 区块，并且有这些按钮：Add new / Delete / Refresh / Add record / Filter / view / edit / delete / duplicate
 */
export const oneEmptyTableBlockWithDuplicateActions: PageConfig = {
  collections: general,
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
          '1m4gz110aaw': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              '695oy51236d': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  twtgsvrdmn1: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'general:list',
                    'x-decorator-props': {
                      collection: 'general',
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
                        properties: {},
                        'x-uid': 'znrsshrlsna',
                        'x-async': false,
                        'x-index': 1,
                      },
                      '1xnl1d9j48o': {
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
                                  '659x6w2yydk': {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-action': 'duplicate',
                                    'x-acl-action': 'create',
                                    title: '{{ t("Duplicate") }}',
                                    'x-designer': 'Action.Designer',
                                    'x-component': 'Action.Link',
                                    'x-decorator': 'ACLActionProvider',
                                    'x-component-props': {
                                      openMode: 'drawer',
                                      component: 'DuplicateAction',
                                    },
                                    'x-designer-props': {
                                      linkageAction: true,
                                    },
                                    properties: {
                                      drawer: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        title: '{{ t("Duplicate") }}',
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
                                                title: '{{t("Duplicate")}}',
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
                                                    'x-uid': 'vtcnkzcaeec',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'kbq4w0dmexr',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': '1v4k1kjpbi5',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'ok9iw50ycdh',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'sjg3udjdnc1',
                                    'x-async': false,
                                    'x-index': 4,
                                  },
                                },
                                'x-uid': 'ijgo5usyzbp',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '5tnwpodzirq',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'k8t01z9qna3',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'c29q4s49svw',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '9pe6fpnq33f',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'j6g551r7tbp',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'mbw5vw7y3ea',
        'x-async': false,
      },
    },
    'x-uid': '4mbt7m7in1l',
    'x-async': true,
  },
};
