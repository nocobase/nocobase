/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PageConfig } from '@nocobase/test/e2e';

const calendarCollection = {
  name: 'calendar',
  template: 'calendar',
};

export const emptyPageWithCalendarCollection: PageConfig = {
  collections: [calendarCollection],
};

export const oneTableWithCalendarCollection: PageConfig = {
  collections: [
    calendarCollection,
    {
      name: 'toManyCalendar',
      fields: [
        {
          name: 'manyToMany',
          interface: 'm2m',
          target: 'calendar',
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
      lqs2pzl6li1: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          viawniezd4p: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              s0nef2zgi5m: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  ibwqgtls50q: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'toManyCalendar:list',
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'toManyCalendar',
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
                        'x-uid': 'xi12fv3arso',
                        'x-async': false,
                        'x-index': 1,
                      },
                      v931jk5mpmg: {
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
                              w4rc8u7s5q0: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                properties: {
                                  hd95fsevokf: {
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
                                                    'x-uid': 'wfpwj2q55xi',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'tvwvyrlvpv6',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'bys1tnlre1o',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'ml2scl3y6se',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'q9gwy03bevt',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'f8i1npjyidq',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'h26hp47w83k',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'bjbs9yvab1k',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': '5i6112zy12n',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '6vh9ncefvs2',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'u4b441tpuzq',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'mworqfx7jaf',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'kgor3l32s12',
    'x-async': true,
    'x-index': 1,
  },
};
export const backgroundColorFieldBasic = {
  collections: [
    {
      name: 'calendar',
      fields: [
        {
          name: 'singleText',
          interface: 'input',
        },
        {
          interface: 'select',
          uiSchema: {
            title: 'Single select',
            type: 'string',
            'x-component': 'Select',
            enum: [
              {
                value: 'b1s9wbnb1of',
                label: 'red',
                color: 'red',
              },
              {
                value: 'zkkpor6acnk',
                label: 'green',
                color: 'green',
              },
              {
                value: '5nj53k4nxjg',
                label: 'blue',
                color: 'blue',
              },
            ],
          },
        },
        {
          interface: 'radioGroup',
          uiSchema: {
            enum: [
              {
                value: 'l28f7llee0h',
                label: 'gold',
                color: 'gold',
              },
              {
                value: 'w80pdvckqga',
                label: 'lime',
                color: 'lime',
              },
              {
                value: 'bq4i930gql2',
                label: 'cyan',
                color: 'cyan',
              },
            ],
            type: 'string',
            'x-component': 'Radio.Group',
            title: 'Radio group',
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
      hsu2v4rjr50: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          '7394n0636cb': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.3.22-beta',
            properties: {
              oz0q63vbxy2: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.3.22-beta',
                properties: {
                  pktfhea4eub: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action': 'calendar:list',
                    'x-decorator': 'CalendarBlockProvider',
                    'x-use-decorator-props': 'useCalendarBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'calendar',
                      dataSource: 'main',
                      action: 'list',
                      fieldNames: {
                        id: 'id',
                        start: 'createdAt',
                        title: 'singleText',
                        end: ['updatedAt'],
                      },
                      params: {
                        paginate: false,
                      },
                    },
                    'x-toolbar': 'BlockSchemaToolbar',
                    'x-settings': 'blockSettings:calendar',
                    'x-component': 'CardItem',
                    'x-app-version': '1.3.22-beta',
                    properties: {
                      '3byzt7u4wnz': {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'CalendarV2',
                        'x-use-component-props': 'useCalendarBlockProps',
                        'x-app-version': '1.3.22-beta',
                        properties: {
                          toolBar: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'CalendarV2.ActionBar',
                            'x-component-props': {
                              style: {
                                marginBottom: 24,
                              },
                            },
                            'x-initializer': 'calendar:configureActions',
                            'x-app-version': '1.3.22-beta',
                            'x-uid': 'v8411egfjtm',
                            'x-async': false,
                            'x-index': 1,
                          },
                          event: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'CalendarV2.Event',
                            'x-app-version': '1.3.22-beta',
                            properties: {
                              drawer: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Action.Container',
                                'x-component-props': {
                                  className: 'nb-action-popup',
                                },
                                title: "{{t('View record', { ns: 'calendar' })}}",
                                'x-app-version': '1.3.22-beta',
                                properties: {
                                  tabs: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Tabs',
                                    'x-component-props': {},
                                    'x-initializer': 'popup:addTab',
                                    'x-initializer-props': {
                                      gridInitializer: 'popup:common:addBlock',
                                    },
                                    'x-app-version': '1.3.22-beta',
                                    properties: {
                                      tab1: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        title: "{{t('Details', { ns: 'calendar' })}}",
                                        'x-component': 'Tabs.TabPane',
                                        'x-designer': 'Tabs.Designer',
                                        'x-component-props': {},
                                        'x-app-version': '1.3.22-beta',
                                        properties: {
                                          grid: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Grid',
                                            'x-initializer-props': {
                                              actionInitializers: 'details:configureActions',
                                            },
                                            'x-initializer': 'popup:common:addBlock',
                                            'x-app-version': '1.3.22-beta',
                                            'x-uid': 'f58sh31pm0e',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'akuiknd4af2',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'k7r14sqqjfx',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'rhqf8zhc1vc',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'nvx5lwhpcl6',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': '7km5lr1a7uc',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': '5grvnpumvhd',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '723oca1vx1l',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'mogc1df80uh',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'lzuv4wavilz',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'wg0v4pihpus',
    'x-async': true,
    'x-index': 1,
  },
};
export const clickingAndClosingNestedPopups = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-app-version': '1.4.2',
    properties: {
      gu3lh4ohfmv: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-app-version': '1.4.2',
        properties: {
          '0k716vx55jw': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.4.2',
            properties: {
              '071seig43nq': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.4.2',
                properties: {
                  '27bjkk814v0': {
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
                    'x-app-version': '1.4.2',
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
                        'x-app-version': '1.4.2',
                        'x-uid': 'bpji6jn3v1f',
                        'x-async': false,
                        'x-index': 1,
                      },
                      nzjfwy6u3xz: {
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
                        'x-app-version': '1.4.2',
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
                            'x-app-version': '1.4.2',
                            properties: {
                              t1guxxh00u2: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '1.4.2',
                                properties: {
                                  ibdtt3wddl1: {
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
                                                      j42bnb1n6yi: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '1.4.2',
                                                        properties: {
                                                          wg7hugxuf56: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '1.4.2',
                                                            properties: {
                                                              '2hp241xeuef': {
                                                                'x-uid': '0y9z2g6e5ea',
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action': 'users:list',
                                                                'x-decorator': 'CalendarBlockProvider',
                                                                'x-use-decorator-props':
                                                                  'useCalendarBlockDecoratorProps',
                                                                'x-decorator-props': {
                                                                  collection: 'users',
                                                                  dataSource: 'main',
                                                                  action: 'list',
                                                                  fieldNames: {
                                                                    id: 'id',
                                                                    start: 'createdAt',
                                                                    title: 'nickname',
                                                                    end: ['updatedAt'],
                                                                  },
                                                                  params: {
                                                                    paginate: false,
                                                                  },
                                                                },
                                                                'x-toolbar': 'BlockSchemaToolbar',
                                                                'x-settings': 'blockSettings:calendar',
                                                                'x-component': 'CardItem',
                                                                'x-app-version': '1.4.2',
                                                                'x-component-props': {
                                                                  title: 'Calendar block',
                                                                },
                                                                properties: {
                                                                  '57jxlpnfu9t': {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'CalendarV2',
                                                                    'x-use-component-props': 'useCalendarBlockProps',
                                                                    'x-app-version': '1.4.2',
                                                                    properties: {
                                                                      toolBar: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'CalendarV2.ActionBar',
                                                                        'x-component-props': {
                                                                          style: {
                                                                            marginBottom: 24,
                                                                          },
                                                                        },
                                                                        'x-initializer': 'calendar:configureActions',
                                                                        'x-app-version': '1.4.2',
                                                                        'x-uid': 'ia38586h8fo',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                      event: {
                                                                        'x-uid': 'e8svncxqkp7',
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'CalendarV2.Event',
                                                                        'x-app-version': '1.4.2',
                                                                        'x-action-context': {
                                                                          dataSource: 'main',
                                                                          collection: 'users',
                                                                        },
                                                                        properties: {
                                                                          drawer: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Action.Container',
                                                                            'x-component-props': {
                                                                              className: 'nb-action-popup',
                                                                            },
                                                                            title:
                                                                              "{{t('View record', { ns: 'calendar' })}}",
                                                                            'x-app-version': '1.4.2',
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
                                                                                    'popup:common:addBlock',
                                                                                },
                                                                                'x-app-version': '1.4.2',
                                                                                properties: {
                                                                                  tab1: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'void',
                                                                                    title:
                                                                                      "{{t('Details', { ns: 'calendar' })}}",
                                                                                    'x-component': 'Tabs.TabPane',
                                                                                    'x-designer': 'Tabs.Designer',
                                                                                    'x-component-props': {},
                                                                                    'x-app-version': '1.4.2',
                                                                                    properties: {
                                                                                      grid: {
                                                                                        _isJSONSchemaObject: true,
                                                                                        version: '2.0',
                                                                                        type: 'void',
                                                                                        'x-component': 'Grid',
                                                                                        'x-initializer-props': {
                                                                                          actionInitializers:
                                                                                            'details:configureActions',
                                                                                        },
                                                                                        'x-initializer':
                                                                                          'popup:common:addBlock',
                                                                                        'x-app-version': '1.4.2',
                                                                                        properties: {
                                                                                          bh4zvrtn09t: {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            'x-component': 'Grid.Row',
                                                                                            'x-app-version': '1.4.2',
                                                                                            properties: {
                                                                                              '0lh42pfh3ph': {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component':
                                                                                                  'Grid.Col',
                                                                                                'x-app-version':
                                                                                                  '1.4.2',
                                                                                                properties: {
                                                                                                  '2kq6pr243vl': {
                                                                                                    'x-uid':
                                                                                                      '21wdilxulem',
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
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
                                                                                                    'x-editable': false,
                                                                                                    'x-component-props':
                                                                                                      {
                                                                                                        content:
                                                                                                          'Calendar popup.',
                                                                                                      },
                                                                                                    'x-app-version':
                                                                                                      '1.4.2',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'z94z356ifbk',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'xwmfjtwnihr',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': 'cmn694oblps',
                                                                                        'x-async': false,
                                                                                        'x-index': 1,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': 'mgj91lvgxfh',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'felpqurn0fk',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'qc3g6z67zut',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': 'j1cysoi2ifz',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': '45q1me8jji6',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'uq380f0t9p7',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 's9r0d0qwkyl',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'ne2ocpkouz7',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'tkavcfe78kj',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'iz6ogq6s0mi',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': '9i1fmjqbp2k',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': '7o9hpj80o2d',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'c04kw7704np',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'na4gq4s5he9',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'jxwnopamkgz',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '413e4dqcg8x',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'q8teoqpn6st',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'r0kszo8gmy6',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'srs7hnvxpoa',
    'x-async': true,
    'x-index': 1,
  },
};
