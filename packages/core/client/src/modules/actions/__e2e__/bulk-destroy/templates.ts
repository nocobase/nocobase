/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const oneTableWithGeneral = {
  collections: [
    {
      name: 'general',
      fields: [
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
      '8ss8o5y9v1n': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          csfo7xx40b3: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '0.21.0-alpha.8',
            properties: {
              tt2a4eaj8lb: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '0.21.0-alpha.8',
                properties: {
                  '8x94ptxomlt': {
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
                    'x-app-version': '0.21.0-alpha.8',
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
                        'x-app-version': '0.21.0-alpha.8',
                        'x-uid': 'hdwhv0s3ld8',
                        'x-async': false,
                        'x-index': 1,
                      },
                      cxp0n38cdzh: {
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
                        'x-app-version': '0.21.0-alpha.8',
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
                            'x-app-version': '0.21.0-alpha.8',
                            properties: {
                              gl66zpwpgkc: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '0.21.0-alpha.8',
                                'x-uid': 'zjbyke5x5zq',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'stly3z91277',
                            'x-async': false,
                            'x-index': 1,
                          },
                          dd7u5egw9ue: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '0.21.0-alpha.8',
                            properties: {
                              singleLineText: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'general.singleLineText',
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
                                'x-app-version': '0.21.0-alpha.8',
                                'x-uid': 'hun0avzussa',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '9buozxehglu',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'rirrh33p5m8',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'n3j1d0y1a9c',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'eo1qycp0ie2',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': '1xji5q6qrvd',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'cati70644yw',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': '8xohxs7zt2z',
    'x-async': true,
    'x-index': 1,
  },
};
