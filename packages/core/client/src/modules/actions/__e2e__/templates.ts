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
export const shouldRefreshBlockDataAfterMultiplePopupsClosed = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      tyx0aioxlr1: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          '0i5raczm0ne': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.2.11-alpha',
            properties: {
              zjk1te2zpix: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.2.11-alpha',
                properties: {
                  k7eyfysw52n: {
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
                        'x-uid': 'fkgbia9i3kt',
                        'x-async': false,
                        'x-index': 1,
                      },
                      pn8pb7x81kh: {
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
                              g3flunks833: {
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
                                  noihi5pm44q: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{ t("Edit") }}',
                                    'x-action': 'update',
                                    'x-toolbar': 'ActionSchemaToolbar',
                                    'x-settings': 'actionSettings:edit',
                                    'x-component': 'Action.Link',
                                    'x-component-props': {
                                      openMode: 'drawer',
                                      icon: 'EditOutlined',
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
                                        title: '{{ t("Edit record") }}',
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
                                                title: '{{t("Edit")}}',
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
                                                      suv1o9u1ti1: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        'x-app-version': '1.2.11-alpha',
                                                        properties: {
                                                          oqzxplx2qap: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            'x-app-version': '1.2.11-alpha',
                                                            properties: {
                                                              uxrg8z6qz3w: {
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
                                                                    'x-uid': 'nzb7njucb1g',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                  prcxluma72r: {
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
                                                                          z3n08qgeo8y: {
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
                                                                              pla7f5mwirx: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                title: '{{ t("Edit") }}',
                                                                                'x-action': 'update',
                                                                                'x-toolbar': 'ActionSchemaToolbar',
                                                                                'x-settings': 'actionSettings:edit',
                                                                                'x-component': 'Action.Link',
                                                                                'x-component-props': {
                                                                                  openMode: 'drawer',
                                                                                  icon: 'EditOutlined',
                                                                                },
                                                                                'x-action-context': {
                                                                                  dataSource: 'main',
                                                                                  association: 'users.roles',
                                                                                  sourceId: 1,
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
                                                                                    title: '{{ t("Edit record") }}',
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
                                                                                            title: '{{t("Edit")}}',
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
                                                                                                  k6k23ljfmwv: {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Row',
                                                                                                    'x-app-version':
                                                                                                      '1.2.11-alpha',
                                                                                                    properties: {
                                                                                                      ddkwboqqe19: {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'void',
                                                                                                        'x-component':
                                                                                                          'Grid.Col',
                                                                                                        'x-app-version':
                                                                                                          '1.2.11-alpha',
                                                                                                        properties: {
                                                                                                          '33h5pkdwmt5':
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
                                                                                                                'users.roles:update',
                                                                                                              'x-decorator':
                                                                                                                'FormBlockProvider',
                                                                                                              'x-use-decorator-props':
                                                                                                                'useEditFormBlockDecoratorProps',
                                                                                                              'x-decorator-props':
                                                                                                                {
                                                                                                                  action:
                                                                                                                    'get',
                                                                                                                  dataSource:
                                                                                                                    'main',
                                                                                                                  association:
                                                                                                                    'users.roles',
                                                                                                                },
                                                                                                              'x-toolbar':
                                                                                                                'BlockSchemaToolbar',
                                                                                                              'x-settings':
                                                                                                                'blockSettings:editForm',
                                                                                                              'x-component':
                                                                                                                'CardItem',
                                                                                                              'x-is-current':
                                                                                                                true,
                                                                                                              'x-app-version':
                                                                                                                '1.2.11-alpha',
                                                                                                              properties:
                                                                                                                {
                                                                                                                  '7t3234fb1yu':
                                                                                                                    {
                                                                                                                      _isJSONSchemaObject:
                                                                                                                        true,
                                                                                                                      version:
                                                                                                                        '2.0',
                                                                                                                      type: 'void',
                                                                                                                      'x-component':
                                                                                                                        'FormV2',
                                                                                                                      'x-use-component-props':
                                                                                                                        'useEditFormBlockProps',
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
                                                                                                                              'form:configureFields',
                                                                                                                            'x-app-version':
                                                                                                                              '1.2.11-alpha',
                                                                                                                            properties:
                                                                                                                              {
                                                                                                                                xizv324ooej:
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
                                                                                                                                        gjzwqen45hw:
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
                                                                                                                                                title:
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
                                                                                                                                                      'roles.title',
                                                                                                                                                    'x-component-props':
                                                                                                                                                      {},
                                                                                                                                                    'x-app-version':
                                                                                                                                                      '1.2.11-alpha',
                                                                                                                                                    'x-uid':
                                                                                                                                                      'i1q5apprfo3',
                                                                                                                                                    'x-async':
                                                                                                                                                      false,
                                                                                                                                                    'x-index': 1,
                                                                                                                                                  },
                                                                                                                                              },
                                                                                                                                            'x-uid':
                                                                                                                                              'cyrc9goozvc',
                                                                                                                                            'x-async':
                                                                                                                                              false,
                                                                                                                                            'x-index': 1,
                                                                                                                                          },
                                                                                                                                      },
                                                                                                                                    'x-uid':
                                                                                                                                      '1yonjmmam2w',
                                                                                                                                    'x-async':
                                                                                                                                      false,
                                                                                                                                    'x-index': 1,
                                                                                                                                  },
                                                                                                                              },
                                                                                                                            'x-uid':
                                                                                                                              'yzom6z8f3t2',
                                                                                                                            'x-async':
                                                                                                                              false,
                                                                                                                            'x-index': 1,
                                                                                                                          },
                                                                                                                          u0l41h24oqc:
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
                                                                                                                                },
                                                                                                                              'x-app-version':
                                                                                                                                '1.2.11-alpha',
                                                                                                                              properties:
                                                                                                                                {
                                                                                                                                  se7ggsy8wv0:
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
                                                                                                                                      'x-use-component-props':
                                                                                                                                        'useUpdateActionProps',
                                                                                                                                      'x-toolbar':
                                                                                                                                        'ActionSchemaToolbar',
                                                                                                                                      'x-settings':
                                                                                                                                        'actionSettings:updateSubmit',
                                                                                                                                      'x-component-props':
                                                                                                                                        {
                                                                                                                                          type: 'primary',
                                                                                                                                          htmlType:
                                                                                                                                            'submit',
                                                                                                                                        },
                                                                                                                                      'x-action-settings':
                                                                                                                                        {
                                                                                                                                          triggerWorkflows:
                                                                                                                                            [],
                                                                                                                                        },
                                                                                                                                      type: 'void',
                                                                                                                                      'x-app-version':
                                                                                                                                        '1.2.11-alpha',
                                                                                                                                      'x-uid':
                                                                                                                                        '38c98jagvqk',
                                                                                                                                      'x-async':
                                                                                                                                        false,
                                                                                                                                      'x-index': 1,
                                                                                                                                    },
                                                                                                                                },
                                                                                                                              'x-uid':
                                                                                                                                '4s6eki715ub',
                                                                                                                              'x-async':
                                                                                                                                false,
                                                                                                                              'x-index': 2,
                                                                                                                            },
                                                                                                                        },
                                                                                                                      'x-uid':
                                                                                                                        'xnnwdz56xzc',
                                                                                                                      'x-async':
                                                                                                                        false,
                                                                                                                      'x-index': 1,
                                                                                                                    },
                                                                                                                },
                                                                                                              'x-uid':
                                                                                                                'zvr9ezaqhn8',
                                                                                                              'x-async':
                                                                                                                false,
                                                                                                              'x-index': 1,
                                                                                                            },
                                                                                                        },
                                                                                                        'x-uid':
                                                                                                          'l3xw7vpnnmi',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      'mydjjzt5wjb',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': '1a12yaxkvlh',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': '28wuyvfuzxa',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': '739bd4xxp5r',
                                                                                        'x-async': false,
                                                                                        'x-index': 1,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': 'sc3bt4kz43j',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'bxmc5k79nhw',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': '4hz3jkt2wfo',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'x6x0ygv9b0s',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                      lyn5o91qf9v: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-decorator': 'TableV2.Column.Decorator',
                                                                        'x-toolbar': 'TableColumnSchemaToolbar',
                                                                        'x-settings': 'fieldSettings:TableColumn',
                                                                        'x-component': 'TableV2.Column',
                                                                        'x-app-version': '1.2.11-alpha',
                                                                        properties: {
                                                                          title: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            'x-collection-field': 'roles.title',
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
                                                                            'x-app-version': '1.2.11-alpha',
                                                                            'x-uid': 'a47ajmlmdq4',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'v3uq1qkh0f1',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': 'qxusos5qytp',
                                                                    'x-async': false,
                                                                    'x-index': 2,
                                                                  },
                                                                },
                                                                'x-uid': 'skdhbz3b5wb',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': '9keek6gthp6',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': 'n6k49p6zvw5',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': 'sod8zbrugmq',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'lt3vak0nmab',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'g1ee1hpkd4p',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'p4enijxueeg',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'bxd64x3df56',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': '0y4f0f650h9',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '2qk92ft951c',
                            'x-async': false,
                            'x-index': 1,
                          },
                          fv22e8igzgz: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '1.2.11-alpha',
                            properties: {
                              roles: {
                                'x-uid': 'zkenfmew3f7',
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'users.roles',
                                'x-component': 'CollectionField',
                                'x-component-props': {
                                  fieldNames: {
                                    label: 'title',
                                    value: 'name',
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
                                'x-app-version': '1.2.11-alpha',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '2fmv2b2n8it',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'n48nmuoljua',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'oiu3t5hup6s',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'kc32hfy3m57',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'aayu9ix6qh6',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'vutamnve682',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'da87s7d7xs0',
    'x-async': true,
    'x-index': 1,
  },
};
