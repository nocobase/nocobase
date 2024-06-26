/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const oneTableWithTagField = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-app-version': '1.2.6-alpha',
    properties: {
      ehepu4b8vhj: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-app-version': '1.2.6-alpha',
        properties: {
          '2bp3civv10s': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.2.7-alpha',
            properties: {
              vjff2vsptqc: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.2.7-alpha',
                properties: {
                  '2owh8mmlcd4': {
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
                    'x-app-version': '1.2.7-alpha',
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
                        'x-app-version': '1.2.7-alpha',
                        'x-uid': 'yx6siv002kj',
                        'x-async': false,
                        'x-index': 1,
                      },
                      '7y3gwycqft3': {
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
                        'x-app-version': '1.2.7-alpha',
                        properties: {
                          pxvel5iqt9r: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '1.2.7-alpha',
                            properties: {
                              roles: {
                                'x-uid': 'arp9uhm0j5b',
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'users.roles',
                                'x-component': 'CollectionField',
                                'x-component-props': {
                                  fieldNames: {
                                    value: 'name',
                                    label: 'name',
                                  },
                                  ellipsis: true,
                                  size: 'small',
                                  mode: 'Tag',
                                },
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-app-version': '1.2.7-alpha',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'x10noetaee4',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 't0n4y84iydh',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'cw7f6gjdjod',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '76kou4i9271',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': '9a5727xiro3',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'ydqe17eqx16',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'wkdwtaqyqg7',
    'x-async': true,
    'x-index': 1,
  },
};
