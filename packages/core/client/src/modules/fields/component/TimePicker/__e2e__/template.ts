/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { generalWithDatetime, PageConfig } from '@nocobase/test/e2e';

/**
 * 1. 一个 Form 区块\一个Table
 * 5. 所有字段都是 time 字段
 */
export const oneFormBlockWithTimeField: PageConfig = {
  collections: generalWithDatetime,
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-app-version': '1.6.0-beta.15',
    properties: {
      yjae0hw7w4m: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-app-version': '1.6.0-beta.15',
        properties: {
          p2ud89cmdsj: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.6.0-beta.15',
            properties: {
              ic2lvywe453: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.6.0-beta.15',
                properties: {
                  ejm452mcfqf: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action-props': {
                      skipScopeCheck: true,
                    },
                    'x-acl-action': 'general:create',
                    'x-decorator': 'FormBlockProvider',
                    'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
                    'x-decorator-props': {
                      dataSource: 'main',
                      collection: 'general',
                    },
                    'x-toolbar': 'BlockSchemaToolbar',
                    'x-settings': 'blockSettings:createForm',
                    'x-component': 'CardItem',
                    'x-app-version': '1.6.0-beta.15',
                    properties: {
                      uizopeb0gdx: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'FormV2',
                        'x-use-component-props': 'useCreateFormBlockProps',
                        'x-app-version': '1.6.0-beta.15',
                        properties: {
                          grid: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'form:configureFields',
                            'x-app-version': '1.6.0-beta.15',
                            properties: {
                              m2x40wt0f0r: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid.Row',
                                'x-app-version': '1.6.0-beta.15',
                                properties: {
                                  '3kn5w9dj3h6': {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Col',
                                    'x-app-version': '1.6.0-beta.15',
                                    properties: {
                                      time: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'string',
                                        'x-toolbar': 'FormItemSchemaToolbar',
                                        'x-settings': 'fieldSettings:FormItem',
                                        'x-component': 'CollectionField',
                                        'x-decorator': 'FormItem',
                                        'x-collection-field': 'general.time',
                                        'x-component-props': {},
                                        'x-app-version': '1.6.0-beta.15',
                                        'x-uid': '76f5jb57ey9',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'ur04ehrn1e6',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'v3894toxet8',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'j9rv21n3197',
                            'x-async': false,
                            'x-index': 1,
                          },
                          wm2nvr5d4j8: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-initializer': 'createForm:configureActions',
                            'x-component': 'ActionBar',
                            'x-component-props': {
                              layout: 'one-column',
                            },
                            'x-app-version': '1.6.0-beta.15',
                            'x-uid': 'i2nzkcibwd4',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'cs3lcqbet7q',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'cc8fwk5axfs',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'hpmiaka8jlp',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'y4pqnipi0on',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': '5j3ftwsuvk7',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'qif8bkjq7kv',
    'x-async': true,
    'x-index': 1,
  },
};

/**
 * 1. 一个 Form 区块\一个Table
 * 5. 所有字段都是 time 字段
 */
export const oneTableBlockWithTimeField: PageConfig = {
  collections: generalWithDatetime,
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-app-version': '1.6.0-beta.15',
    properties: {
      yjae0hw7w4m: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-app-version': '1.6.0-beta.15',
        properties: {
          sfktacc6qng: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '1.6.0-beta.15',
            properties: {
              aft3rjsnrr3: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '1.6.0-beta.15',
                properties: {
                  n2tzols0da0: {
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
                    'x-app-version': '1.6.0-beta.15',
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
                        'x-app-version': '1.6.0-beta.15',
                        'x-uid': '8zmjddrlpt7',
                        'x-async': false,
                        'x-index': 1,
                      },
                      '6et4p3qclc6': {
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
                        'x-app-version': '1.6.0-beta.15',
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
                            'x-app-version': '1.6.0-beta.15',
                            properties: {
                              '8ujrihmuxwi': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-app-version': '1.6.0-beta.15',
                                'x-uid': 'vpsnsemc5iz',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'to4z2kld8cb',
                            'x-async': false,
                            'x-index': 1,
                          },
                          host1qju9vo: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-toolbar': 'TableColumnSchemaToolbar',
                            'x-settings': 'fieldSettings:TableColumn',
                            'x-component': 'TableV2.Column',
                            'x-app-version': '1.6.0-beta.15',
                            properties: {
                              time: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 'general.time',
                                'x-component': 'CollectionField',
                                'x-component-props': {},
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-app-version': '1.6.0-beta.15',
                                'x-uid': '1t09d95p38h',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '38vdpp99z9s',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': '3ccldpb58hp',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'dtd0eeq2jwu',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'rnzuzapf9cz',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'ikzfjf1vv39',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': '5j3ftwsuvk7',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'qif8bkjq7kv',
    'x-async': true,
    'x-index': 1,
  },
};
