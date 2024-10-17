/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
export const T4546 = {
  collections: [
    {
      name: 'general1',
      fields: [
        {
          interface: 'input',
          name: 'singleLineText1',
        },
        {
          interface: 'o2m',
          name: 'oneToMany',
          target: 'general2',
        },
      ],
    },
    {
      name: 'general2',
      fields: [
        {
          interface: 'input',
          name: 'singleLineText2',
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
      bkp6cto13sp: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-index': 1,
        properties: {
          gh2r1al7kar: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.2.3-alpha',
            'x-index': 1,
            properties: {
              j4jda4tyqxs: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.2.3-alpha',
                'x-index': 1,
                properties: {
                  qvhl5c0e5fr: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'general1:list',
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'general1',
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
                    'x-app-version': '1.2.3-alpha',
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
                        'x-app-version': '1.2.3-alpha',
                        'x-index': 1,
                        'x-uid': 'fz75t94s9ic',
                        'x-async': false,
                      },
                      '683o33y8rer': {
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
                        'x-app-version': '1.2.3-alpha',
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
                            'x-app-version': '1.2.3-alpha',
                            'x-index': 1,
                            properties: {
                              '499qzsh9sv9': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '1.2.3-alpha',
                                'x-index': 1,
                                properties: {
                                  p8lsl1pzaag: {
                                    'x-uid': 'ryekrxru9wg',
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
                                                      bufmhbg8gt4: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '1.2.3-alpha',
                                                        'x-index': 1,
                                                        properties: {
                                                          '99le1b5h11l': {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '1.2.3-alpha',
                                                            'x-index': 1,
                                                            properties: {
                                                              '11453vew2oj': {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-decorator': 'TableBlockProvider',
                                                                'x-acl-action': 'general1.oneToMany:list',
                                                                'x-use-decorator-props': 'useTableBlockDecoratorProps',
                                                                'x-decorator-props': {
                                                                  association: 'general1.oneToMany',
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
                                                                'x-app-version': '1.2.3-alpha',
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
                                                                    'x-app-version': '1.2.3-alpha',
                                                                    'x-index': 1,
                                                                    'x-uid': 'ulemxjbqiks',
                                                                    'x-async': false,
                                                                  },
                                                                  xdyly0fcuev: {
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
                                                                    'x-app-version': '1.2.3-alpha',
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
                                                                        'x-app-version': '1.2.3-alpha',
                                                                        'x-index': 1,
                                                                        properties: {
                                                                          s5ao886l1t3: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-decorator': 'DndContext',
                                                                            'x-component': 'Space',
                                                                            'x-component-props': {
                                                                              split: '|',
                                                                            },
                                                                            'x-app-version': '1.2.3-alpha',
                                                                            'x-index': 1,
                                                                            properties: {
                                                                              '2a402p39tio': {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-action': 'duplicate',
                                                                                'x-acl-action': 'create',
                                                                                title: '{{ t("Duplicate") }}',
                                                                                'x-component': 'Action.Link',
                                                                                'x-decorator': 'ACLActionProvider',
                                                                                'x-component-props': {
                                                                                  openMode: 'drawer',
                                                                                  component: 'DuplicateAction',
                                                                                  type: 'primary',
                                                                                  duplicateMode: 'quickDulicate',
                                                                                  duplicateFields: ['singleLineText2'],
                                                                                  duplicateCollection: 'general2',
                                                                                },
                                                                                'x-toolbar': 'ActionSchemaToolbar',
                                                                                'x-settings':
                                                                                  'actionSettings:duplicate',
                                                                                'x-designer-props': {
                                                                                  linkageAction: true,
                                                                                },
                                                                                'x-index': 1,
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
                                                                                            title: '{{t("Duplicate")}}',
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
                                                                                                  'popup:addNew:addBlock',
                                                                                                'x-index': 1,
                                                                                                'x-uid': 'zscq28j13zl',
                                                                                                'x-async': false,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'g7lkyx9hbeq',
                                                                                            'x-async': false,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': 'hzqia0k21mf',
                                                                                        'x-async': false,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': 'ec6vsi4scas',
                                                                                    'x-async': false,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'tch3ucnnvuj',
                                                                                'x-async': false,
                                                                              },
                                                                            },
                                                                            'x-uid': 'tz413ppxhq0',
                                                                            'x-async': false,
                                                                          },
                                                                        },
                                                                        'x-uid': 'zdrr9m9f3px',
                                                                        'x-async': false,
                                                                      },
                                                                      lodkui6ugwp: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-decorator': 'TableV2.Column.Decorator',
                                                                        'x-toolbar': 'TableColumnSchemaToolbar',
                                                                        'x-settings': 'fieldSettings:TableColumn',
                                                                        'x-component': 'TableV2.Column',
                                                                        'x-app-version': '1.2.3-alpha',
                                                                        'x-index': 2,
                                                                        properties: {
                                                                          singleLineText2: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            'x-collection-field':
                                                                              'general2.singleLineText2',
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
                                                                            'x-app-version': '1.2.3-alpha',
                                                                            'x-index': 1,
                                                                            'x-uid': '7xdxkouzxnn',
                                                                            'x-async': false,
                                                                          },
                                                                        },
                                                                        'x-uid': 'ypmuu6043c5',
                                                                        'x-async': false,
                                                                      },
                                                                    },
                                                                    'x-uid': 'b242x72luxa',
                                                                    'x-async': false,
                                                                  },
                                                                },
                                                                'x-uid': '3la01nfn2ot',
                                                                'x-async': false,
                                                              },
                                                            },
                                                            'x-uid': 'god6dyhe02y',
                                                            'x-async': false,
                                                          },
                                                        },
                                                        'x-uid': 'g06nk7vhh57',
                                                        'x-async': false,
                                                      },
                                                    },
                                                    'x-uid': 'luy7po4g939',
                                                    'x-async': false,
                                                  },
                                                },
                                                'x-uid': 'ym9djlca4lk',
                                                'x-async': false,
                                              },
                                            },
                                            'x-uid': 'ra6ms9czl6a',
                                            'x-async': false,
                                          },
                                        },
                                        'x-uid': 'gxsrr993h7i',
                                        'x-async': false,
                                      },
                                    },
                                    'x-async': false,
                                  },
                                },
                                'x-uid': 'a4rwk7gghvn',
                                'x-async': false,
                              },
                            },
                            'x-uid': 'zsib8e4opwv',
                            'x-async': false,
                          },
                        },
                        'x-uid': '7pfo52xnfyb',
                        'x-async': false,
                      },
                    },
                    'x-uid': 'ifi2491hulj',
                    'x-async': false,
                  },
                },
                'x-uid': '66c02ouoiv7',
                'x-async': false,
              },
            },
            'x-uid': '1eqzsva72jq',
            'x-async': false,
          },
        },
        'x-uid': 'ql4uh2tzn1v',
        'x-async': false,
      },
    },
    'x-uid': 'ceud8sybxra',
    'x-async': true,
  },
};
export const theAddBlockButtonInDrawerShouldBeVisible = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-app-version': '1.3.32-beta',
    properties: {
      ydtgms2lmr4: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-app-version': '1.3.32-beta',
        properties: {
          jk8ix7ivmvb: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.3.32-beta',
            properties: {
              fdohqzh304u: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.3.32-beta',
                properties: {
                  syp961jrbvs: {
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
                    'x-app-version': '1.3.32-beta',
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
                        'x-app-version': '1.3.32-beta',
                        'x-uid': 'd9ciqysn98f',
                        'x-async': false,
                        'x-index': 1,
                      },
                      bflk6vcqbda: {
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
                        'x-app-version': '1.3.32-beta',
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
                            'x-app-version': '1.3.32-beta',
                            properties: {
                              '9fy397o5n7x': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '1.3.32-beta',
                                properties: {
                                  ujxoicj1do2: {
                                    'x-uid': 'stie1dytwk9',
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: 'open subpage',
                                    'x-action': 'view',
                                    'x-toolbar': 'ActionSchemaToolbar',
                                    'x-settings': 'actionSettings:view',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'page',
                                      iconColor: '#1677FF',
                                      danger: false,
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
                                                      gkbkej9bcfg: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '1.3.32-beta',
                                                        properties: {
                                                          qsnxw1kyglw: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '1.3.32-beta',
                                                            properties: {
                                                              rg5p0jxa04f: {
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
                                                                'x-app-version': '1.3.32-beta',
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
                                                                    'x-app-version': '1.3.32-beta',
                                                                    'x-uid': 'kdyyiruax36',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                  lodqxwvvrwu: {
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
                                                                    'x-app-version': '1.3.32-beta',
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
                                                                        'x-app-version': '1.3.32-beta',
                                                                        properties: {
                                                                          '1gt1zh3wlhl': {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-decorator': 'DndContext',
                                                                            'x-component': 'Space',
                                                                            'x-component-props': {
                                                                              split: '|',
                                                                            },
                                                                            'x-app-version': '1.3.32-beta',
                                                                            properties: {
                                                                              ertbfj6rncg: {
                                                                                'x-uid': '06gv2hdo5gn',
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-action': 'duplicate',
                                                                                'x-acl-action': 'create',
                                                                                title: 'Duplicate 1',
                                                                                'x-component': 'Action.Link',
                                                                                'x-decorator':
                                                                                  'DuplicateActionDecorator',
                                                                                'x-component-props': {
                                                                                  openMode: 'drawer',
                                                                                  component: 'DuplicateAction',
                                                                                  type: 'primary',
                                                                                  duplicateMode: 'continueduplicate',
                                                                                  duplicateFields: ['nickname'],
                                                                                  duplicateCollection: 'users',
                                                                                  iconColor: '#1677FF',
                                                                                  danger: false,
                                                                                },
                                                                                'x-toolbar': 'ActionSchemaToolbar',
                                                                                'x-settings':
                                                                                  'actionSettings:duplicate',
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
                                                                                        'x-initializer': 'popup:addTab',
                                                                                        properties: {
                                                                                          tab1: {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            title: '{{t("Duplicate")}}',
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
                                                                                                  'popup:addNew:addBlock',
                                                                                                properties: {
                                                                                                  '8688wl2mr4i': {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Row',
                                                                                                    'x-app-version':
                                                                                                      '1.3.32-beta',
                                                                                                    properties: {
                                                                                                      f91h0y067hv: {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'void',
                                                                                                        'x-component':
                                                                                                          'Grid.Col',
                                                                                                        'x-app-version':
                                                                                                          '1.3.32-beta',
                                                                                                        properties: {
                                                                                                          pdsymaj9tip: {
                                                                                                            'x-uid':
                                                                                                              'sdya5bkm9c8',
                                                                                                            _isJSONSchemaObject:
                                                                                                              true,
                                                                                                            version:
                                                                                                              '2.0',
                                                                                                            type: 'void',
                                                                                                            'x-settings':
                                                                                                              'blockSettings:markdown',
                                                                                                            'x-decorator':
                                                                                                              'CardItem',
                                                                                                            'x-decorator-props':
                                                                                                              {
                                                                                                                name: 'markdown',
                                                                                                                engine:
                                                                                                                  'handlebars',
                                                                                                              },
                                                                                                            'x-component':
                                                                                                              'Markdown.Void',
                                                                                                            'x-editable':
                                                                                                              false,
                                                                                                            'x-component-props':
                                                                                                              {
                                                                                                                content:
                                                                                                                  'Duplicate markdown 1.',
                                                                                                              },
                                                                                                            'x-app-version':
                                                                                                              '1.3.32-beta',
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                            'x-index': 1,
                                                                                                          },
                                                                                                        },
                                                                                                        'x-uid':
                                                                                                          '5r3hc64n1ej',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      '774qbcnt3qu',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': '3v32xcbwr7m',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': '0wttna5fpai',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                          wz1yhvrpmrv: {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            title: 'new tab in drawer',
                                                                                            'x-component':
                                                                                              'Tabs.TabPane',
                                                                                            'x-designer':
                                                                                              'Tabs.Designer',
                                                                                            'x-component-props': {},
                                                                                            'x-app-version':
                                                                                              '1.3.32-beta',
                                                                                            properties: {
                                                                                              grid: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component': 'Grid',
                                                                                                'x-initializer':
                                                                                                  'popup:common:addBlock',
                                                                                                'x-app-version':
                                                                                                  '1.3.32-beta',
                                                                                                properties: {
                                                                                                  y5zjil8oaa3: {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Row',
                                                                                                    'x-app-version':
                                                                                                      '1.3.32-beta',
                                                                                                    properties: {
                                                                                                      v0gws5adwan: {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'void',
                                                                                                        'x-component':
                                                                                                          'Grid.Col',
                                                                                                        'x-app-version':
                                                                                                          '1.3.32-beta',
                                                                                                        properties: {
                                                                                                          igm7sdsm3ur: {
                                                                                                            'x-uid':
                                                                                                              'estddzpckrg',
                                                                                                            _isJSONSchemaObject:
                                                                                                              true,
                                                                                                            version:
                                                                                                              '2.0',
                                                                                                            type: 'void',
                                                                                                            'x-settings':
                                                                                                              'blockSettings:markdown',
                                                                                                            'x-decorator':
                                                                                                              'CardItem',
                                                                                                            'x-decorator-props':
                                                                                                              {
                                                                                                                name: 'markdown',
                                                                                                                engine:
                                                                                                                  'handlebars',
                                                                                                              },
                                                                                                            'x-component':
                                                                                                              'Markdown.Void',
                                                                                                            'x-editable':
                                                                                                              false,
                                                                                                            'x-component-props':
                                                                                                              {
                                                                                                                content:
                                                                                                                  'new tab in drawer markdown 1.',
                                                                                                              },
                                                                                                            'x-app-version':
                                                                                                              '1.3.32-beta',
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                            'x-index': 1,
                                                                                                          },
                                                                                                        },
                                                                                                        'x-uid':
                                                                                                          'r0ujr6t1rc1',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'veneg38qs5f',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': '8mng9basz36',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'cmetycyfemg',
                                                                                            'x-async': false,
                                                                                            'x-index': 2,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': '7nlcloha97l',
                                                                                        'x-async': false,
                                                                                        'x-index': 1,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': '22om0z59x41',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'r3rllrh7wzk',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'dmx697o309f',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                    },
                                                                    'x-uid': 'labwg68zvn6',
                                                                    'x-async': false,
                                                                    'x-index': 2,
                                                                  },
                                                                },
                                                                'x-uid': '0fn0tjzur2c',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'goinlb9fan9',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': '74qg393u7hr',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'hetu8763puj',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': '4dn6kb0cmwp',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                              gljvwj6dtl8: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                title: 'new tab',
                                                'x-component': 'Tabs.TabPane',
                                                'x-designer': 'Tabs.Designer',
                                                'x-component-props': {},
                                                'x-app-version': '1.3.32-beta',
                                                properties: {
                                                  grid: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid',
                                                    'x-initializer': 'popup:common:addBlock',
                                                    'x-app-version': '1.3.32-beta',
                                                    properties: {
                                                      c1yhos175hj: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '1.3.32-beta',
                                                        properties: {
                                                          yhbbftd4j86: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '1.3.32-beta',
                                                            properties: {
                                                              '4y4cdnzx645': {
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
                                                                'x-app-version': '1.3.32-beta',
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
                                                                    'x-app-version': '1.3.32-beta',
                                                                    'x-uid': 'mf55d2cpdpx',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                  p5i670h31zl: {
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
                                                                    'x-app-version': '1.3.32-beta',
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
                                                                        'x-app-version': '1.3.32-beta',
                                                                        properties: {
                                                                          owyte0l5cgt: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-decorator': 'DndContext',
                                                                            'x-component': 'Space',
                                                                            'x-component-props': {
                                                                              split: '|',
                                                                            },
                                                                            'x-app-version': '1.3.32-beta',
                                                                            properties: {
                                                                              loi6el5pg6g: {
                                                                                'x-uid': 'a6072zadr0v',
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-action': 'duplicate',
                                                                                'x-acl-action': 'create',
                                                                                title: 'Duplicate 2',
                                                                                'x-component': 'Action.Link',
                                                                                'x-decorator':
                                                                                  'DuplicateActionDecorator',
                                                                                'x-component-props': {
                                                                                  openMode: 'drawer',
                                                                                  component: 'DuplicateAction',
                                                                                  type: 'primary',
                                                                                  duplicateMode: 'continueduplicate',
                                                                                  duplicateFields: ['nickname'],
                                                                                  duplicateCollection: 'users',
                                                                                  iconColor: '#1677FF',
                                                                                  danger: false,
                                                                                },
                                                                                'x-toolbar': 'ActionSchemaToolbar',
                                                                                'x-settings':
                                                                                  'actionSettings:duplicate',
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
                                                                                        'x-initializer': 'popup:addTab',
                                                                                        properties: {
                                                                                          tab1: {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            title: '{{t("Duplicate")}}',
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
                                                                                                  'popup:addNew:addBlock',
                                                                                                properties: {
                                                                                                  dx47nd4vr1y: {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Row',
                                                                                                    'x-app-version':
                                                                                                      '1.3.32-beta',
                                                                                                    properties: {
                                                                                                      k0xrnil5pew: {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'void',
                                                                                                        'x-component':
                                                                                                          'Grid.Col',
                                                                                                        'x-app-version':
                                                                                                          '1.3.32-beta',
                                                                                                        properties: {
                                                                                                          l0bj7opq4ts: {
                                                                                                            'x-uid':
                                                                                                              'irw5rilaksj',
                                                                                                            _isJSONSchemaObject:
                                                                                                              true,
                                                                                                            version:
                                                                                                              '2.0',
                                                                                                            type: 'void',
                                                                                                            'x-settings':
                                                                                                              'blockSettings:markdown',
                                                                                                            'x-decorator':
                                                                                                              'CardItem',
                                                                                                            'x-decorator-props':
                                                                                                              {
                                                                                                                name: 'markdown',
                                                                                                                engine:
                                                                                                                  'handlebars',
                                                                                                              },
                                                                                                            'x-component':
                                                                                                              'Markdown.Void',
                                                                                                            'x-editable':
                                                                                                              false,
                                                                                                            'x-component-props':
                                                                                                              {
                                                                                                                content:
                                                                                                                  'Duplicate markdown 2.',
                                                                                                              },
                                                                                                            'x-app-version':
                                                                                                              '1.3.32-beta',
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                            'x-index': 1,
                                                                                                          },
                                                                                                        },
                                                                                                        'x-uid':
                                                                                                          '989e6tagpg7',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'wbgxmynn5mb',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'q4tpvvow9ev',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': '5nyyobmuuyl',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                          k0dihwjrh0j: {
                                                                                            'x-uid': '1m5bg14aiv9',
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            title: 'new tab in drawer',
                                                                                            'x-component':
                                                                                              'Tabs.TabPane',
                                                                                            'x-designer':
                                                                                              'Tabs.Designer',
                                                                                            'x-component-props': {},
                                                                                            'x-app-version':
                                                                                              '1.3.32-beta',
                                                                                            properties: {
                                                                                              grid: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component': 'Grid',
                                                                                                'x-initializer':
                                                                                                  'popup:common:addBlock',
                                                                                                'x-app-version':
                                                                                                  '1.3.32-beta',
                                                                                                properties: {
                                                                                                  '84pz8mhlfi8': {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Row',
                                                                                                    'x-app-version':
                                                                                                      '1.3.32-beta',
                                                                                                    properties: {
                                                                                                      dbm9wbvxfj5: {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'void',
                                                                                                        'x-component':
                                                                                                          'Grid.Col',
                                                                                                        'x-app-version':
                                                                                                          '1.3.32-beta',
                                                                                                        properties: {
                                                                                                          '5yhn7kfi2yw':
                                                                                                            {
                                                                                                              'x-uid':
                                                                                                                'aa23f01rm3r',
                                                                                                              _isJSONSchemaObject:
                                                                                                                true,
                                                                                                              version:
                                                                                                                '2.0',
                                                                                                              type: 'void',
                                                                                                              'x-settings':
                                                                                                                'blockSettings:markdown',
                                                                                                              'x-decorator':
                                                                                                                'CardItem',
                                                                                                              'x-decorator-props':
                                                                                                                {
                                                                                                                  name: 'markdown',
                                                                                                                  engine:
                                                                                                                    'handlebars',
                                                                                                                },
                                                                                                              'x-component':
                                                                                                                'Markdown.Void',
                                                                                                              'x-editable':
                                                                                                                false,
                                                                                                              'x-component-props':
                                                                                                                {
                                                                                                                  content:
                                                                                                                    'new tab in drawer markdown 2.',
                                                                                                                },
                                                                                                              'x-app-version':
                                                                                                                '1.3.32-beta',
                                                                                                              'x-async':
                                                                                                                false,
                                                                                                              'x-index': 1,
                                                                                                            },
                                                                                                        },
                                                                                                        'x-uid':
                                                                                                          'x2a3ivqab91',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'ekszy9o6ta0',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': '8yjfgyrvord',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-async': false,
                                                                                            'x-index': 2,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': 'w4k13f0dqpt',
                                                                                        'x-async': false,
                                                                                        'x-index': 1,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': '7vaia1fkno1',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'bvc3y7y3fem',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': '4xso516rjk9',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                    },
                                                                    'x-uid': 'dyyuo828wdo',
                                                                    'x-async': false,
                                                                    'x-index': 2,
                                                                  },
                                                                },
                                                                'x-uid': 'um86bfrnd0n',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'bwkvo3771d1',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': '8ecnnc4yvgz',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': '6pmwqi2etjn',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'e88jnt5tv4e',
                                                'x-async': false,
                                                'x-index': 2,
                                              },
                                            },
                                            'x-uid': '2u9lxm7qivt',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'kqabk7m6d7h',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'eqyqzt5letc',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '7t4bewrinmr',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'ouboqexioby',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'e363l9dbg2g',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '9p4tvagqpfd',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'a68euip3d3s',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'hklfkdijm58',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': '536m19repzv',
    'x-async': true,
    'x-index': 1,
  },
};
