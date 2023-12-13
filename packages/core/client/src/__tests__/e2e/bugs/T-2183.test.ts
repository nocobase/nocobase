import { expect, test } from '@nocobase/test/client';

const config = {
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      '3c1ivjciciu': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'BlockInitializers',
        properties: {
          '1n5r9s23amo': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              bsmuf6ly8b2: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  ppv3te8l7mo: {
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
                          o8wqytvd6as: {
                            'x-uid': '9vghmn6u5eo',
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
                              $and: [],
                            },
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'qq7hs80xlut',
                        'x-async': false,
                        'x-index': 1,
                      },
                      r02zx6qq4ql: {
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
                                'x-uid': '4fcw4u63f3p',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'pxqbve61e9i',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'kta6g2v3m9s',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'yu418id0x3t',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'xrvoeyz6uop',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'u64df000i8u',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'hofapxvp8p7',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'w7nv1c98j2g',
    'x-async': true,
    'x-index': 1,
  },
};

// fix https://nocobase.height.app/T-2183
test('BUG: should save conditions', async ({ page, mockPage }) => {
  await mockPage(config).goto();
  await page.getByLabel('action-Filter.Action-Filter-filter-users-table').click();
  await page.getByText('Add condition', { exact: true }).click();
  await page.getByTestId('select-filter-field').getByLabel('Search').click();
  await page.getByRole('menuitemcheckbox', { name: 'ID' }).click();
  await page.getByRole('button', { name: 'Save conditions' }).click();

  await page.reload();
  await page.getByLabel('action-Filter.Action-Filter-filter-users-table').click();

  // After refreshing the browser, the set field and operator should still be visible
  await expect(page.getByTestId('select-filter-field').getByText('ID')).toBeVisible();
  await expect(page.getByTestId('select-filter-operator').getByText('is')).toBeVisible();
});
