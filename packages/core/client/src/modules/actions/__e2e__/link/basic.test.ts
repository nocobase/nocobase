/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';

test.describe('Link', () => {
  test('basic', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage({
      pageSchema: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Page',
        'x-app-version': '1.0.0-alpha.17',
        properties: {
          hoy3gninc4d: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'page:addBlock',
            'x-app-version': '1.0.0-alpha.17',
            properties: {
              '6q8k2r2zg8b': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Row',
                'x-app-version': '1.0.0-alpha.17',
                properties: {
                  '5pelgrmw1uv': {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-component': 'Grid.Col',
                    'x-app-version': '1.0.0-alpha.17',
                    properties: {
                      jinafp4khmd: {
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
                        'x-app-version': '1.0.0-alpha.17',
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
                            'x-app-version': '1.0.0-alpha.17',
                            'x-uid': '57i5fodavmy',
                            'x-async': false,
                            'x-index': 1,
                          },
                          '1c78hfblr62': {
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
                            'x-app-version': '1.0.0-alpha.17',
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
                                'x-app-version': '1.0.0-alpha.17',
                                properties: {
                                  sq7wrsmu8k6: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-decorator': 'DndContext',
                                    'x-component': 'Space',
                                    'x-component-props': {
                                      split: '|',
                                    },
                                    'x-app-version': '1.0.0-alpha.17',
                                    'x-uid': '9wjvgdr7qlp',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'c2kd07xlalt',
                                'x-async': false,
                                'x-index': 1,
                              },
                              kce2z62jj3e: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'TableV2.Column.Decorator',
                                'x-toolbar': 'TableColumnSchemaToolbar',
                                'x-settings': 'fieldSettings:TableColumn',
                                'x-component': 'TableV2.Column',
                                'x-app-version': '1.0.0-alpha.17',
                                properties: {
                                  id: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    'x-collection-field': 'users.id',
                                    'x-component': 'CollectionField',
                                    'x-component-props': {},
                                    'x-read-pretty': true,
                                    'x-decorator': null,
                                    'x-decorator-props': {
                                      labelStyle: {
                                        display: 'none',
                                      },
                                    },
                                    'x-app-version': '1.0.0-alpha.17',
                                    'x-uid': '5dwr9au92jy',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'd3o6bo2bntr',
                                'x-async': false,
                                'x-index': 2,
                              },
                              cxivkl2pz2e: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'TableV2.Column.Decorator',
                                'x-toolbar': 'TableColumnSchemaToolbar',
                                'x-settings': 'fieldSettings:TableColumn',
                                'x-component': 'TableV2.Column',
                                'x-app-version': '1.0.0-alpha.17',
                                properties: {
                                  username: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    'x-collection-field': 'users.username',
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
                                    'x-app-version': '1.0.0-alpha.17',
                                    'x-uid': '6zd6cdztudd',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'bstw44sol77',
                                'x-async': false,
                                'x-index': 3,
                              },
                            },
                            'x-uid': 'tesn3o6xlvo',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'am04rxkwyrn',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'l6m3f6u2opr',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'tgnms5xwgtj',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'cgq9lp3869e',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'py05yxxke4g',
        'x-async': true,
        'x-index': 1,
      },
    }).waitForInit();
    const users = await mockRecords('users', 2, 0);
    await nocoPage.goto();

    // 1. create a new Link button
    await page.getByRole('button', { name: 'Actions', exact: true }).hover();
    await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-users').hover();
    await page.getByRole('menuitem', { name: 'Link' }).click();

    // 2. config the Link button
    await page.getByLabel('action-Action.Link-Link-customize:link-users-table-0').hover();
    await page.getByRole('button', { name: 'designer-schema-settings-Action.Link-actionSettings:link-users' }).hover();
    await page.getByRole('menuitem', { name: 'Edit link' }).click();
    await page
      .getByLabel('block-item-Variable.TextArea-users-table-URL')
      .getByLabel('textbox')
      .fill(await nocoPage.getUrl());
    await page.getByPlaceholder('Name').fill('id');
    await page.getByLabel('block-item-ArrayItems-users-').getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'Current record right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
    await page.getByRole('button', { name: 'plus Add parameter' }).click();
    await page.getByPlaceholder('Name').nth(1).fill('name');
    await page.getByLabel('variable-button').nth(2).click();
    await page.getByRole('menuitemcheckbox', { name: 'Current record right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Username' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 3. click the Link button then config data scope for the Table block using "URL search params" variable
    await page.getByLabel('action-Action.Link-Link-customize:link-users-table-0').click();
    await page.getByLabel('block-item-CardItem-users-').hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:table-users').hover();
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
    await page.getByTestId('select-filter-operator').click();
    await page.getByRole('option', { name: 'is not' }).click();
    await page.getByLabel('variable-button').click();
    await page.getByRole('menuitemcheckbox', { name: 'URL search params right' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'id', exact: true }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByRole('button', { name: 'nocobase', exact: true })).not.toBeVisible();
    await expect(page.getByRole('button', { name: users[0].username, exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: users[1].username, exact: true })).toBeVisible();

    // 4. click the Link button，check the data of the table block
    await page.getByLabel('action-Action.Link-Link-customize:link-users-table-0').click();
    await expect(page.getByRole('button', { name: users[0].username, exact: true })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'nocobase', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: users[1].username, exact: true })).toBeVisible();
  });
});
