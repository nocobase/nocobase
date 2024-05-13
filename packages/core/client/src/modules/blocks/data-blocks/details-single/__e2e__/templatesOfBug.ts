/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PageConfig } from '@nocobase/test/e2e';

export const T3848: PageConfig = {
  collections: [
    {
      name: 'example',
      fields: [
        {
          name: 'manyToOne',
          interface: 'm2o',
          target: 'example',
        },
        {
          name: 'singleLineText',
          interface: 'input',
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
      nzmrteziofg: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          zzpze3c8oge: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              ndgxtl4rvu3: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  wvab22d93e8: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'example:list',
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'example',
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
                        'x-uid': '0clfl0oxnwf',
                        'x-async': false,
                        'x-index': 1,
                      },
                      gnd7uoea2zu: {
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
                              x59rltkm59a: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-uid': 'rggytn82ilc',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '3d6k1i1jx7v',
                            'x-async': false,
                            'x-index': 1,
                          },
                          uvhs4tg6nwm: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            properties: {
                              manyToOne: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'example.manyToOne',
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
                                properties: {
                                  pt0gyfcniz8: {
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
                                                'x-uid': 'g9v1ckltvex',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'pz1l8oq2ya7',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': '58x2e3ugg1q',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'bdpjlroyuum',
                                    'x-async': false,
                                  },
                                },
                                'x-uid': 'ly8hdsl4jjo',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'yu5bgkjqhu8',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'l3onkna9ido',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'ee81h3nx17g',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'l6h63fsseo7',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'zu4jp6j2avg',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'fd3cw6sti4y',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': '7c28d1jik0y',
    'x-async': true,
    'x-index': 1,
  },
};
