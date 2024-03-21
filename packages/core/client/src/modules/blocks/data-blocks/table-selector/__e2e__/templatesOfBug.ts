import { PageConfig } from '@nocobase/test/e2e';

const commonCollections = [
  {
    name: 'table-selector-data-scope-variable',
    fields: [
      {
        name: 'manyToMany',
        interface: 'm2m',
        target: 'table-selector-data-scope-variable',
      },
      {
        name: 'singleLineText',
        interface: 'input',
      },
    ],
  },
];

export const tableSelectorDataScopeVariable: PageConfig = {
  collections: commonCollections,
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      ij2wf9hi0si: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'BlockInitializers',
        properties: {
          jdz50aeuduh: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              ij66b8u5o5m: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  '5j0kimft2lz': {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'table-selector-data-scope-variable:list',
                    'x-decorator-props': {
                      collection: 'table-selector-data-scope-variable',
                      dataSource: 'main',
                      resource: 'table-selector-data-scope-variable',
                      action: 'list',
                      params: {
                        pageSize: 20,
                      },
                      rowKey: 'id',
                      showIndex: true,
                      dragSort: false,
                      disableTemplate: false,
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
                        'x-initializer': 'TableActionInitializers',
                        'x-component': 'ActionBar',
                        'x-component-props': {
                          style: {
                            marginBottom: 'var(--nb-spacing)',
                          },
                        },
                        'x-uid': 'vdvzzbfp53e',
                        'x-async': false,
                        'x-index': 1,
                      },
                      ttcsp9slh2z: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'array',
                        'x-initializer': 'TableColumnInitializers',
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
                            'x-initializer': 'TableActionColumnInitializers',
                            properties: {
                              f1gruzhfm8r: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                properties: {
                                  esrrc38rvqe: {
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
                                                    'x-initializer': 'RecordBlockInitializers',
                                                    properties: {
                                                      zhykdvqpa7k: {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Row',
                                                        properties: {
                                                          luhz7fq6529: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-component': 'Grid.Col',
                                                            properties: {
                                                              gecihd85864: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-acl-action-props': {
                                                                  skipScopeCheck: false,
                                                                },
                                                                'x-acl-action':
                                                                  'table-selector-data-scope-variable:update',
                                                                'x-decorator': 'FormBlockProvider',
                                                                'x-decorator-props': {
                                                                  useSourceId: '{{ useSourceIdFromParentRecord }}',
                                                                  useParams: '{{ useParamsFromRecord }}',
                                                                  action: 'get',
                                                                  dataSource: 'main',
                                                                  resource: 'table-selector-data-scope-variable',
                                                                  collection: 'table-selector-data-scope-variable',
                                                                },
                                                                'x-toolbar': 'BlockSchemaToolbar',
                                                                'x-settings': 'blockSettings:editForm',
                                                                'x-component': 'CardItem',
                                                                'x-component-props': {},
                                                                properties: {
                                                                  '3h121b8k9ey': {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'FormV2',
                                                                    'x-component-props': {
                                                                      useProps: '{{ useFormBlockProps }}',
                                                                    },
                                                                    properties: {
                                                                      grid: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid',
                                                                        'x-initializer': 'FormItemInitializers',
                                                                        properties: {
                                                                          t4tin6z9nq1: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            properties: {
                                                                              xb7fdug52ex: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                properties: {
                                                                                  manyToMany: {
                                                                                    'x-uid': 'p0km7m8dnj4',
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-toolbar':
                                                                                      'FormItemSchemaToolbar',
                                                                                    'x-settings':
                                                                                      'fieldSettings:FormItem',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field':
                                                                                      'table-selector-data-scope-variable.manyToMany',
                                                                                    'x-component-props': {
                                                                                      fieldNames: {
                                                                                        label: 'id',
                                                                                        value: 'id',
                                                                                      },
                                                                                      mode: 'Picker',
                                                                                    },
                                                                                    properties: {
                                                                                      guunasm2a3h: {
                                                                                        _isJSONSchemaObject: true,
                                                                                        version: '2.0',
                                                                                        type: 'void',
                                                                                        'x-component':
                                                                                          'AssociationField.Selector',
                                                                                        title:
                                                                                          '{{ t("Select record") }}',
                                                                                        'x-component-props': {
                                                                                          className:
                                                                                            'nb-record-picker-selector',
                                                                                        },
                                                                                        'x-index': 1,
                                                                                        properties: {
                                                                                          grid: {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            'x-component': 'Grid',
                                                                                            'x-initializer':
                                                                                              'TableSelectorInitializers',
                                                                                            properties: {
                                                                                              '0uui41pxdye': {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component':
                                                                                                  'Grid.Row',
                                                                                                properties: {
                                                                                                  '476w75depv3': {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-component':
                                                                                                      'Grid.Col',
                                                                                                    properties: {
                                                                                                      alibfkv2g0v: {
                                                                                                        'x-uid':
                                                                                                          'y8f4lswt52q',
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'void',
                                                                                                        'x-acl-action':
                                                                                                          'table-selector-data-scope-variable:list',
                                                                                                        'x-decorator':
                                                                                                          'TableSelectorProvider',
                                                                                                        'x-decorator-props':
                                                                                                          {
                                                                                                            collection:
                                                                                                              'table-selector-data-scope-variable',
                                                                                                            resource:
                                                                                                              'table-selector-data-scope-variable',
                                                                                                            dataSource:
                                                                                                              'main',
                                                                                                            action:
                                                                                                              'list',
                                                                                                            params: {
                                                                                                              pageSize: 20,
                                                                                                              filter:
                                                                                                                {},
                                                                                                            },
                                                                                                            rowKey:
                                                                                                              'id',
                                                                                                          },
                                                                                                        'x-toolbar':
                                                                                                          'BlockSchemaToolbar',
                                                                                                        'x-settings':
                                                                                                          'blockSettings:tableSelector',
                                                                                                        'x-component':
                                                                                                          'CardItem',
                                                                                                        properties: {
                                                                                                          rblwp47r7fz: {
                                                                                                            _isJSONSchemaObject:
                                                                                                              true,
                                                                                                            version:
                                                                                                              '2.0',
                                                                                                            type: 'void',
                                                                                                            'x-initializer':
                                                                                                              'TableActionInitializers',
                                                                                                            'x-component':
                                                                                                              'ActionBar',
                                                                                                            'x-component-props':
                                                                                                              {
                                                                                                                style: {
                                                                                                                  marginBottom:
                                                                                                                    'var(--nb-spacing)',
                                                                                                                },
                                                                                                              },
                                                                                                            'x-uid':
                                                                                                              'ubog2cks3ay',
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                            'x-index': 1,
                                                                                                          },
                                                                                                          value: {
                                                                                                            _isJSONSchemaObject:
                                                                                                              true,
                                                                                                            version:
                                                                                                              '2.0',
                                                                                                            type: 'array',
                                                                                                            'x-initializer':
                                                                                                              'TableColumnInitializers',
                                                                                                            'x-component':
                                                                                                              'TableV2.Selector',
                                                                                                            'x-component-props':
                                                                                                              {
                                                                                                                rowSelection:
                                                                                                                  {
                                                                                                                    type: 'checkbox',
                                                                                                                  },
                                                                                                                useProps:
                                                                                                                  '{{ useTableSelectorProps }}',
                                                                                                              },
                                                                                                            properties:
                                                                                                              {
                                                                                                                jryz1oqazsj:
                                                                                                                  {
                                                                                                                    _isJSONSchemaObject:
                                                                                                                      true,
                                                                                                                    version:
                                                                                                                      '2.0',
                                                                                                                    type: 'void',
                                                                                                                    title:
                                                                                                                      '{{ t("Actions") }}',
                                                                                                                    'x-decorator':
                                                                                                                      'TableV2.Column.ActionBar',
                                                                                                                    'x-component':
                                                                                                                      'TableV2.Column',
                                                                                                                    'x-designer':
                                                                                                                      'TableV2.ActionColumnDesigner',
                                                                                                                    'x-initializer':
                                                                                                                      'TableActionColumnInitializers',
                                                                                                                    'x-action-column':
                                                                                                                      'actions',
                                                                                                                    properties:
                                                                                                                      {
                                                                                                                        pkzvqfi6lr5:
                                                                                                                          {
                                                                                                                            _isJSONSchemaObject:
                                                                                                                              true,
                                                                                                                            version:
                                                                                                                              '2.0',
                                                                                                                            type: 'void',
                                                                                                                            'x-decorator':
                                                                                                                              'DndContext',
                                                                                                                            'x-component':
                                                                                                                              'Space',
                                                                                                                            'x-component-props':
                                                                                                                              {
                                                                                                                                split:
                                                                                                                                  '|',
                                                                                                                              },
                                                                                                                            properties:
                                                                                                                              {
                                                                                                                                xffx2jx6u7q:
                                                                                                                                  {
                                                                                                                                    _isJSONSchemaObject:
                                                                                                                                      true,
                                                                                                                                    version:
                                                                                                                                      '2.0',
                                                                                                                                    type: 'void',
                                                                                                                                    title:
                                                                                                                                      '{{ t("View") }}',
                                                                                                                                    'x-action':
                                                                                                                                      'view',
                                                                                                                                    'x-toolbar':
                                                                                                                                      'ActionSchemaToolbar',
                                                                                                                                    'x-settings':
                                                                                                                                      'actionSettings:view',
                                                                                                                                    'x-component':
                                                                                                                                      'Action.Link',
                                                                                                                                    'x-component-props':
                                                                                                                                      {
                                                                                                                                        openMode:
                                                                                                                                          'drawer',
                                                                                                                                      },
                                                                                                                                    'x-decorator':
                                                                                                                                      'ACLActionProvider',
                                                                                                                                    'x-designer-props':
                                                                                                                                      {
                                                                                                                                        linkageAction:
                                                                                                                                          true,
                                                                                                                                      },
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
                                                                                                                                              '{{ t("View record") }}',
                                                                                                                                            'x-component':
                                                                                                                                              'Action.Container',
                                                                                                                                            'x-component-props':
                                                                                                                                              {
                                                                                                                                                className:
                                                                                                                                                  'nb-action-popup',
                                                                                                                                              },
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
                                                                                                                                                  properties:
                                                                                                                                                    {
                                                                                                                                                      tab1: {
                                                                                                                                                        _isJSONSchemaObject:
                                                                                                                                                          true,
                                                                                                                                                        version:
                                                                                                                                                          '2.0',
                                                                                                                                                        type: 'void',
                                                                                                                                                        title:
                                                                                                                                                          '{{t("Details")}}',
                                                                                                                                                        'x-component':
                                                                                                                                                          'Tabs.TabPane',
                                                                                                                                                        'x-designer':
                                                                                                                                                          'Tabs.Designer',
                                                                                                                                                        'x-component-props':
                                                                                                                                                          {},
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
                                                                                                                                                                'RecordBlockInitializers',
                                                                                                                                                              'x-uid':
                                                                                                                                                                'wkqrpvcqiih',
                                                                                                                                                              'x-async':
                                                                                                                                                                false,
                                                                                                                                                              'x-index': 1,
                                                                                                                                                            },
                                                                                                                                                          },
                                                                                                                                                        'x-uid':
                                                                                                                                                          '2lzui9z88st',
                                                                                                                                                        'x-async':
                                                                                                                                                          false,
                                                                                                                                                        'x-index': 1,
                                                                                                                                                      },
                                                                                                                                                    },
                                                                                                                                                  'x-uid':
                                                                                                                                                    'ee4zj3qx2ip',
                                                                                                                                                  'x-async':
                                                                                                                                                    false,
                                                                                                                                                  'x-index': 1,
                                                                                                                                                },
                                                                                                                                              },
                                                                                                                                            'x-uid':
                                                                                                                                              'l5ew3g2ka6s',
                                                                                                                                            'x-async':
                                                                                                                                              false,
                                                                                                                                            'x-index': 1,
                                                                                                                                          },
                                                                                                                                      },
                                                                                                                                    'x-uid':
                                                                                                                                      '0m2i5xxfw1k',
                                                                                                                                    'x-async':
                                                                                                                                      false,
                                                                                                                                    'x-index': 1,
                                                                                                                                  },
                                                                                                                              },
                                                                                                                            'x-uid':
                                                                                                                              'zm42p4adruu',
                                                                                                                            'x-async':
                                                                                                                              false,
                                                                                                                            'x-index': 1,
                                                                                                                          },
                                                                                                                      },
                                                                                                                    'x-uid':
                                                                                                                      '4ybzswir3zr',
                                                                                                                    'x-async':
                                                                                                                      false,
                                                                                                                    'x-index': 2,
                                                                                                                  },
                                                                                                                d51klxxphw4:
                                                                                                                  {
                                                                                                                    _isJSONSchemaObject:
                                                                                                                      true,
                                                                                                                    version:
                                                                                                                      '2.0',
                                                                                                                    type: 'void',
                                                                                                                    'x-decorator':
                                                                                                                      'TableV2.Column.Decorator',
                                                                                                                    'x-toolbar':
                                                                                                                      'TableColumnSchemaToolbar',
                                                                                                                    'x-settings':
                                                                                                                      'fieldSettings:TableColumn',
                                                                                                                    'x-component':
                                                                                                                      'TableV2.Column',
                                                                                                                    properties:
                                                                                                                      {
                                                                                                                        singleLineText:
                                                                                                                          {
                                                                                                                            _isJSONSchemaObject:
                                                                                                                              true,
                                                                                                                            version:
                                                                                                                              '2.0',
                                                                                                                            'x-collection-field':
                                                                                                                              'table-selector-data-scope-variable.singleLineText',
                                                                                                                            'x-component':
                                                                                                                              'CollectionField',
                                                                                                                            'x-component-props':
                                                                                                                              {
                                                                                                                                ellipsis:
                                                                                                                                  true,
                                                                                                                              },
                                                                                                                            'x-read-pretty':
                                                                                                                              true,
                                                                                                                            'x-decorator':
                                                                                                                              null,
                                                                                                                            'x-decorator-props':
                                                                                                                              {
                                                                                                                                labelStyle:
                                                                                                                                  {
                                                                                                                                    display:
                                                                                                                                      'none',
                                                                                                                                  },
                                                                                                                              },
                                                                                                                            'x-uid':
                                                                                                                              'n069twt8nsc',
                                                                                                                            'x-async':
                                                                                                                              false,
                                                                                                                            'x-index': 1,
                                                                                                                          },
                                                                                                                      },
                                                                                                                    'x-uid':
                                                                                                                      '51p2r7zlo9k',
                                                                                                                    'x-async':
                                                                                                                      false,
                                                                                                                    'x-index': 3,
                                                                                                                  },
                                                                                                              },
                                                                                                            'x-uid':
                                                                                                              'gkbturli19t',
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                            'x-index': 2,
                                                                                                          },
                                                                                                        },
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      't45on50ncwe',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': '9hzvnye1ntr',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'k2bdu4w8zz2',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                          footer: {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            'x-component':
                                                                                              'Action.Container.Footer',
                                                                                            'x-component-props': {},
                                                                                            properties: {
                                                                                              actions: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component':
                                                                                                  'ActionBar',
                                                                                                'x-component-props': {},
                                                                                                properties: {
                                                                                                  submit: {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    title:
                                                                                                      '{{ t("Submit") }}',
                                                                                                    'x-action':
                                                                                                      'submit',
                                                                                                    'x-component':
                                                                                                      'Action',
                                                                                                    'x-toolbar':
                                                                                                      'ActionSchemaToolbar',
                                                                                                    'x-settings':
                                                                                                      'actionSettings:updateSubmit',
                                                                                                    'x-component-props':
                                                                                                      {
                                                                                                        type: 'primary',
                                                                                                        htmlType:
                                                                                                          'submit',
                                                                                                        useProps:
                                                                                                          '{{ usePickActionProps }}',
                                                                                                      },
                                                                                                    'x-uid':
                                                                                                      'n6qpnb48sbd',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': '92iud7xsva7',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': '3c8prk8jgoh',
                                                                                            'x-async': false,
                                                                                            'x-index': 2,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': '41hvryuv2jy',
                                                                                        'x-async': false,
                                                                                      },
                                                                                    },
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'qbnfti92f1t',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': '4dx0hfhj9mj',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                          '23d5tg85dmy': {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Row',
                                                                            properties: {
                                                                              wwivbgmqgly: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Grid.Col',
                                                                                properties: {
                                                                                  singleLineText: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'string',
                                                                                    'x-toolbar':
                                                                                      'FormItemSchemaToolbar',
                                                                                    'x-settings':
                                                                                      'fieldSettings:FormItem',
                                                                                    'x-component': 'CollectionField',
                                                                                    'x-decorator': 'FormItem',
                                                                                    'x-collection-field':
                                                                                      'table-selector-data-scope-variable.singleLineText',
                                                                                    'x-component-props': {},
                                                                                    'x-uid': 'sj6aet9kqxc',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': '9cj7a3ivw6b',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': '5w0lqwa932g',
                                                                            'x-async': false,
                                                                            'x-index': 2,
                                                                          },
                                                                        },
                                                                        'x-uid': 'gmbrw8r2h2s',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                      gi40rgo7rbw: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-initializer': 'UpdateFormActionInitializers',
                                                                        'x-component': 'ActionBar',
                                                                        'x-component-props': {
                                                                          layout: 'one-column',
                                                                          style: {
                                                                            marginTop: 24,
                                                                          },
                                                                        },
                                                                        'x-uid': 'go3p2x3eo9j',
                                                                        'x-async': false,
                                                                        'x-index': 2,
                                                                      },
                                                                    },
                                                                    'x-uid': '5wir035vnz7',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                },
                                                                'x-uid': 'r82q143nugf',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': 'rqwpj88fpss',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': '4yfu43yq0ff',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': '1xvy1k1xpig',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'ip9pwu9kuf0',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'h9iowhtt6mu',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'so8ptulb3b0',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'lcy4ohio47t',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'oh16739fgf8',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'ut6738nt9in',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': '4e89got7e7b',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': '5yt30cpknsy',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '0s3jvo8y7y3',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'irunx7mpta6',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': '8es0fh04717',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'hwlep783jqy',
    'x-async': true,
    'x-index': 1,
  },
};
