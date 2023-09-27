import { expect, test } from '@nocobase/test/client';

const pageConfig = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      pdxwiogf3pc: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'BlockInitializers',
        properties: {
          txjj2q9859s: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              w4ziz4txnrn: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  xpfe7mh0n0p: {
                    'x-uid': '7pdacls95qk',
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
                      },
                      rowKey: 'id',
                      showIndex: true,
                      dragSort: false,
                      disableTemplate: false,
                    },
                    'x-designer': 'TableBlockDesigner',
                    'x-component': 'CardItem',
                    'x-filter-targets': [],
                    'x-component-props': {
                      title: 'Table block',
                    },
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
                        'x-uid': 'wb5mvwm537t',
                        'x-async': false,
                        'x-index': 1,
                      },
                      xj9bu0sv4yz: {
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
                              actions: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                'x-uid': '33rzky3kemq',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '7nnw5grzet8',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'm54bsjcv09a',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '4yi4kr1wgkz',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'g6bhfeaba55',
            'x-async': false,
            'x-index': 1,
          },
          j9xgdusioku: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              '4pdar7yt1d1': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  prtqni04a5t: {
                    'x-uid': 'coyws8els85',
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action-props': {
                      skipScopeCheck: true,
                    },
                    'x-acl-action': 'users:create',
                    'x-decorator': 'FormBlockProvider',
                    'x-decorator-props': {
                      resource: 'users',
                      collection: 'users',
                    },
                    'x-designer': 'FormV2.Designer',
                    'x-component': 'CardItem',
                    'x-component-props': {
                      title: 'Form block',
                    },
                    properties: {
                      uo3q3bs1l4c: {
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
                            'x-uid': '54w1s4gkrp4',
                            'x-async': false,
                            'x-index': 1,
                          },
                          actions: {
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
                            'x-uid': 'wx1ymybhw4d',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': '47x9aotslaf',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '4tdyzz3hh3s',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': '5pr5x41th9y',
            'x-async': false,
            'x-index': 2,
          },
          hlm6jtcx5px: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              '0if9syydrxn': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  fhi0k7tswj1: {
                    'x-uid': 'dntzs4ojq9y',
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action': 'users:view',
                    'x-decorator': 'DetailsBlockProvider',
                    'x-decorator-props': {
                      resource: 'users',
                      collection: 'users',
                      readPretty: true,
                      action: 'list',
                      params: {
                        pageSize: 1,
                      },
                      rowKey: 'id',
                    },
                    'x-designer': 'DetailsDesigner',
                    'x-component': 'CardItem',
                    'x-component-props': {
                      title: 'Details block',
                    },
                    properties: {
                      ru4sjmi898d: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'Details',
                        'x-read-pretty': true,
                        'x-component-props': {
                          useProps: '{{ useDetailsBlockProps }}',
                        },
                        properties: {
                          '74jvk36v996': {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-initializer': 'DetailsActionInitializers',
                            'x-component': 'ActionBar',
                            'x-component-props': {
                              style: {
                                marginBottom: 24,
                              },
                            },
                            'x-uid': 'zpt2ewuvd3i',
                            'x-async': false,
                            'x-index': 1,
                          },
                          grid: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'ReadPrettyFormItemInitializers',
                            'x-uid': 'ivgyowpi1rj',
                            'x-async': false,
                            'x-index': 2,
                          },
                          pagination: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Pagination',
                            'x-component-props': {
                              useProps: '{{ useDetailsPaginationProps }}',
                            },
                            'x-uid': 'yl3bc57sqmx',
                            'x-async': false,
                            'x-index': 3,
                          },
                        },
                        'x-uid': 't3sshcjbw53',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'so9f6fq7nmf',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'jdrrxpdel86',
            'x-async': false,
            'x-index': 3,
          },
          ipq256mnxif: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              h65018f1z8b: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  ym27n2ko5vr: {
                    'x-uid': 'j45qq035eas',
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action': 'users:view',
                    'x-decorator': 'List.Decorator',
                    'x-decorator-props': {
                      resource: 'users',
                      collection: 'users',
                      readPretty: true,
                      action: 'list',
                      params: {
                        pageSize: 10,
                      },
                      runWhenParamsChanged: true,
                      rowKey: 'id',
                    },
                    'x-component': 'CardItem',
                    'x-designer': 'List.Designer',
                    'x-component-props': {
                      title: 'List block',
                    },
                    properties: {
                      actionBar: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-initializer': 'ListActionInitializers',
                        'x-component': 'ActionBar',
                        'x-component-props': {
                          style: {
                            marginBottom: 'var(--nb-spacing)',
                          },
                        },
                        'x-uid': 'c66vjxpf8bf',
                        'x-async': false,
                        'x-index': 1,
                      },
                      list: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'array',
                        'x-component': 'List',
                        'x-component-props': {
                          props: '{{ useListBlockProps }}',
                        },
                        properties: {
                          item: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'object',
                            'x-component': 'List.Item',
                            'x-read-pretty': true,
                            'x-component-props': {
                              useProps: '{{ useListItemProps }}',
                            },
                            properties: {
                              grid: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid',
                                'x-initializer': 'ReadPrettyFormItemInitializers',
                                'x-initializer-props': {
                                  useProps: '{{ useListItemInitializerProps }}',
                                },
                                'x-uid': 'uqml2dwp9rv',
                                'x-async': false,
                                'x-index': 1,
                              },
                              actionBar: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-align': 'left',
                                'x-initializer': 'ListItemActionInitializers',
                                'x-component': 'ActionBar',
                                'x-component-props': {
                                  useProps: '{{ useListActionBarProps }}',
                                  layout: 'one-column',
                                },
                                'x-uid': 'de6lsblu8nf',
                                'x-async': false,
                                'x-index': 2,
                              },
                            },
                            'x-uid': 'uzulduo8g1z',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 's53c3p9hmf1',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'zg9l4uw1rmy',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'qw9hle324xg',
            'x-async': false,
            'x-index': 4,
          },
        },
        'x-uid': 'lvyncy91yyv',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'ny9ds6mjkkj',
    'x-async': true,
    'x-index': 1,
  },
};

test.describe('pageSchema', () => {
  test('quickly create page schema', async ({ page, mockPage }) => {
    await mockPage(pageConfig).goto();

    await expect(page.getByText('Table block')).toBeVisible();
    await expect(page.getByText('Form block')).toBeVisible();
    await expect(page.getByText('Details block')).toBeVisible();
    await expect(page.getByText('List block')).toBeVisible();
  });
});
