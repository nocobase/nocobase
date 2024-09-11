/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const theDateStringShouldNotBeUTC = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-app-version': '1.2.26-alpha',
    properties: {
      es36mtcuj77: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-app-version': '1.2.26-alpha',
        properties: {
          rqpd9r2rueb: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.2.26-alpha',
            properties: {
              '4n75f33bowk': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.2.26-alpha',
                properties: {
                  ppcczd368ap: {
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
                    'x-app-version': '1.2.26-alpha',
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
                        'x-app-version': '1.2.26-alpha',
                        properties: {
                          '69dtb0exaep': {
                            'x-uid': '7v2pn6flf92',
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            title: '{{ t("Filter") }}',
                            'x-action': 'filter',
                            'x-toolbar': 'ActionSchemaToolbar',
                            'x-settings': 'actionSettings:filter',
                            'x-component': 'Filter.Action',
                            'x-use-component-props': 'useFilterActionProps',
                            'x-component-props': {
                              icon: 'FilterOutlined',
                            },
                            'x-align': 'left',
                            'x-app-version': '1.2.26-alpha',
                            default: {
                              $and: [
                                {
                                  createdAt: {
                                    $dateOn: null,
                                  },
                                },
                              ],
                            },
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'wq9tco5xrc5',
                        'x-async': false,
                        'x-index': 1,
                      },
                      mli07w96bpg: {
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
                        'x-app-version': '1.2.26-alpha',
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
                            'x-app-version': '1.2.26-alpha',
                            properties: {
                              gptrtf70ksb: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '1.2.26-alpha',
                                'x-uid': 'kf5es0sxa8d',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'cz3uuywilz2',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': '2qt9yfh8pnw',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': '04je96az8ze',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'gbljz8oqqrf',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'gwms2kvl983',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'm3gs8ov60rw',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': '1f2ikh8fvu9',
    'x-async': true,
    'x-index': 1,
  },
};
