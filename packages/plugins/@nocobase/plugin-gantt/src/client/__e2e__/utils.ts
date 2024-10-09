/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionSetting, PageConfig } from '@nocobase/test/e2e';

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
        name: 'singleLineText2',
        interface: 'input',
        uiSchema: {
          type: 'string',
          'x-component': 'Input',
          title: 'Single line text2',
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
        name: 'startDatetime2',
        interface: 'datetime',
        uiSchema: {
          type: 'string',
          'x-component': 'DatePicker',
          title: 'Start date time2',
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
        name: 'endDatetime2',
        interface: 'datetime',
        uiSchema: {
          type: 'string',
          'x-component': 'DatePicker',
          title: 'End date time2',
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
      {
        name: 'percent2',
        type: 'float',
        interface: 'percent',
        uiSchema: {
          'x-component-props': {
            step: '0.01',
            stringMode: true,
            addonAfter: '%',
          },
          'x-component': 'Percent',
          title: 'Percent2',
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
export const afterClosingThePopupItShouldRemainAtThePositionInTheSubpage = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      '79woycgmvs3': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          onpptlq1tpv: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.3.27-beta',
            properties: {
              mzqgupkrmjj: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.3.27-beta',
                properties: {
                  u4i5l9pn901: {
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
                    'x-app-version': '1.3.27-beta',
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
                        'x-app-version': '1.3.27-beta',
                        'x-uid': 'rebvxh6sgwf',
                        'x-async': false,
                        'x-index': 1,
                      },
                      csyibvgvudj: {
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
                        'x-app-version': '1.3.27-beta',
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
                            'x-app-version': '1.3.27-beta',
                            properties: {
                              a563df5oj23: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '1.3.27-beta',
                                properties: {
                                  eslc308794h: {
                                    'x-uid': 'sc064aqibw0',
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
                                                      mtixuqkge8o: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '1.3.27-beta',
                                                        properties: {
                                                          '93oahjj0q75': {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '1.3.27-beta',
                                                            properties: {
                                                              k54kqt08ln0: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action': 'users:list',
                                                                'x-decorator': 'GanttBlockProvider',
                                                                'x-decorator-props': {
                                                                  collection: 'users',
                                                                  dataSource: 'main',
                                                                  action: 'list',
                                                                  fieldNames: {
                                                                    start: 'createdAt',
                                                                    range: 'day',
                                                                    title: 'nickname',
                                                                    end: 'updatedAt',
                                                                  },
                                                                  params: {
                                                                    paginate: false,
                                                                  },
                                                                },
                                                                'x-toolbar': 'BlockSchemaToolbar',
                                                                'x-settings': 'blockSettings:gantt',
                                                                'x-component': 'CardItem',
                                                                'x-app-version': '1.3.27-beta',
                                                                properties: {
                                                                  euymb62rll6: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'Gantt',
                                                                    'x-use-component-props': 'useGanttBlockProps',
                                                                    'x-app-version': '1.3.27-beta',
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
                                                                        'x-app-version': '1.3.27-beta',
                                                                        'x-uid': 'nr41w0z8uz4',
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
                                                                        'x-use-component-props': 'useTableBlockProps',
                                                                        'x-component-props': {
                                                                          rowKey: 'id',
                                                                          rowSelection: {
                                                                            type: 'checkbox',
                                                                          },
                                                                          pagination: false,
                                                                        },
                                                                        'x-app-version': '1.3.27-beta',
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
                                                                            'x-initializer':
                                                                              'table:configureItemActions',
                                                                            'x-settings': 'fieldSettings:TableColumn',
                                                                            'x-toolbar-props': {
                                                                              initializer: 'table:configureItemActions',
                                                                            },
                                                                            'x-app-version': '1.3.27-beta',
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
                                                                                'x-app-version': '1.3.27-beta',
                                                                                'x-uid': 'kl77wfxdwb7',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': '9em1qcmjeij',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': '062jv45zw9c',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                      detail: {
                                                                        'x-uid': 'tpx71rrfxfh',
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Gantt.Event',
                                                                        'x-app-version': '1.3.27-beta',
                                                                        'x-action-context': {
                                                                          dataSource: 'main',
                                                                          collection: 'users',
                                                                        },
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
                                                                            'x-app-version': '1.3.27-beta',
                                                                            properties: {
                                                                              tabs: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Tabs',
                                                                                'x-component-props': {},
                                                                                'x-initializer': 'popup:addTab',
                                                                                'x-app-version': '1.3.27-beta',
                                                                                properties: {
                                                                                  tab1: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'void',
                                                                                    title: '{{t("Details")}}',
                                                                                    'x-component': 'Tabs.TabPane',
                                                                                    'x-designer': 'Tabs.Designer',
                                                                                    'x-component-props': {},
                                                                                    'x-app-version': '1.3.27-beta',
                                                                                    properties: {
                                                                                      grid: {
                                                                                        _isJSONSchemaObject: true,
                                                                                        version: '2.0',
                                                                                        type: 'void',
                                                                                        'x-component': 'Grid',
                                                                                        'x-initializer':
                                                                                          'popup:common:addBlock',
                                                                                        'x-app-version': '1.3.27-beta',
                                                                                        properties: {
                                                                                          '6k25zyi2p13': {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            'x-component': 'Grid.Row',
                                                                                            'x-app-version':
                                                                                              '1.3.27-beta',
                                                                                            properties: {
                                                                                              jrqsoakbtfr: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component':
                                                                                                  'Grid.Col',
                                                                                                'x-app-version':
                                                                                                  '1.3.27-beta',
                                                                                                properties: {
                                                                                                  a74ravc3mv3: {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-acl-action':
                                                                                                      'users:get',
                                                                                                    'x-decorator':
                                                                                                      'DetailsBlockProvider',
                                                                                                    'x-use-decorator-props':
                                                                                                      'useDetailsDecoratorProps',
                                                                                                    'x-decorator-props':
                                                                                                      {
                                                                                                        dataSource:
                                                                                                          'main',
                                                                                                        collection:
                                                                                                          'users',
                                                                                                        readPretty:
                                                                                                          true,
                                                                                                        action: 'get',
                                                                                                      },
                                                                                                    'x-toolbar':
                                                                                                      'BlockSchemaToolbar',
                                                                                                    'x-settings':
                                                                                                      'blockSettings:details',
                                                                                                    'x-component':
                                                                                                      'CardItem',
                                                                                                    'x-app-version':
                                                                                                      '1.3.27-beta',
                                                                                                    properties: {
                                                                                                      lw2k5erjj1c: {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'void',
                                                                                                        'x-component':
                                                                                                          'Details',
                                                                                                        'x-read-pretty':
                                                                                                          true,
                                                                                                        'x-use-component-props':
                                                                                                          'useDetailsProps',
                                                                                                        'x-app-version':
                                                                                                          '1.3.27-beta',
                                                                                                        properties: {
                                                                                                          gnr2t0yazam: {
                                                                                                            _isJSONSchemaObject:
                                                                                                              true,
                                                                                                            version:
                                                                                                              '2.0',
                                                                                                            type: 'void',
                                                                                                            'x-initializer':
                                                                                                              'details:configureActions',
                                                                                                            'x-component':
                                                                                                              'ActionBar',
                                                                                                            'x-component-props':
                                                                                                              {
                                                                                                                style: {
                                                                                                                  marginBottom: 24,
                                                                                                                },
                                                                                                              },
                                                                                                            'x-app-version':
                                                                                                              '1.3.27-beta',
                                                                                                            'x-uid':
                                                                                                              '4qcklj4ky5u',
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                            'x-index': 1,
                                                                                                          },
                                                                                                          grid: {
                                                                                                            _isJSONSchemaObject:
                                                                                                              true,
                                                                                                            version:
                                                                                                              '2.0',
                                                                                                            type: 'void',
                                                                                                            'x-component':
                                                                                                              'Grid',
                                                                                                            'x-initializer':
                                                                                                              'details:configureFields',
                                                                                                            'x-app-version':
                                                                                                              '1.3.27-beta',
                                                                                                            properties:
                                                                                                              {
                                                                                                                yt2cmc7l3lw:
                                                                                                                  {
                                                                                                                    _isJSONSchemaObject:
                                                                                                                      true,
                                                                                                                    version:
                                                                                                                      '2.0',
                                                                                                                    type: 'void',
                                                                                                                    'x-component':
                                                                                                                      'Grid.Row',
                                                                                                                    'x-app-version':
                                                                                                                      '1.3.27-beta',
                                                                                                                    properties:
                                                                                                                      {
                                                                                                                        i8tl6rdr45u:
                                                                                                                          {
                                                                                                                            _isJSONSchemaObject:
                                                                                                                              true,
                                                                                                                            version:
                                                                                                                              '2.0',
                                                                                                                            type: 'void',
                                                                                                                            'x-component':
                                                                                                                              'Grid.Col',
                                                                                                                            'x-app-version':
                                                                                                                              '1.3.27-beta',
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
                                                                                                                                      '1.3.27-beta',
                                                                                                                                    'x-uid':
                                                                                                                                      'f6cu17st3jk',
                                                                                                                                    'x-async':
                                                                                                                                      false,
                                                                                                                                    'x-index': 1,
                                                                                                                                  },
                                                                                                                              },
                                                                                                                            'x-uid':
                                                                                                                              'x8mzhjyuuq2',
                                                                                                                            'x-async':
                                                                                                                              false,
                                                                                                                            'x-index': 1,
                                                                                                                          },
                                                                                                                      },
                                                                                                                    'x-uid':
                                                                                                                      'r1hprxhv53l',
                                                                                                                    'x-async':
                                                                                                                      false,
                                                                                                                    'x-index': 1,
                                                                                                                  },
                                                                                                              },
                                                                                                            'x-uid':
                                                                                                              'xao1ij9g15r',
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                            'x-index': 2,
                                                                                                          },
                                                                                                        },
                                                                                                        'x-uid':
                                                                                                          'y6wlx938m5w',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'ep2wzdhgrrv',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'tzsc4imyfhj',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': '50ttqtoyr0e',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': 'bep7tei5hba',
                                                                                        'x-async': false,
                                                                                        'x-index': 1,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': 'zazio208q6f',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'f590xf64fak',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': '3kacbp6e7dl',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-async': false,
                                                                        'x-index': 3,
                                                                      },
                                                                    },
                                                                    'x-uid': 'xy9lckgsf50',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': 'aphwm07oggq',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'lb9srabrys8',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': '7yydwenlkpq',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'o97josjrwyr',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'pcjk74vze8a',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'r70zif4ctyj',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'u2j899gcs5e',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'iv7gd6nu110',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'g0dkrmgaz8k',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'gznl9jbdtz9',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': '0bxjghlvyng',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'b3axgqivx61',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': '2hb47rc673g',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'lufab41vr4l',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': '6tym3zf3m2c',
    'x-async': true,
    'x-index': 1,
  },
};
