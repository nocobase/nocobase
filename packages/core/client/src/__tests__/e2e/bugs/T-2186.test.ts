import { expect, test } from '@nocobase/test/client';

const config = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      cglzmr757wp: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'BlockInitializers',
        properties: {
          '0r1mwh6fgdj': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              kjjiumynoor: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  qzbbcmvyy7n: {
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
                        properties: {
                          '8yt1cl9miol': {
                            'x-uid': 'pcebb2lm84j',
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            title: '{{ t("Filter") }}',
                            'x-action': 'filter',
                            'x-designer': 'Filter.Action.Designer',
                            'x-component': 'Filter.Action',
                            'x-component-props': {
                              icon: 'FilterOutlined',
                              useProps: '{{ useFilterActionProps }}',
                            },
                            'x-align': 'left',
                            default: {
                              $and: [{}],
                            },
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'sz9p441he7c',
                        'x-async': false,
                        'x-index': 1,
                      },
                      fqmmittx9pb: {
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
                                'x-uid': 'r4m451vcj6l',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'fogxvhca4sg',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': '6ywen03do22',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': '47n8qnj6q20',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'xnc0acxgrxz',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': '5dy05u5q2b2',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'rue5m4yfin6',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': '3xce5ru15d6',
    'x-async': true,
    'x-index': 1,
  },
};

// fix https://nocobase.height.app/T-2186
test('BUG(Filter): the input box displayed should correspond to the field type', async ({ page, mockPage }) => {
  await mockPage(config).goto();

  await page.getByLabel('action-Filter.Action-Filter-filter-users-table').click();
  await page.getByTestId('filter-select-field').getByLabel('Search').click();
  await page.getByRole('menuitemcheckbox', { name: 'ID' }).click();

  // 应该显示数字输入框
  await expect(page.getByRole('spinbutton')).toBeVisible();
});
