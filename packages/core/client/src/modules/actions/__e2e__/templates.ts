/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const OneTableWithDelete = {
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
    'x-app-version': '0.21.0-alpha.15',
    properties: {
      lkxdltdha16: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-app-version': '0.21.0-alpha.15',
        properties: {
          gv2g50cqboq: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '0.21.0-alpha.15',
            properties: {
              qttwyoosjfp: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '0.21.0-alpha.15',
                properties: {
                  t5zn88zei2h: {
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
                    'x-app-version': '0.21.0-alpha.15',
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
                        'x-app-version': '0.21.0-alpha.15',
                        'x-uid': 'ktkeeuxg6pi',
                        'x-async': false,
                        'x-index': 1,
                      },
                      '0i8niaetq5x': {
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
                        'x-app-version': '0.21.0-alpha.15',
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
                            'x-app-version': '0.21.0-alpha.15',
                            properties: {
                              j4rat1z1o7f: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '0.21.0-alpha.15',
                                properties: {
                                  iraglv9h1sl: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    title: '{{ t("Delete") }}',
                                    'x-action': 'destroy',
                                    'x-component': 'Action.Link',
                                    'x-use-component-props': 'useDestroyActionProps',
                                    'x-toolbar': 'ActionSchemaToolbar',
                                    'x-settings': 'actionSettings:delete',
                                    'x-component-props': {
                                      icon: 'DeleteOutlined',
                                      confirm: {
                                        title: "{{t('Delete record')}}",
                                        content: "{{t('Are you sure you want to delete it?')}}",
                                      },
                                      refreshDataBlockRequest: true,
                                    },
                                    'x-action-settings': {
                                      triggerWorkflows: [],
                                    },
                                    'x-decorator': 'ACLActionProvider',
                                    'x-designer-props': {
                                      linkageAction: true,
                                    },
                                    type: 'void',
                                    'x-uid': '41vvzswpcrl',
                                    'x-async': false,
                                    'x-index': 3,
                                  },
                                },
                                'x-uid': '88lg65527kr',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '4gj0sxfajz7',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'du9l3dpxv3l',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': '254kdo5vqjo',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '8ofzfmchujz',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': '0y5ftvbwjop',
            'x-async': false,
            'x-index': 3,
          },
        },
        'x-uid': 'nf4sg144317',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'crrg2fymbz0',
    'x-async': true,
    'x-index': 1,
  },
};
