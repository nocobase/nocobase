import { expect, test } from '@nocobase/test/client';

const config = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      gyi7sgwfctr: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'BlockInitializers',
        properties: {
          nm5sil2dc2y: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              '3ux5rf2637w': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  '27osls2fuo8': {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'roles:list',
                    'x-decorator-props': {
                      collection: 'roles',
                      resource: 'roles',
                      action: 'list',
                      params: {
                        pageSize: 20,
                      },
                      rowKey: 'name',
                      showIndex: true,
                      dragSort: false,
                      disableTemplate: false,
                    },
                    'x-designer': 'TableBlockDesigner',
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
                        'x-uid': 'kk95b2toxch',
                        'x-async': false,
                        'x-index': 1,
                      },
                      igzxzc2vt2t: {
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
                                properties: {
                                  ocawgcp0v8w: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{ t("View") }}',
                                    'x-action': 'view',
                                    'x-designer': 'Action.Designer',
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
                                                    'x-uid': 'v1z2373u5p1',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'p52m5ti5boo',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': '2l5qzwu1wg3',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'gkictroi33j',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'a07j11haxbn',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'dqe0do6km5f',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'ei7nn2r7iut',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'i9pw6eivnpg',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': '13fp2kvtrlv',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '5babsjvcjrr',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'uw2uttteuhi',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'kwblwpbedaf',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'bzvxogn0d5r',
    'x-async': true,
    'x-index': 1,
  },
};

// fix https://nocobase.height.app/T-2176
test.skip('BUG: Relationship block issue, menu should not display loading', async ({ page, mockPage }) => {
  await mockPage(config).goto();
  await page.getByRole('row', { name: '1 View' }).getByTestId('view-action').click();
  await page.getByTestId('action-drawer').getByRole('button', { name: 'plus Add block' }).hover();

  // TODO: 这里无论是 not.toBeVisible 还是 toBeVisible 都会通过，暂时不知道怎么解决，先跳过
  // 这个输入框不应该显示
  await expect(page.getByPlaceholder('Search and select collection')).not.toBeVisible();

  await expect(page.getByText('Relationship blocks')).not.toBeVisible();
});
