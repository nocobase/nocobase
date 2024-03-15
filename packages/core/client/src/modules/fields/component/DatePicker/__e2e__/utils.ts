import { generalWithDatetime, PageConfig } from '@nocobase/test/e2e';
/**
 * 1. 一个 Table 区块
 * 5. 所有字段都是 datetime 字段
 */
export const oneTableBlockWithDatetimeFields: PageConfig = {
  collections: generalWithDatetime,
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      rzvrcrafmff: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          irc4mhtog83: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              bv65e6wkcef: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  gq797u6o8ti: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'general:list',
                    'x-decorator-props': {
                      collection: 'general',
                      dataSource: 'main',
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
                        'x-uid': 'nd5jqapjy3w',
                        'x-async': false,
                        'x-index': 1,
                      },
                      pkdf64ojs4s: {
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
                              gk4b4e4wp8b: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-uid': 'cj0u0c1ajp7',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'bqjujfh7zdw',
                            'x-async': false,
                            'x-index': 1,
                          },
                          nlf077nijaa: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            properties: {
                              datetime: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'general.datetime',
                                'x-component': 'CollectionField',
                                'x-component-props': {},
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-uid': 'uv26aslikjn',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '1eten1jj0gt',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 't47ph1tmsa0',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': '7zqek220iua',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'jh19krqxftf',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'lbfsv3pz0qi',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'xlc7hd8s8az',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'ml7rypfikcm',
    'x-async': true,
    'x-index': 1,
  },
};

/**
 * 1. 一个 Form 区块
 * 5. 所有字段都是 datetime 字段
 */
export const oneFormBlockWithDatetimeFields: PageConfig = {
  collections: generalWithDatetime,
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      rzvrcrafmff: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          annx4g65mtu: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              ov02gf15cw5: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  qx7c4utyugy: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action-props': {
                      skipScopeCheck: true,
                    },
                    'x-acl-action': 'general:create',
                    'x-decorator': 'FormBlockProvider',
                    'x-decorator-props': {
                      dataSource: 'main',
                      resource: 'general',
                      collection: 'general',
                    },
                    'x-toolbar': 'BlockSchemaToolbar',
                    'x-settings': 'blockSettings:createForm',
                    'x-component': 'CardItem',
                    'x-component-props': {},
                    properties: {
                      '00mj93xz46e': {
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
                            'x-initializer': 'form:configureFields',
                            properties: {
                              '269bdhc35j2': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                properties: {
                                  '7nkbge7b0bo': {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
                                    properties: {
                                      datetime: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'string',
                                        'x-toolbar': 'FormItemSchemaToolbar',
                                        'x-settings': 'fieldSettings:FormItem',
                                        'x-component': 'CollectionField',
                                        'x-decorator': 'FormItem',
                                        'x-collection-field': 'general.datetime',
                                        'x-component-props': {},
                                        'x-uid': 'lpcbskripdi',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'ykx953ujfur',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'bnz69w2wylm',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'rf04idbxdeo',
                            'x-async': false,
                            'x-index': 1,
                          },
                          '0vnfo3li57v': {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-initializer': 'FormActionInitializers',
                            'x-component': 'ActionBar',
                            'x-component-props': {
                              layout: 'one-column',
                              style: {
                                marginTop: 24,
                              },
                            },
                            'x-uid': '0m3zbok6yhn',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'gusa79tzjit',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'ntdpcoeszfh',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '4qk0nzqrmtn',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'hoxpqzqrumd',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'xlc7hd8s8az',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'ml7rypfikcm',
    'x-async': true,
    'x-index': 1,
  },
};
