/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PageConfig, generalWithMultiLevelM2oFields } from '@nocobase/test/e2e';

export const T2797: PageConfig = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-index': 1,
    properties: {
      anaca99jfos: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-index': 1,
        properties: {
          '921il71tsii': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-index': 1,
            properties: {
              '6s5exwpw6k1': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-index': 1,
                properties: {
                  m1vdqkujhfd: {
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
                        sort: ['id'],
                        filter: {},
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
                        'x-uid': 'ekut6r82rxy',
                        'x-async': false,
                      },
                      buql1oo309b: {
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
                                  xoem0ayb9dg: {
                                    'x-uid': 'x5h22i05z9y',
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: 'Popup drawer',
                                    'x-action': 'customize:popup',
                                    'x-designer': 'Action.Designer',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'drawer',
                                      danger: false,
                                    },
                                    'x-designer-props': {
                                      linkageAction: true,
                                    },
                                    'x-index': 1,
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
                                                      uq6k35ibdum: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-index': 1,
                                                        properties: {
                                                          gju15zbxua7: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-index': 1,
                                                            properties: {
                                                              '3gvctyne9ch': {
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
                                                                'x-index': 1,
                                                                properties: {
                                                                  rf52acn3z2h: {
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
                                                                        'x-uid': '1d3zru9pi2o',
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
                                                                        properties: {
                                                                          r5fvw6udpo5: {
                                                                            'x-uid': 'fhhipgvw969',
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            title: 'Popup drawer',
                                                                            'x-action': 'customize:popup',
                                                                            'x-designer': 'Action.Designer',
                                                                            'x-component': 'Action',
                                                                            'x-component-props': {
                                                                              openMode: 'drawer',
                                                                              danger: false,
                                                                              type: 'default',
                                                                            },
                                                                            'x-index': 1,
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
                                                                                'x-index': 1,
                                                                                properties: {
                                                                                  tabs: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'void',
                                                                                    'x-component': 'Tabs',
                                                                                    'x-component-props': {},
                                                                                    'x-initializer':
                                                                                      'TabPaneInitializers',
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
                                                                                            'x-initializer':
                                                                                              'popup:common:addBlock',
                                                                                            'x-index': 1,
                                                                                            properties: {
                                                                                              i7919iug0zf: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component':
                                                                                                  'Grid.Row',
                                                                                                'x-index': 1,
                                                                                                properties: {
                                                                                                  fnfowdb69of: {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Col',
                                                                                                    'x-index': 1,
                                                                                                    properties: {
                                                                                                      '7a1tbf51g8v': {
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
                                                                                                          'users:update',
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
                                                                                                              'users',
                                                                                                            collection:
                                                                                                              'users',
                                                                                                          },
                                                                                                        'x-designer':
                                                                                                          'FormV2.Designer',
                                                                                                        'x-component':
                                                                                                          'CardItem',
                                                                                                        'x-component-props':
                                                                                                          {},
                                                                                                        'x-index': 1,
                                                                                                        properties: {
                                                                                                          nn34pmsspnz: {
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
                                                                                                            'x-index': 1,
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
                                                                                                                  'x-index': 1,
                                                                                                                  'x-uid':
                                                                                                                    'k9p2rqt49v1',
                                                                                                                  'x-async':
                                                                                                                    false,
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
                                                                                                                    'x-index': 2,
                                                                                                                    properties:
                                                                                                                      {
                                                                                                                        m1d82kfi4wj:
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
                                                                                                                            'x-designer':
                                                                                                                              'Action.Designer',
                                                                                                                            'x-component-props':
                                                                                                                              {
                                                                                                                                type: 'primary',
                                                                                                                                htmlType:
                                                                                                                                  'submit',
                                                                                                                                useProps:
                                                                                                                                  '{{ useUpdateActionProps }}',
                                                                                                                              },
                                                                                                                            'x-action-settings':
                                                                                                                              {
                                                                                                                                triggerWorkflows:
                                                                                                                                  [],
                                                                                                                              },
                                                                                                                            type: 'void',
                                                                                                                            'x-index': 1,
                                                                                                                            'x-uid':
                                                                                                                              '9mm8kvh4o2m',
                                                                                                                            'x-async':
                                                                                                                              false,
                                                                                                                          },
                                                                                                                      },
                                                                                                                    'x-uid':
                                                                                                                      'on41cr8zg41',
                                                                                                                    'x-async':
                                                                                                                      false,
                                                                                                                  },
                                                                                                              },
                                                                                                            'x-uid':
                                                                                                              'y6uigc4n4vm',
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                          },
                                                                                                        },
                                                                                                        'x-uid':
                                                                                                          'fnj75090iwa',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'y7t6l50j29g',
                                                                                                    'x-async': false,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'gcaxegx915j',
                                                                                                'x-async': false,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'oijx43exgjw',
                                                                                            'x-async': false,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': 'uss69qgzgfr',
                                                                                        'x-async': false,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': 'wo27pk5oaxl',
                                                                                    'x-async': false,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'ssukg1yq6xs',
                                                                                'x-async': false,
                                                                              },
                                                                            },
                                                                            'x-async': false,
                                                                          },
                                                                        },
                                                                        'x-uid': 'g6i2gve8d67',
                                                                        'x-async': false,
                                                                      },
                                                                    },
                                                                    'x-uid': 'bmm6oo074xl',
                                                                    'x-async': false,
                                                                  },
                                                                },
                                                                'x-uid': '46e0m820bo2',
                                                                'x-async': false,
                                                              },
                                                            },
                                                            'x-uid': '1gvrltd8yqg',
                                                            'x-async': false,
                                                          },
                                                        },
                                                        'x-uid': 'w97q3lbbsh4',
                                                        'x-async': false,
                                                      },
                                                    },
                                                    'x-uid': '6l2ef5vge85',
                                                    'x-async': false,
                                                  },
                                                },
                                                'x-uid': 'n4cpdx9ysfb',
                                                'x-async': false,
                                              },
                                            },
                                            'x-uid': 'o06coc1mgwa',
                                            'x-async': false,
                                          },
                                        },
                                        'x-uid': '7zj8405odj1',
                                        'x-async': false,
                                      },
                                    },
                                    'x-async': false,
                                  },
                                },
                                'x-uid': 'd72ecevv19r',
                                'x-async': false,
                              },
                            },
                            'x-uid': 'dymj7cnulu9',
                            'x-async': false,
                          },
                          ehaaqzdovop: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-designer': 'TableV2.Column.Designer',
                            'x-component': 'TableV2.Column',
                            'x-index': 2,
                            properties: {
                              id: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'users.id',
                                'x-component': 'CollectionField',
                                'x-component-props': {},
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-index': 1,
                                'x-uid': '4xk1wkpwu0x',
                                'x-async': false,
                              },
                            },
                            'x-uid': '9kcdkg7zqss',
                            'x-async': false,
                          },
                        },
                        'x-uid': '8zzc49ye7c1',
                        'x-async': false,
                      },
                    },
                    'x-uid': 'j5a3t93mc8y',
                    'x-async': false,
                  },
                },
                'x-uid': 'ngqxn545h2z',
                'x-async': false,
              },
            },
            'x-uid': 'qbwre8gvolh',
            'x-async': false,
          },
        },
        'x-uid': 'b9f5kb02zxd',
        'x-async': false,
      },
    },
    'x-uid': '6u34l9yf166',
    'x-async': true,
  },
};

export const T2838: PageConfig = {
  collections: generalWithMultiLevelM2oFields,
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-index': 1,
    properties: {
      gk0rcxdp7ci: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-index': 1,
        properties: {
          ocvzef7y4nh: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-index': 1,
            properties: {
              wgt31pysku3: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-index': 1,
                properties: {
                  e36qxkskmws: {
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
                        'x-uid': '9g7iqgfistn',
                        'x-async': false,
                      },
                      ewrmbv48omq: {
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
                                  mxf2vugzynw: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: 'Edit record',
                                    'x-action': 'update',
                                    'x-designer': 'Action.Designer',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'modal',
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
                                                      w9u8i9nzh10: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-index': 1,
                                                        properties: {
                                                          iq0d99ing5f: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-index': 1,
                                                            properties: {
                                                              '8ng5a7gfnxu': {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action': 'general.m2oField0:get',
                                                                'x-decorator': 'FormBlockProvider',
                                                                'x-decorator-props': {
                                                                  resource: 'general.m2oField0',
                                                                  collection: 'm2oField1',
                                                                  association: 'general.m2oField0',
                                                                  readPretty: true,
                                                                  action: 'get',
                                                                  useParams: '{{ useParamsFromRecord }}',
                                                                  useSourceId: '{{ useSourceIdFromParentRecord }}',
                                                                },
                                                                'x-designer': 'FormV2.ReadPrettyDesigner',
                                                                'x-component': 'CardItem',
                                                                'x-index': 1,
                                                                properties: {
                                                                  xed9u6i5rke: {
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
                                                                        properties: {
                                                                          j8yl7ufxycc: {
                                                                            'x-uid': 't5zvkjpt399',
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            title: 'Edit button 1',
                                                                            'x-action': 'update',
                                                                            'x-designer': 'Action.Designer',
                                                                            'x-component': 'Action',
                                                                            'x-component-props': {
                                                                              openMode: 'modal',
                                                                              icon: 'EditOutlined',
                                                                              type: 'primary',
                                                                              danger: false,
                                                                            },
                                                                            'x-decorator': 'ACLActionProvider',
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
                                                                                    'x-initializer':
                                                                                      'TabPaneInitializers',
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
                                                                                            'x-initializer':
                                                                                              'popup:common:addBlock',
                                                                                            'x-index': 1,
                                                                                            properties: {
                                                                                              nclrn6m8w40: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component':
                                                                                                  'Grid.Row',
                                                                                                'x-index': 1,
                                                                                                properties: {
                                                                                                  '986i76o9mkl': {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Col',
                                                                                                    'x-index': 1,
                                                                                                    properties: {
                                                                                                      ofcetydqvzr: {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'void',
                                                                                                        'x-acl-action':
                                                                                                          'general.m2oField0:get',
                                                                                                        'x-decorator':
                                                                                                          'FormBlockProvider',
                                                                                                        'x-decorator-props':
                                                                                                          {
                                                                                                            resource:
                                                                                                              'general.m2oField0',
                                                                                                            collection:
                                                                                                              'm2oField1',
                                                                                                            association:
                                                                                                              'general.m2oField0',
                                                                                                            readPretty:
                                                                                                              true,
                                                                                                            action:
                                                                                                              'get',
                                                                                                            useParams:
                                                                                                              '{{ useParamsFromRecord }}',
                                                                                                            useSourceId:
                                                                                                              '{{ useSourceIdFromParentRecord }}',
                                                                                                          },
                                                                                                        'x-designer':
                                                                                                          'FormV2.ReadPrettyDesigner',
                                                                                                        'x-component':
                                                                                                          'CardItem',
                                                                                                        'x-index': 1,
                                                                                                        properties: {
                                                                                                          bt4u5tt1zeu: {
                                                                                                            _isJSONSchemaObject:
                                                                                                              true,
                                                                                                            version:
                                                                                                              '2.0',
                                                                                                            type: 'void',
                                                                                                            'x-component':
                                                                                                              'FormV2',
                                                                                                            'x-read-pretty':
                                                                                                              true,
                                                                                                            'x-component-props':
                                                                                                              {
                                                                                                                useProps:
                                                                                                                  '{{ useFormBlockProps }}',
                                                                                                              },
                                                                                                            'x-index': 1,
                                                                                                            properties:
                                                                                                              {
                                                                                                                actions:
                                                                                                                  {
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
                                                                                                                        style:
                                                                                                                          {
                                                                                                                            marginBottom: 24,
                                                                                                                          },
                                                                                                                      },
                                                                                                                    'x-index': 1,
                                                                                                                    properties:
                                                                                                                      {
                                                                                                                        tt6sks0prnw:
                                                                                                                          {
                                                                                                                            'x-uid':
                                                                                                                              'pqbio7v3v18',
                                                                                                                            _isJSONSchemaObject:
                                                                                                                              true,
                                                                                                                            version:
                                                                                                                              '2.0',
                                                                                                                            type: 'void',
                                                                                                                            title:
                                                                                                                              'Edit button 2',
                                                                                                                            'x-action':
                                                                                                                              'update',
                                                                                                                            'x-designer':
                                                                                                                              'Action.Designer',
                                                                                                                            'x-component':
                                                                                                                              'Action',
                                                                                                                            'x-component-props':
                                                                                                                              {
                                                                                                                                openMode:
                                                                                                                                  'drawer',
                                                                                                                                icon: 'EditOutlined',
                                                                                                                                type: 'primary',
                                                                                                                                danger:
                                                                                                                                  false,
                                                                                                                              },
                                                                                                                            'x-decorator':
                                                                                                                              'ACLActionProvider',
                                                                                                                            'x-index': 1,
                                                                                                                            properties:
                                                                                                                              {
                                                                                                                                drawer:
                                                                                                                                  {
                                                                                                                                    _isJSONSchemaObject:
                                                                                                                                      true,
                                                                                                                                    version:
                                                                                                                                      '2.0',
                                                                                                                                    type: 'void',
                                                                                                                                    title:
                                                                                                                                      '{{ t("Edit record") }}',
                                                                                                                                    'x-component':
                                                                                                                                      'Action.Container',
                                                                                                                                    'x-component-props':
                                                                                                                                      {
                                                                                                                                        className:
                                                                                                                                          'nb-action-popup',
                                                                                                                                      },
                                                                                                                                    'x-index': 1,
                                                                                                                                    properties:
                                                                                                                                      {
                                                                                                                                        tabs: {
                                                                                                                                          _isJSONSchemaObject:
                                                                                                                                            true,
                                                                                                                                          version:
                                                                                                                                            '2.0',
                                                                                                                                          type: 'void',
                                                                                                                                          'x-component':
                                                                                                                                            'Tabs',
                                                                                                                                          'x-component-props':
                                                                                                                                            {},
                                                                                                                                          'x-initializer':
                                                                                                                                            'TabPaneInitializers',
                                                                                                                                          'x-index': 1,
                                                                                                                                          properties:
                                                                                                                                            {
                                                                                                                                              tab1: {
                                                                                                                                                _isJSONSchemaObject:
                                                                                                                                                  true,
                                                                                                                                                version:
                                                                                                                                                  '2.0',
                                                                                                                                                type: 'void',
                                                                                                                                                title:
                                                                                                                                                  '{{t("Edit")}}',
                                                                                                                                                'x-component':
                                                                                                                                                  'Tabs.TabPane',
                                                                                                                                                'x-designer':
                                                                                                                                                  'Tabs.Designer',
                                                                                                                                                'x-component-props':
                                                                                                                                                  {},
                                                                                                                                                'x-index': 1,
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
                                                                                                                                                      'x-index': 1,
                                                                                                                                                      properties:
                                                                                                                                                        {
                                                                                                                                                          '4xh2eecmles':
                                                                                                                                                            {
                                                                                                                                                              _isJSONSchemaObject:
                                                                                                                                                                true,
                                                                                                                                                              version:
                                                                                                                                                                '2.0',
                                                                                                                                                              type: 'void',
                                                                                                                                                              'x-component':
                                                                                                                                                                'Grid.Row',
                                                                                                                                                              'x-index': 1,
                                                                                                                                                              properties:
                                                                                                                                                                {
                                                                                                                                                                  '0lk0jurc203':
                                                                                                                                                                    {
                                                                                                                                                                      _isJSONSchemaObject:
                                                                                                                                                                        true,
                                                                                                                                                                      version:
                                                                                                                                                                        '2.0',
                                                                                                                                                                      type: 'void',
                                                                                                                                                                      'x-component':
                                                                                                                                                                        'Grid.Col',
                                                                                                                                                                      'x-index': 1,
                                                                                                                                                                      properties:
                                                                                                                                                                        {
                                                                                                                                                                          qxyhsdqsjnk:
                                                                                                                                                                            {
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
                                                                                                                                                                                'general.m2oField0:update',
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
                                                                                                                                                                                    'general.m2oField0',
                                                                                                                                                                                  collection:
                                                                                                                                                                                    'm2oField1',
                                                                                                                                                                                  association:
                                                                                                                                                                                    'general.m2oField0',
                                                                                                                                                                                },
                                                                                                                                                                              'x-designer':
                                                                                                                                                                                'FormV2.Designer',
                                                                                                                                                                              'x-component':
                                                                                                                                                                                'CardItem',
                                                                                                                                                                              'x-component-props':
                                                                                                                                                                                {},
                                                                                                                                                                              'x-index': 1,
                                                                                                                                                                              properties:
                                                                                                                                                                                {
                                                                                                                                                                                  tzajxyqd9k3:
                                                                                                                                                                                    {
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
                                                                                                                                                                                      'x-index': 1,
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
                                                                                                                                                                                            'x-index': 1,
                                                                                                                                                                                            properties:
                                                                                                                                                                                              {
                                                                                                                                                                                                '1nzk8lmeo35':
                                                                                                                                                                                                  {
                                                                                                                                                                                                    _isJSONSchemaObject:
                                                                                                                                                                                                      true,
                                                                                                                                                                                                    version:
                                                                                                                                                                                                      '2.0',
                                                                                                                                                                                                    type: 'void',
                                                                                                                                                                                                    'x-component':
                                                                                                                                                                                                      'Grid.Row',
                                                                                                                                                                                                    'x-index': 1,
                                                                                                                                                                                                    properties:
                                                                                                                                                                                                      {
                                                                                                                                                                                                        '0od1vb7dltp':
                                                                                                                                                                                                          {
                                                                                                                                                                                                            _isJSONSchemaObject:
                                                                                                                                                                                                              true,
                                                                                                                                                                                                            version:
                                                                                                                                                                                                              '2.0',
                                                                                                                                                                                                            type: 'void',
                                                                                                                                                                                                            'x-component':
                                                                                                                                                                                                              'Grid.Col',
                                                                                                                                                                                                            'x-index': 1,
                                                                                                                                                                                                            properties:
                                                                                                                                                                                                              {
                                                                                                                                                                                                                'm2oField1.m2oField2':
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
                                                                                                                                                                                                                        fieldNames:
                                                                                                                                                                                                                          {
                                                                                                                                                                                                                            label:
                                                                                                                                                                                                                              'id',
                                                                                                                                                                                                                            value:
                                                                                                                                                                                                                              'id',
                                                                                                                                                                                                                          },
                                                                                                                                                                                                                      },
                                                                                                                                                                                                                    'x-decorator':
                                                                                                                                                                                                                      'FormItem',
                                                                                                                                                                                                                    'x-collection-field':
                                                                                                                                                                                                                      'm2oField1.m2oField1.m2oField2',
                                                                                                                                                                                                                    'x-index': 1,
                                                                                                                                                                                                                    'x-uid':
                                                                                                                                                                                                                      'n3hj825kfud',
                                                                                                                                                                                                                    'x-async':
                                                                                                                                                                                                                      false,
                                                                                                                                                                                                                  },
                                                                                                                                                                                                              },
                                                                                                                                                                                                            'x-uid':
                                                                                                                                                                                                              '0kh8ua794y5',
                                                                                                                                                                                                            'x-async':
                                                                                                                                                                                                              false,
                                                                                                                                                                                                          },
                                                                                                                                                                                                      },
                                                                                                                                                                                                    'x-uid':
                                                                                                                                                                                                      'op5kvbrfosf',
                                                                                                                                                                                                    'x-async':
                                                                                                                                                                                                      false,
                                                                                                                                                                                                  },
                                                                                                                                                                                              },
                                                                                                                                                                                            'x-uid':
                                                                                                                                                                                              '3qpo7t4qeu1',
                                                                                                                                                                                            'x-async':
                                                                                                                                                                                              false,
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
                                                                                                                                                                                              'x-index': 2,
                                                                                                                                                                                              properties:
                                                                                                                                                                                                {
                                                                                                                                                                                                  el9dzf2keqq:
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
                                                                                                                                                                                                      'x-designer':
                                                                                                                                                                                                        'Action.Designer',
                                                                                                                                                                                                      'x-component-props':
                                                                                                                                                                                                        {
                                                                                                                                                                                                          type: 'primary',
                                                                                                                                                                                                          htmlType:
                                                                                                                                                                                                            'submit',
                                                                                                                                                                                                          useProps:
                                                                                                                                                                                                            '{{ useUpdateActionProps }}',
                                                                                                                                                                                                        },
                                                                                                                                                                                                      'x-action-settings':
                                                                                                                                                                                                        {
                                                                                                                                                                                                          triggerWorkflows:
                                                                                                                                                                                                            [],
                                                                                                                                                                                                        },
                                                                                                                                                                                                      type: 'void',
                                                                                                                                                                                                      'x-index': 1,
                                                                                                                                                                                                      'x-uid':
                                                                                                                                                                                                        'gptcyd5atoh',
                                                                                                                                                                                                      'x-async':
                                                                                                                                                                                                        false,
                                                                                                                                                                                                    },
                                                                                                                                                                                                },
                                                                                                                                                                                              'x-uid':
                                                                                                                                                                                                'glo1qwk9c3h',
                                                                                                                                                                                              'x-async':
                                                                                                                                                                                                false,
                                                                                                                                                                                            },
                                                                                                                                                                                        },
                                                                                                                                                                                      'x-uid':
                                                                                                                                                                                        '97l65a4xla1',
                                                                                                                                                                                      'x-async':
                                                                                                                                                                                        false,
                                                                                                                                                                                    },
                                                                                                                                                                                },
                                                                                                                                                                              'x-uid':
                                                                                                                                                                                'vaa7w1uq7hz',
                                                                                                                                                                              'x-async':
                                                                                                                                                                                false,
                                                                                                                                                                            },
                                                                                                                                                                        },
                                                                                                                                                                      'x-uid':
                                                                                                                                                                        'o8ill8n44c1',
                                                                                                                                                                      'x-async':
                                                                                                                                                                        false,
                                                                                                                                                                    },
                                                                                                                                                                },
                                                                                                                                                              'x-uid':
                                                                                                                                                                '3eyyh9i881u',
                                                                                                                                                              'x-async':
                                                                                                                                                                false,
                                                                                                                                                            },
                                                                                                                                                        },
                                                                                                                                                      'x-uid':
                                                                                                                                                        'afrbgindhtc',
                                                                                                                                                      'x-async':
                                                                                                                                                        false,
                                                                                                                                                    },
                                                                                                                                                  },
                                                                                                                                                'x-uid':
                                                                                                                                                  'q45xug6fmaa',
                                                                                                                                                'x-async':
                                                                                                                                                  false,
                                                                                                                                              },
                                                                                                                                            },
                                                                                                                                          'x-uid':
                                                                                                                                            'nv8ngiz2t9g',
                                                                                                                                          'x-async':
                                                                                                                                            false,
                                                                                                                                        },
                                                                                                                                      },
                                                                                                                                    'x-uid':
                                                                                                                                      'yn1oabiw8em',
                                                                                                                                    'x-async':
                                                                                                                                      false,
                                                                                                                                  },
                                                                                                                              },
                                                                                                                            'x-async':
                                                                                                                              false,
                                                                                                                          },
                                                                                                                      },
                                                                                                                    'x-uid':
                                                                                                                      'ag9hkuuvbf8',
                                                                                                                    'x-async':
                                                                                                                      false,
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
                                                                                                                  'x-index': 2,
                                                                                                                  'x-uid':
                                                                                                                    '1et421zrsz4',
                                                                                                                  'x-async':
                                                                                                                    false,
                                                                                                                },
                                                                                                              },
                                                                                                            'x-uid':
                                                                                                              'dd6b494mglm',
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                          },
                                                                                                        },
                                                                                                        'x-uid':
                                                                                                          'ojkwzn3j25x',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      '5grm3qde69i',
                                                                                                    'x-async': false,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'rnupfsm63cb',
                                                                                                'x-async': false,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'smqvz3oe3vp',
                                                                                            'x-async': false,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': 'kl0gn5nq2iu',
                                                                                        'x-async': false,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': 'nzvi02ku0k1',
                                                                                    'x-async': false,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'omhkk05odd6',
                                                                                'x-async': false,
                                                                              },
                                                                            },
                                                                            'x-async': false,
                                                                          },
                                                                        },
                                                                        'x-uid': 'mcb1580si22',
                                                                        'x-async': false,
                                                                      },
                                                                      grid: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid',
                                                                        'x-initializer': 'details:configureFields',
                                                                        'x-index': 2,
                                                                        'x-uid': 'j4qxeoy1pqw',
                                                                        'x-async': false,
                                                                      },
                                                                    },
                                                                    'x-uid': 'rgw0521c0xr',
                                                                    'x-async': false,
                                                                  },
                                                                },
                                                                'x-uid': '5bjtdjcbleg',
                                                                'x-async': false,
                                                              },
                                                            },
                                                            'x-uid': '83x4w7ehrui',
                                                            'x-async': false,
                                                          },
                                                        },
                                                        'x-uid': '4ygad3n73lw',
                                                        'x-async': false,
                                                      },
                                                    },
                                                    'x-uid': 'mqn8nmqjgbb',
                                                    'x-async': false,
                                                  },
                                                },
                                                'x-uid': 'xv9bmd99krn',
                                                'x-async': false,
                                              },
                                            },
                                            'x-uid': '08zjxet5wpu',
                                            'x-async': false,
                                          },
                                        },
                                        'x-uid': 'aifb3prikr7',
                                        'x-async': false,
                                      },
                                    },
                                    'x-uid': 'q8r8hehgfu2',
                                    'x-async': false,
                                  },
                                },
                                'x-uid': 'gqb8kqcuxdz',
                                'x-async': false,
                              },
                            },
                            'x-uid': 'vgh59kjigrk',
                            'x-async': false,
                          },
                        },
                        'x-uid': 'aa4ttpf4a6q',
                        'x-async': false,
                      },
                    },
                    'x-uid': '33rp8vvjrs4',
                    'x-async': false,
                  },
                },
                'x-uid': 'c0w4ickkdgn',
                'x-async': false,
              },
            },
            'x-uid': 'yf8csupk88d',
            'x-async': false,
          },
        },
        'x-uid': 'vscfbf4v4tr',
        'x-async': false,
      },
    },
    'x-uid': 'nnrjne1lxzr',
    'x-async': true,
  },
};

export const tableWithRoles: PageConfig = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      kuzmtxw0lbq: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          '9snoybve3hf': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              uzodd1sblh8: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  t77ozlyo0r4: {
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
                        'x-uid': 'w07zcu825vu',
                        'x-async': false,
                        'x-index': 1,
                      },
                      i8s4er3z53z: {
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
                              cgxhx0pycze: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                properties: {
                                  l6zuv8kq3lz: {
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
                                                    'x-uid': '2ty04bmiunh',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'ymqk4t82osd',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'tpv088lk09n',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'n1mmv9b43s7',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'qh62598r5nz',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'ovtpdelg5lo',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '0ck7uj73zdh',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': '52a31apruw6',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': '8n1731cywxw',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'ua6aed1x4ba',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'kplmcq59pey',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'v0qbl3nyzyo',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'nn6bi7v7ae0',
    'x-async': true,
    'x-index': 1,
  },
};

export const tableWithUsers = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      kuzmtxw0lbq: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          au5iakeqo5e: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              '2p9r34ylza3': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  i0ywe80o2k0: {
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
                        'x-uid': 'e7ukdkylglc',
                        'x-async': false,
                        'x-index': 1,
                      },
                      lbh0sin622q: {
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
                              mp82chprh15: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                properties: {
                                  '68vzmm4j2v7': {
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
                                                    'x-uid': 'v8mceafhtt9',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'xgev5isxh8c',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'zxhc26ocbwt',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': '8y380jnrc91',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'fvyqc3l0nlz',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 's9cdwte7qb5',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'e1e3l9aoqlz',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': '2eta2rrzfib',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'vqxmw6sp0dp',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '1hdhsgoac99',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'delawmtj0ku',
            'x-async': false,
            'x-index': 2,
          },
        },
        'x-uid': 'v0qbl3nyzyo',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'nn6bi7v7ae0',
    'x-async': true,
    'x-index': 1,
  },
};

export const tableWithInherit = {
  collections: [
    {
      name: 'targetCollection',
      fields: [
        {
          type: 'string',
          name: 'singleLineText',
          interface: 'input',
        },
      ],
    },
    {
      name: 'father',
      fields: [
        {
          type: 'string',
          name: 'singleLineText',
          interface: 'input',
        },
        {
          name: 'manyToMany',
          interface: 'm2m',
          target: 'targetCollection',
        },
      ],
    },
    {
      name: 'children',
      inherits: ['father'],
    },
  ],
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      egrrnisc7pq: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          bb1fa9y5wwh: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              m8lbibphksn: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  xj86s1jfwmk: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'father:list',
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'father',
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
                        'x-uid': '6j0p8tmwey7',
                        'x-async': false,
                        'x-index': 1,
                      },
                      pm3vc0ire0v: {
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
                              '6izaz7cwt1f': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                properties: {
                                  '9qgblzykl18': {
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
                                                    'x-uid': '9h1njletm7j',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'y9y0jzcb2pp',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': '4m51ixkzi6i',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'kt1n14v8q1u',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'tkod1lyrj9z',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'e84lmt2djp7',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '8pydvn47931',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'zyfhdizs6g3',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': '4r6xuptmtw8',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '0aqn6al8phn',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'em7wvio4zan',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'd0zbm0ezhp5',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'qdffo69m238',
    'x-async': true,
    'x-index': 1,
  },
};

export const tableWithInheritWithoutAssociation = {
  collections: [
    {
      name: 'father',
      fields: [
        {
          type: 'string',
          name: 'singleLineText',
          interface: 'input',
        },
      ],
    },
    {
      name: 'children',
      inherits: ['father'],
    },
  ],
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      egrrnisc7pq: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          bb1fa9y5wwh: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              m8lbibphksn: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  xj86s1jfwmk: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'father:list',
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'father',
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
                        'x-uid': '6j0p8tmwey7',
                        'x-async': false,
                        'x-index': 1,
                      },
                      pm3vc0ire0v: {
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
                              '6izaz7cwt1f': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                properties: {
                                  '9qgblzykl18': {
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
                                                    'x-uid': '9h1njletm7j',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'y9y0jzcb2pp',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': '4m51ixkzi6i',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'kt1n14v8q1u',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'tkod1lyrj9z',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'e84lmt2djp7',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '8pydvn47931',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'zyfhdizs6g3',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': '4r6xuptmtw8',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '0aqn6al8phn',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'em7wvio4zan',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'd0zbm0ezhp5',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'qdffo69m238',
    'x-async': true,
    'x-index': 1,
  },
};
export const shouldBackAfterClickBackButton = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      '97tan6tabn7': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          wbt3g94yem8: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.2.11-alpha',
            properties: {
              kcv4ztopi4o: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.2.11-alpha',
                properties: {
                  qu4gkg1uo94: {
                    'x-uid': '9f57o2qs72a',
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
                    'x-component-props': {
                      title: '单层子页面',
                    },
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
                        'x-uid': 'u32kya63iku',
                        'x-async': false,
                        'x-index': 1,
                      },
                      '9v7x23shm9a': {
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
                              '57e8dtkzg1i': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '1.2.11-alpha',
                                properties: {
                                  amr6reuai6k: {
                                    'x-uid': '3j7cousnr32',
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
                                                      nc214fzespi: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '1.2.11-alpha',
                                                        properties: {
                                                          '19t93b8tim0': {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '1.2.11-alpha',
                                                            properties: {
                                                              gp1oe83i3ao: {
                                                                'x-uid': '77yrnmca79i',
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-settings': 'blockSettings:markdown',
                                                                'x-decorator': 'CardItem',
                                                                'x-decorator-props': {
                                                                  name: 'markdown',
                                                                },
                                                                'x-component': 'Markdown.Void',
                                                                'x-editable': false,
                                                                'x-component-props': {
                                                                  content: 'Markdown：单层子页面中的内容。',
                                                                },
                                                                'x-app-version': '1.2.11-alpha',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': '4rm3gbaxrut',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'unggn8pmrub',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': '5ojmkdqmsc9',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': '9q58tm27c1w',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                              jvlulxc7loq: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                title: 'tab2',
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
                                                      '2gmgch1t5ci': {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '1.2.11-alpha',
                                                        properties: {
                                                          lsyrygdbkq6: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '1.2.11-alpha',
                                                            properties: {
                                                              ub3zswl0vf6: {
                                                                'x-uid': '077klvtotd2',
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-settings': 'blockSettings:markdown',
                                                                'x-decorator': 'CardItem',
                                                                'x-decorator-props': {
                                                                  name: 'markdown',
                                                                },
                                                                'x-component': 'Markdown.Void',
                                                                'x-editable': false,
                                                                'x-component-props': {
                                                                  content: 'Markdown：单层子页面中的内容，tab2。',
                                                                },
                                                                'x-app-version': '1.2.11-alpha',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'lsqk8vzygfd',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'favqgqca7fc',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'i0gqg16trgq',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': '3pat0jg4cu8',
                                                'x-async': false,
                                                'x-index': 2,
                                              },
                                            },
                                            'x-uid': '6e6mgze8p96',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'b8ipp00xlvq',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'wkn4sh95whn',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'dpgt61383u6',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': '3ze07ij98dz',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '23art3luykd',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'j19q8edcc0c',
            'x-async': false,
            'x-index': 1,
          },
          q2y197mfviz: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.2.11-alpha',
            properties: {
              p7p7mrq6ns3: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.2.11-alpha',
                properties: {
                  w6emv7nd3rg: {
                    'x-uid': '1r2mzjhoybh',
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
                    'x-component-props': {
                      title: '从弹窗中打开子页面',
                    },
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
                        'x-uid': '4ovn5e2e5ar',
                        'x-async': false,
                        'x-index': 1,
                      },
                      '277u5j5eoit': {
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
                              '3t5io89no75': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '1.2.11-alpha',
                                properties: {
                                  '8mxx5icnwgi': {
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
                                                      t0zpnpco6gw: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '1.2.11-alpha',
                                                        properties: {
                                                          '50qw14vli5j': {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '1.2.11-alpha',
                                                            properties: {
                                                              vlk2m57k8ij: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-decorator': 'TableBlockProvider',
                                                                'x-acl-action': 'users.roles:list',
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
                                                                    'x-uid': 'ic59hmjdpml',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                  u1mh5zpad2r: {
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
                                                                          x1fstixrwq5: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-decorator': 'DndContext',
                                                                            'x-component': 'Space',
                                                                            'x-component-props': {
                                                                              split: '|',
                                                                            },
                                                                            'x-app-version': '1.2.11-alpha',
                                                                            properties: {
                                                                              qz1x67f887t: {
                                                                                'x-uid': 'erooyv3qc22',
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
                                                                                  association: 'users.roles',
                                                                                  parentPopupRecord: {
                                                                                    collection: 'users',
                                                                                    filterByTk: 1,
                                                                                  },
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
                                                                                                properties: {
                                                                                                  '7ztzwrpq8qz': {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Row',
                                                                                                    'x-app-version':
                                                                                                      '1.2.11-alpha',
                                                                                                    properties: {
                                                                                                      nw14g9cyne8: {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'void',
                                                                                                        'x-component':
                                                                                                          'Grid.Col',
                                                                                                        'x-app-version':
                                                                                                          '1.2.11-alpha',
                                                                                                        properties: {
                                                                                                          wrn8vg1jmwm: {
                                                                                                            'x-uid':
                                                                                                              'q6ofkksvfia',
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
                                                                                                              },
                                                                                                            'x-component':
                                                                                                              'Markdown.Void',
                                                                                                            'x-editable':
                                                                                                              false,
                                                                                                            'x-component-props':
                                                                                                              {
                                                                                                                content:
                                                                                                                  'Markdown：从弹窗中打开的子页面。',
                                                                                                              },
                                                                                                            'x-app-version':
                                                                                                              '1.2.11-alpha',
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                            'x-index': 1,
                                                                                                          },
                                                                                                        },
                                                                                                        'x-uid':
                                                                                                          '6m2whcotbwx',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      '4dncnhexual',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'wkfge43voz4',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'sdma5uvvock',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                          t381gswc4u8: {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            title: 'tab2',
                                                                                            'x-component':
                                                                                              'Tabs.TabPane',
                                                                                            'x-designer':
                                                                                              'Tabs.Designer',
                                                                                            'x-component-props': {},
                                                                                            'x-app-version':
                                                                                              '1.2.11-alpha',
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
                                                                                                  '1.2.11-alpha',
                                                                                                properties: {
                                                                                                  ugeyrpa1ub8: {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Row',
                                                                                                    'x-app-version':
                                                                                                      '1.2.11-alpha',
                                                                                                    properties: {
                                                                                                      '3m1o1ludxia': {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'void',
                                                                                                        'x-component':
                                                                                                          'Grid.Col',
                                                                                                        'x-app-version':
                                                                                                          '1.2.11-alpha',
                                                                                                        properties: {
                                                                                                          ftl0a45psk3: {
                                                                                                            'x-uid':
                                                                                                              'ks0w60u7gzv',
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
                                                                                                              },
                                                                                                            'x-component':
                                                                                                              'Markdown.Void',
                                                                                                            'x-editable':
                                                                                                              false,
                                                                                                            'x-component-props':
                                                                                                              {
                                                                                                                content:
                                                                                                                  'Markdown：从弹窗中打开的子页面，tab2。',
                                                                                                              },
                                                                                                            'x-app-version':
                                                                                                              '1.2.11-alpha',
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                            'x-index': 1,
                                                                                                          },
                                                                                                        },
                                                                                                        'x-uid':
                                                                                                          'xdis626c2g4',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      '91oc53uvjps',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'ht9wqas1i7z',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'fl51npqziof',
                                                                                            'x-async': false,
                                                                                            'x-index': 2,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': '8b7moh7ojdl',
                                                                                        'x-async': false,
                                                                                        'x-index': 1,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': 'm3746x2hq72',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'epmmdtclegd',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 't7x3572wm7v',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                    },
                                                                    'x-uid': 'r63yrogrn07',
                                                                    'x-async': false,
                                                                    'x-index': 2,
                                                                  },
                                                                },
                                                                'x-uid': 'm5hmhkrauqn',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'wg5yy0o87l7',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'bide3fs0cwz',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': '7f4ii238ehy',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'uz92jjv8uuw',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': '9wz538jotyx',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'e229c8d149g',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'muydx3a8mm7',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'xw4q1p6ayv1',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'mctdour2oga',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'iy6psp8vv7e',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'uxamrt8zems',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'u0tyssykpqo',
            'x-async': false,
            'x-index': 2,
          },
          v15ya8a1m4l: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.2.11-alpha',
            properties: {
              '851olhhzgy6': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.2.11-alpha',
                properties: {
                  y2zy3qyqrjn: {
                    'x-uid': 'bpggay3uc8j',
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
                    'x-component-props': {
                      title: '从嵌套弹窗中打开子页面',
                    },
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
                        'x-uid': 'w59rjulfkl2',
                        'x-async': false,
                        'x-index': 1,
                      },
                      zsdnt9vawwi: {
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
                              bnehc6k1r1b: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '1.2.11-alpha',
                                properties: {
                                  qw6y1vjw3os: {
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
                                                      vi3594cpy8q: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '1.2.11-alpha',
                                                        properties: {
                                                          sutzvi8f3ik: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '1.2.11-alpha',
                                                            properties: {
                                                              ecx6vh89tc5: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-decorator': 'TableBlockProvider',
                                                                'x-acl-action': 'users.roles:list',
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
                                                                    'x-uid': 'l0btiid3qdg',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                  vw1aen1ekoa: {
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
                                                                          j5spqe7zhut: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-decorator': 'DndContext',
                                                                            'x-component': 'Space',
                                                                            'x-component-props': {
                                                                              split: '|',
                                                                            },
                                                                            'x-app-version': '1.2.11-alpha',
                                                                            properties: {
                                                                              up4lxze9sld: {
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
                                                                                  association: 'users.roles',
                                                                                  parentPopupRecord: {
                                                                                    collection: 'users',
                                                                                    filterByTk: 1,
                                                                                  },
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
                                                                                                properties: {
                                                                                                  xpc333w57zk: {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Row',
                                                                                                    'x-app-version':
                                                                                                      '1.2.11-alpha',
                                                                                                    properties: {
                                                                                                      tj9si7puaph: {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'void',
                                                                                                        'x-component':
                                                                                                          'Grid.Col',
                                                                                                        'x-app-version':
                                                                                                          '1.2.11-alpha',
                                                                                                        properties: {
                                                                                                          i3ttwm7rz98: {
                                                                                                            _isJSONSchemaObject:
                                                                                                              true,
                                                                                                            version:
                                                                                                              '2.0',
                                                                                                            type: 'void',
                                                                                                            'x-acl-action':
                                                                                                              'users.roles:get',
                                                                                                            'x-decorator':
                                                                                                              'DetailsBlockProvider',
                                                                                                            'x-use-decorator-props':
                                                                                                              'useDetailsDecoratorProps',
                                                                                                            'x-decorator-props':
                                                                                                              {
                                                                                                                dataSource:
                                                                                                                  'main',
                                                                                                                association:
                                                                                                                  'users.roles',
                                                                                                                readPretty:
                                                                                                                  true,
                                                                                                                action:
                                                                                                                  'get',
                                                                                                              },
                                                                                                            'x-toolbar':
                                                                                                              'BlockSchemaToolbar',
                                                                                                            'x-settings':
                                                                                                              'blockSettings:details',
                                                                                                            'x-component':
                                                                                                              'CardItem',
                                                                                                            'x-is-current':
                                                                                                              true,
                                                                                                            'x-app-version':
                                                                                                              '1.2.11-alpha',
                                                                                                            properties:
                                                                                                              {
                                                                                                                i20wik3jvnr:
                                                                                                                  {
                                                                                                                    _isJSONSchemaObject:
                                                                                                                      true,
                                                                                                                    version:
                                                                                                                      '2.0',
                                                                                                                    type: 'void',
                                                                                                                    'x-component':
                                                                                                                      'Details',
                                                                                                                    'x-read-pretty':
                                                                                                                      true,
                                                                                                                    'x-use-component-props':
                                                                                                                      'useDetailsProps',
                                                                                                                    'x-app-version':
                                                                                                                      '1.2.11-alpha',
                                                                                                                    properties:
                                                                                                                      {
                                                                                                                        gf414um0rqy:
                                                                                                                          {
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
                                                                                                                                style:
                                                                                                                                  {
                                                                                                                                    marginBottom: 24,
                                                                                                                                  },
                                                                                                                              },
                                                                                                                            'x-app-version':
                                                                                                                              '1.2.11-alpha',
                                                                                                                            properties:
                                                                                                                              {
                                                                                                                                j8vo5nfc4nm:
                                                                                                                                  {
                                                                                                                                    'x-uid':
                                                                                                                                      '1ct9qd9jlbm',
                                                                                                                                    _isJSONSchemaObject:
                                                                                                                                      true,
                                                                                                                                    version:
                                                                                                                                      '2.0',
                                                                                                                                    type: 'void',
                                                                                                                                    title:
                                                                                                                                      '{{ t("Edit") }}',
                                                                                                                                    'x-action':
                                                                                                                                      'update',
                                                                                                                                    'x-toolbar':
                                                                                                                                      'ActionSchemaToolbar',
                                                                                                                                    'x-settings':
                                                                                                                                      'actionSettings:edit',
                                                                                                                                    'x-component':
                                                                                                                                      'Action',
                                                                                                                                    'x-component-props':
                                                                                                                                      {
                                                                                                                                        openMode:
                                                                                                                                          'page',
                                                                                                                                        icon: 'EditOutlined',
                                                                                                                                        type: 'primary',
                                                                                                                                      },
                                                                                                                                    'x-action-context':
                                                                                                                                      {
                                                                                                                                        dataSource:
                                                                                                                                          'main',
                                                                                                                                        association:
                                                                                                                                          'users.roles',
                                                                                                                                        parentPopupRecord:
                                                                                                                                          {
                                                                                                                                            collection:
                                                                                                                                              'roles',
                                                                                                                                            filterByTk:
                                                                                                                                              'admin',
                                                                                                                                          },
                                                                                                                                      },
                                                                                                                                    'x-decorator':
                                                                                                                                      'ACLActionProvider',
                                                                                                                                    'x-app-version':
                                                                                                                                      '1.2.11-alpha',
                                                                                                                                    properties:
                                                                                                                                      {
                                                                                                                                        drawer:
                                                                                                                                          {
                                                                                                                                            _isJSONSchemaObject:
                                                                                                                                              true,
                                                                                                                                            version:
                                                                                                                                              '2.0',
                                                                                                                                            type: 'void',
                                                                                                                                            title:
                                                                                                                                              '{{ t("Edit record") }}',
                                                                                                                                            'x-component':
                                                                                                                                              'Action.Container',
                                                                                                                                            'x-component-props':
                                                                                                                                              {
                                                                                                                                                className:
                                                                                                                                                  'nb-action-popup',
                                                                                                                                              },
                                                                                                                                            'x-app-version':
                                                                                                                                              '1.2.11-alpha',
                                                                                                                                            properties:
                                                                                                                                              {
                                                                                                                                                tabs: {
                                                                                                                                                  _isJSONSchemaObject:
                                                                                                                                                    true,
                                                                                                                                                  version:
                                                                                                                                                    '2.0',
                                                                                                                                                  type: 'void',
                                                                                                                                                  'x-component':
                                                                                                                                                    'Tabs',
                                                                                                                                                  'x-component-props':
                                                                                                                                                    {},
                                                                                                                                                  'x-initializer':
                                                                                                                                                    'popup:addTab',
                                                                                                                                                  'x-app-version':
                                                                                                                                                    '1.2.11-alpha',
                                                                                                                                                  properties:
                                                                                                                                                    {
                                                                                                                                                      tab1: {
                                                                                                                                                        _isJSONSchemaObject:
                                                                                                                                                          true,
                                                                                                                                                        version:
                                                                                                                                                          '2.0',
                                                                                                                                                        type: 'void',
                                                                                                                                                        title:
                                                                                                                                                          '{{t("Edit")}}',
                                                                                                                                                        'x-component':
                                                                                                                                                          'Tabs.TabPane',
                                                                                                                                                        'x-designer':
                                                                                                                                                          'Tabs.Designer',
                                                                                                                                                        'x-component-props':
                                                                                                                                                          {},
                                                                                                                                                        'x-app-version':
                                                                                                                                                          '1.2.11-alpha',
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
                                                                                                                                                              'x-app-version':
                                                                                                                                                                '1.2.11-alpha',
                                                                                                                                                              properties:
                                                                                                                                                                {
                                                                                                                                                                  zkslw04ebta:
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
                                                                                                                                                                          opndt1e9gld:
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
                                                                                                                                                                                  hmc0k54aff7:
                                                                                                                                                                                    {
                                                                                                                                                                                      'x-uid':
                                                                                                                                                                                        '4pb507f2ogv',
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
                                                                                                                                                                                        },
                                                                                                                                                                                      'x-component':
                                                                                                                                                                                        'Markdown.Void',
                                                                                                                                                                                      'x-editable':
                                                                                                                                                                                        false,
                                                                                                                                                                                      'x-component-props':
                                                                                                                                                                                        {
                                                                                                                                                                                          content:
                                                                                                                                                                                            'Markdown：从嵌套弹窗中打开的子页面。',
                                                                                                                                                                                        },
                                                                                                                                                                                      'x-app-version':
                                                                                                                                                                                        '1.2.11-alpha',
                                                                                                                                                                                      'x-async':
                                                                                                                                                                                        false,
                                                                                                                                                                                      'x-index': 1,
                                                                                                                                                                                    },
                                                                                                                                                                                },
                                                                                                                                                                              'x-uid':
                                                                                                                                                                                '9pyvixeo4p8',
                                                                                                                                                                              'x-async':
                                                                                                                                                                                false,
                                                                                                                                                                              'x-index': 1,
                                                                                                                                                                            },
                                                                                                                                                                        },
                                                                                                                                                                      'x-uid':
                                                                                                                                                                        'y3s06g3mmnn',
                                                                                                                                                                      'x-async':
                                                                                                                                                                        false,
                                                                                                                                                                      'x-index': 1,
                                                                                                                                                                    },
                                                                                                                                                                },
                                                                                                                                                              'x-uid':
                                                                                                                                                                'so5nyswl2tn',
                                                                                                                                                              'x-async':
                                                                                                                                                                false,
                                                                                                                                                              'x-index': 1,
                                                                                                                                                            },
                                                                                                                                                          },
                                                                                                                                                        'x-uid':
                                                                                                                                                          '0a6z4stdtvv',
                                                                                                                                                        'x-async':
                                                                                                                                                          false,
                                                                                                                                                        'x-index': 1,
                                                                                                                                                      },
                                                                                                                                                    },
                                                                                                                                                  'x-uid':
                                                                                                                                                    '7l9zhdzmvrl',
                                                                                                                                                  'x-async':
                                                                                                                                                    false,
                                                                                                                                                  'x-index': 1,
                                                                                                                                                },
                                                                                                                                              },
                                                                                                                                            'x-uid':
                                                                                                                                              '2x6fwtfvkks',
                                                                                                                                            'x-async':
                                                                                                                                              false,
                                                                                                                                            'x-index': 1,
                                                                                                                                          },
                                                                                                                                      },
                                                                                                                                    'x-async':
                                                                                                                                      false,
                                                                                                                                    'x-index': 1,
                                                                                                                                  },
                                                                                                                              },
                                                                                                                            'x-uid':
                                                                                                                              '6olkx9unnri',
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
                                                                                                                            '1.2.11-alpha',
                                                                                                                          'x-uid':
                                                                                                                            'gu80n1txnro',
                                                                                                                          'x-async':
                                                                                                                            false,
                                                                                                                          'x-index': 2,
                                                                                                                        },
                                                                                                                      },
                                                                                                                    'x-uid':
                                                                                                                      '1by5v8iv34w',
                                                                                                                    'x-async':
                                                                                                                      false,
                                                                                                                    'x-index': 1,
                                                                                                                  },
                                                                                                              },
                                                                                                            'x-uid':
                                                                                                              'cztt3y1bgor',
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                            'x-index': 1,
                                                                                                          },
                                                                                                        },
                                                                                                        'x-uid':
                                                                                                          'cwjnmpashsw',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'xd3jxvuh0uu',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'yuh9ln1beb7',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'skn2rg6i69w',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': 'd86n6uwh3bp',
                                                                                        'x-async': false,
                                                                                        'x-index': 1,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': 'v1qjjrpax1d',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'bd3nizznkdw',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 's4vogdgtvee',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'ftldvta11u5',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                    },
                                                                    'x-uid': '5sd13kmn5by',
                                                                    'x-async': false,
                                                                    'x-index': 2,
                                                                  },
                                                                },
                                                                'x-uid': 'kl6jgkap0hm',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': '3ee607ult3r',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'woxi5swq3eg',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': '1q2x6q2ppbp',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': '9wo00ltfxrx',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'vrmltv7ft3h',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'cpxmv3sg94v',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': '56tsj7l3k35',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'm6aspnitoun',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '1i77bx9kgzq',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': '0cwavsh3a2p',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'jo81qbmu5vz',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': '2x8h80y9qar',
            'x-async': false,
            'x-index': 3,
          },
          yp0g3u675ag: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.2.11-alpha',
            properties: {
              x2w02rf3w75: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.2.11-alpha',
                properties: {
                  jt9x9694vkt: {
                    'x-uid': '2i5820tc8a7',
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
                    'x-component-props': {
                      title: '嵌套的子页面',
                    },
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
                        'x-uid': 'bmoyp6ssad8',
                        'x-async': false,
                        'x-index': 1,
                      },
                      tnyim2afz64: {
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
                              c7tvdhrf7bc: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '1.2.11-alpha',
                                properties: {
                                  yaxmxps0sco: {
                                    'x-uid': '0odbntoklq4',
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
                                                      ayd0gasuunq: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '1.2.11-alpha',
                                                        properties: {
                                                          '1qtokxl5tqi': {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '1.2.11-alpha',
                                                            properties: {
                                                              '7a9fjrtmdig': {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-decorator': 'TableBlockProvider',
                                                                'x-acl-action': 'users.roles:list',
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
                                                                    'x-uid': 'sow53nemamo',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                  '4svbyier3po': {
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
                                                                          '4ee6xcmbza3': {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-decorator': 'DndContext',
                                                                            'x-component': 'Space',
                                                                            'x-component-props': {
                                                                              split: '|',
                                                                            },
                                                                            'x-app-version': '1.2.11-alpha',
                                                                            properties: {
                                                                              '3qj941c0o77': {
                                                                                'x-uid': '7bwrckgb2qz',
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
                                                                                  association: 'users.roles',
                                                                                  parentPopupRecord: {
                                                                                    collection: 'users',
                                                                                    filterByTk: 1,
                                                                                  },
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
                                                                                                properties: {
                                                                                                  '75bgz4587a8': {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Row',
                                                                                                    'x-app-version':
                                                                                                      '1.2.11-alpha',
                                                                                                    properties: {
                                                                                                      z390g7i8lvq: {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'void',
                                                                                                        'x-component':
                                                                                                          'Grid.Col',
                                                                                                        'x-app-version':
                                                                                                          '1.2.11-alpha',
                                                                                                        properties: {
                                                                                                          ca9pyg76qga: {
                                                                                                            'x-uid':
                                                                                                              'id81yz2cpip',
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
                                                                                                              },
                                                                                                            'x-component':
                                                                                                              'Markdown.Void',
                                                                                                            'x-editable':
                                                                                                              false,
                                                                                                            'x-component-props':
                                                                                                              {
                                                                                                                content:
                                                                                                                  'Markdown：嵌套的子页面，第二层级。',
                                                                                                              },
                                                                                                            'x-app-version':
                                                                                                              '1.2.11-alpha',
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                            'x-index': 1,
                                                                                                          },
                                                                                                        },
                                                                                                        'x-uid':
                                                                                                          'jjooza0r1bc',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      '1rn0yytm14k',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'n1fnwuisud4',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'ytffyqb66bz',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                          zlrkv0rum6m: {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            title: 'tab2',
                                                                                            'x-component':
                                                                                              'Tabs.TabPane',
                                                                                            'x-designer':
                                                                                              'Tabs.Designer',
                                                                                            'x-component-props': {},
                                                                                            'x-app-version':
                                                                                              '1.2.11-alpha',
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
                                                                                                  '1.2.11-alpha',
                                                                                                properties: {
                                                                                                  '9lof63mhvmr': {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Row',
                                                                                                    'x-app-version':
                                                                                                      '1.2.11-alpha',
                                                                                                    properties: {
                                                                                                      ynn98kqolac: {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'void',
                                                                                                        'x-component':
                                                                                                          'Grid.Col',
                                                                                                        'x-app-version':
                                                                                                          '1.2.11-alpha',
                                                                                                        properties: {
                                                                                                          ym6o0oia28x: {
                                                                                                            'x-uid':
                                                                                                              '4vz5669r4s7',
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
                                                                                                              },
                                                                                                            'x-component':
                                                                                                              'Markdown.Void',
                                                                                                            'x-editable':
                                                                                                              false,
                                                                                                            'x-component-props':
                                                                                                              {
                                                                                                                content:
                                                                                                                  'Markdown：嵌套的子页面，第二层级，tab2。',
                                                                                                              },
                                                                                                            'x-app-version':
                                                                                                              '1.2.11-alpha',
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                            'x-index': 1,
                                                                                                          },
                                                                                                        },
                                                                                                        'x-uid':
                                                                                                          'b64fox1t5dq',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'zkqdci9nwo5',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': 'p6k33ab0jkk',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'xiwqovztp2l',
                                                                                            'x-async': false,
                                                                                            'x-index': 2,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': 'n25bezli26e',
                                                                                        'x-async': false,
                                                                                        'x-index': 1,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': 'p76ypirrotc',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'qjcsvvoqgio',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'o991l8oye7a',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                    },
                                                                    'x-uid': 'j6ucd06ivu2',
                                                                    'x-async': false,
                                                                    'x-index': 2,
                                                                  },
                                                                },
                                                                'x-uid': '3b8k5fi5j2k',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'k0if0x4hzl1',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': '72zx0xrvyh4',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': '7yyn3mkcn2z',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'fht4tt8jvvv',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'ik49cgssro5',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': '8z3b7fdh3ye',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'fnggqaqjyi4',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'htsvweltqpq',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'j8oje6djfsf',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '94hcvhpfi9y',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'r863ebmphg7',
            'x-async': false,
            'x-index': 4,
          },
        },
        'x-uid': '6udxejou23t',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'euvn3lv0jkz',
    'x-async': true,
    'x-index': 1,
  },
};
export const zIndexOfSubpage = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      '54q3u7i1u4k': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          '3gn9anq7t4e': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.3.25-beta',
            properties: {
              '0gxjlcll8gp': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.3.25-beta',
                properties: {
                  '7i3uif7wk62': {
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
                        'x-uid': 'afsi4hnbyuj',
                        'x-async': false,
                        'x-index': 1,
                      },
                      zpgpevopc1c: {
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
                              '8u7j0st5wgs': {
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
                                  s2vaxfg91i2: {
                                    'x-uid': 'qh2sc6ljtem',
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: 'open subpage level1',
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
                                                      '4qymqz8hwn4': {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '1.3.25-beta',
                                                        properties: {
                                                          ihbvd00t4q6: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '1.3.25-beta',
                                                            properties: {
                                                              hxrps0ye253: {
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
                                                                'x-app-version': '1.3.25-beta',
                                                                properties: {
                                                                  ql4garzgr8x: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'FormV2',
                                                                    'x-use-component-props': 'useEditFormBlockProps',
                                                                    'x-app-version': '1.3.25-beta',
                                                                    properties: {
                                                                      grid: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid',
                                                                        'x-initializer': 'form:configureFields',
                                                                        'x-app-version': '1.3.25-beta',
                                                                        'x-uid': 'mabh2ibgait',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                      ajprlhs22up: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-initializer': 'editForm:configureActions',
                                                                        'x-component': 'ActionBar',
                                                                        'x-component-props': {
                                                                          layout: 'one-column',
                                                                        },
                                                                        'x-app-version': '1.3.25-beta',
                                                                        properties: {
                                                                          b9cne10fcgs: {
                                                                            'x-uid': 'xl8j6o0nh9y',
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
                                                                              schemaUid: '1bxeyl4dr8h',
                                                                            },
                                                                            type: 'void',
                                                                            'x-app-version': '1.3.25-beta',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                          tqyracw6eb6: {
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
                                                                            'x-action-context': {
                                                                              dataSource: 'main',
                                                                              collection: 'users',
                                                                            },
                                                                            'x-app-version': '1.3.25-beta',
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
                                                                                'x-app-version': '1.3.25-beta',
                                                                                properties: {
                                                                                  tabs: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'void',
                                                                                    'x-component': 'Tabs',
                                                                                    'x-component-props': {},
                                                                                    'x-initializer': 'popup:addTab',
                                                                                    'x-app-version': '1.3.25-beta',
                                                                                    properties: {
                                                                                      tab1: {
                                                                                        _isJSONSchemaObject: true,
                                                                                        version: '2.0',
                                                                                        type: 'void',
                                                                                        title: '{{t("Details")}}',
                                                                                        'x-component': 'Tabs.TabPane',
                                                                                        'x-designer': 'Tabs.Designer',
                                                                                        'x-component-props': {},
                                                                                        'x-app-version': '1.3.25-beta',
                                                                                        properties: {
                                                                                          grid: {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            'x-component': 'Grid',
                                                                                            'x-initializer':
                                                                                              'popup:common:addBlock',
                                                                                            'x-app-version':
                                                                                              '1.3.25-beta',
                                                                                            'x-uid': 'zwuqnls6u3c',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': '55kyuw5ttyx',
                                                                                        'x-async': false,
                                                                                        'x-index': 1,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': 'ky6g3f2n28w',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'vp4s1dwnd8z',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'jo22w4l8an4',
                                                                            'x-async': false,
                                                                            'x-index': 2,
                                                                          },
                                                                        },
                                                                        'x-uid': '84yctndy38l',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': 'g6b2c8f2ovk',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': 'l3o4h95xmdl',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'heydlbpp6my',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'bulxu6j236w',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': '72yx2p3t3la',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'uj053epotun',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'cehviykewuu',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'lnnbghowqab',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'nbvrk0k8yff',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'j5hb8ndh6ga',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'jkn0ynmjn3m',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'glwchpg5y33',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'fnefg28f6n0',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'ct8jzsn4eip',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': '8c4x82h3quo',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'iha0m2ozo2a',
    'x-async': true,
    'x-index': 1,
  },
};
export const zIndexEditProfile = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-app-version': '1.3.32-beta',
    properties: {
      '17v3l3wra1q': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-app-version': '1.3.32-beta',
        properties: {
          tpentznu41j: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.3.32-beta',
            properties: {
              '16wj734kw8c': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.3.32-beta',
                properties: {
                  gh2evps4nft: {
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
                        'x-uid': 'jlclfunyxlo',
                        'x-async': false,
                        'x-index': 1,
                      },
                      juqs9wupfcc: {
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
                              onge8etkwkq: {
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
                                  '44abnpgy9hl': {
                                    'x-uid': '2m4j1wrmt2k',
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
                                                    'x-uid': 'pncs8uoz02h',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'i1n4wf3wqt8',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': '537y7twqq1x',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'j652bs2ocx7',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'lmmfco4ti1k',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'qxsdgdxd7zd',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'rxecd82tr2t',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': '8mdf3toqg65',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'x2e6vc3l16a',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'eqlzylp6c53',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': '2e8trd4olie',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'ay7xv8zc868',
    'x-async': true,
    'x-index': 1,
  },
};
