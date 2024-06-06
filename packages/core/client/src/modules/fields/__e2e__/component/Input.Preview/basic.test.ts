/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';

const img = 'https://static-docs.nocobase.com/logo-nocobase.png';

test.describe('Input.Preview', () => {
  test('switch to Input.Preview from Input.URL', async ({ page, mockPage }) => {
    await mockPage({
      collections: [
        {
          name: 'general',
          fields: [
            {
              interface: 'url',
              name: 'url',
            },
          ],
        },
      ],
      pageSchema: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Page',
        'x-index': 1,
        properties: {
          '4nbajnebmlr': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'page:addBlock',
            'x-index': 1,
            properties: {
              cf8uh9g697n: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Row',
                'x-app-version': '1.0.0-alpha.17',
                'x-index': 1,
                properties: {
                  '1japwy7nj0k': {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-component': 'Grid.Col',
                    'x-app-version': '1.0.0-alpha.17',
                    'x-index': 1,
                    properties: {
                      ahp6bbaj61t: {
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
                        'x-app-version': '1.0.0-alpha.17',
                        'x-index': 1,
                        properties: {
                          xgf2jpb0mwf: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'FormV2',
                            'x-use-component-props': 'useCreateFormBlockProps',
                            'x-app-version': '1.0.0-alpha.17',
                            'x-index': 1,
                            properties: {
                              grid: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid',
                                'x-initializer': 'form:configureFields',
                                'x-app-version': '1.0.0-alpha.17',
                                'x-index': 1,
                                properties: {
                                  yypv0ey12iv: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Row',
                                    'x-app-version': '1.0.0-alpha.17',
                                    'x-index': 1,
                                    properties: {
                                      '1qgv0svx6i0': {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        'x-component': 'Grid.Col',
                                        'x-app-version': '1.0.0-alpha.17',
                                        'x-index': 1,
                                        properties: {
                                          url: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'string',
                                            'x-toolbar': 'FormItemSchemaToolbar',
                                            'x-settings': 'fieldSettings:FormItem',
                                            'x-component': 'CollectionField',
                                            'x-decorator': 'FormItem',
                                            'x-collection-field': 'general.url',
                                            'x-component-props': {
                                              component: 'Input.URL',
                                            },
                                            'x-app-version': '1.0.0-alpha.17',
                                            'x-index': 1,
                                            'x-uid': '3d99xtkyxa7',
                                            'x-async': false,
                                          },
                                        },
                                        'x-uid': '4qa57usgxfr',
                                        'x-async': false,
                                      },
                                    },
                                    'x-uid': 'c4wm0124cvk',
                                    'x-async': false,
                                  },
                                },
                                'x-uid': 'heykz2e3s19',
                                'x-async': false,
                              },
                              '0tquv59oojr': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-initializer': 'createForm:configureActions',
                                'x-component': 'ActionBar',
                                'x-component-props': {
                                  layout: 'one-column',
                                  style: {
                                    marginTop: 'var(--nb-spacing)',
                                  },
                                },
                                'x-app-version': '1.0.0-alpha.17',
                                'x-index': 2,
                                properties: {
                                  f8subamq3yq: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    title: '{{ t("Submit") }}',
                                    'x-action': 'submit',
                                    'x-component': 'Action',
                                    'x-use-component-props': 'useCreateActionProps',
                                    'x-toolbar': 'ActionSchemaToolbar',
                                    'x-settings': 'actionSettings:createSubmit',
                                    'x-component-props': {
                                      type: 'primary',
                                      htmlType: 'submit',
                                    },
                                    'x-action-settings': {
                                      triggerWorkflows: [],
                                    },
                                    type: 'void',
                                    'x-app-version': '1.0.0-alpha.17',
                                    'x-index': 1,
                                    'x-uid': 'j1h5ugxq7nq',
                                    'x-async': false,
                                  },
                                },
                                'x-uid': '0r2mv62cvio',
                                'x-async': false,
                              },
                            },
                            'x-uid': 'em2t2fhaiw6',
                            'x-async': false,
                          },
                        },
                        'x-uid': 'tpwwr4b5p54',
                        'x-async': false,
                      },
                    },
                    'x-uid': 'aq7yxapodnw',
                    'x-async': false,
                  },
                },
                'x-uid': '1utnt4iy7th',
                'x-async': false,
              },
              dqg82cp57e1: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Row',
                'x-app-version': '1.0.0-alpha.17',
                'x-index': 2,
                properties: {
                  gqlczodkz2b: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-component': 'Grid.Col',
                    'x-app-version': '1.0.0-alpha.17',
                    'x-index': 1,
                    properties: {
                      dlrpbn2z0zb: {
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
                        'x-app-version': '1.0.0-alpha.17',
                        'x-index': 1,
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
                            'x-index': 1,
                            properties: {
                              h38nqwjf1zw: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                title: '{{ t("Refresh") }}',
                                'x-action': 'refresh',
                                'x-component': 'Action',
                                'x-use-component-props': 'useRefreshActionProps',
                                'x-toolbar': 'ActionSchemaToolbar',
                                'x-settings': 'actionSettings:refresh',
                                'x-component-props': {
                                  icon: 'ReloadOutlined',
                                },
                                'x-align': 'right',
                                type: 'void',
                                'x-app-version': '1.0.0-alpha.17',
                                'x-uid': '3ym5qa392m0',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'c6tw6pehj86',
                            'x-async': false,
                          },
                          tvde4dndsqj: {
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
                            'x-index': 2,
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
                                'x-app-version': '1.0.0-alpha.17',
                                'x-index': 1,
                                properties: {
                                  wptjn8efkdq: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-decorator': 'DndContext',
                                    'x-component': 'Space',
                                    'x-component-props': {
                                      split: '|',
                                    },
                                    'x-app-version': '1.0.0-alpha.17',
                                    'x-index': 1,
                                    'x-uid': 'x89784q83t2',
                                    'x-async': false,
                                  },
                                },
                                'x-uid': '1yzn9sblzep',
                                'x-async': false,
                              },
                              raxcojsopou: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'TableV2.Column.Decorator',
                                'x-toolbar': 'TableColumnSchemaToolbar',
                                'x-settings': 'fieldSettings:TableColumn',
                                'x-component': 'TableV2.Column',
                                'x-app-version': '1.0.0-alpha.17',
                                'x-index': 2,
                                properties: {
                                  url: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    'x-collection-field': 'general.url',
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
                                    'x-index': 1,
                                    'x-uid': 'qni0na740t1',
                                    'x-async': false,
                                  },
                                },
                                'x-uid': '5lq7abdz67x',
                                'x-async': false,
                              },
                            },
                            'x-uid': 'zc0cntdtdr4',
                            'x-async': false,
                          },
                        },
                        'x-uid': 'hbmp3k5e1i3',
                        'x-async': false,
                      },
                    },
                    'x-uid': 'jbxa0cnjm1w',
                    'x-async': false,
                  },
                },
                'x-uid': 'yqvfdsci5v8',
                'x-async': false,
              },
            },
            'x-uid': 'a1iy1sw0sus',
            'x-async': false,
          },
        },
        'x-uid': 'v3zv08v0hwn',
        'x-async': true,
      },
    }).goto();

    // 1. 在表单中的 URL 字段中输入图片地址
    await page.getByLabel('block-item-CollectionField-').getByRole('textbox').fill(img);

    // 2. 将组建切换到 Input.Preview
    await page.getByLabel('block-item-CollectionField-').hover();
    await page.getByLabel('designer-schema-settings-CollectionField-fieldSettings:FormItem-general-general').hover();
    await page.getByRole('menuitem', { name: 'Field component URL' }).click();
    await page.getByRole('option', { name: 'Preview' }).click();

    // 3. 图片正常显示
    await expect(page.getByLabel('block-item-CollectionField-').getByRole('img').first()).toHaveAttribute('src', img);
    await expect(page.getByLabel('block-item-CollectionField-').getByRole('img').first()).toHaveJSProperty('width', 24);

    // 4. 切换图片大小到 Large，大小切换正常
    await page.getByLabel('block-item-CollectionField-').hover();
    await page.getByLabel('designer-schema-settings-CollectionField-fieldSettings:FormItem-general-general').hover();
    await page.getByRole('menuitem', { name: 'Size Small' }).click();
    await page.getByRole('option', { name: 'Large' }).click();
    await expect(page.getByLabel('block-item-CollectionField-').getByRole('img').first()).toHaveJSProperty('width', 72);

    // 5. 点击保存按钮，保存成功
    await page.getByLabel('action-Action-Submit-submit-').click();

    // 6. Table 区块中显示图片链接
    await page.getByLabel('action-Action-Refresh-refresh').click();
    await expect(page.getByLabel('block-item-CardItem-general-table').getByRole('link', { name: img })).toBeVisible();

    // 7. 将 Table 中的单元格组建切换到 Input.Preview，应该正常显示图片
    await page
      .getByLabel('block-item-CardItem-general-table')
      .getByRole('button', { name: 'url', exact: true })
      .hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-general' })
      .hover();
    await page.getByRole('menuitem', { name: 'Field component URL' }).click();
    await page.getByRole('option', { name: 'Preview' }).click();
    await expect(
      page.getByLabel('block-item-CardItem-general-table').getByRole('cell').getByRole('img').first(),
    ).toHaveAttribute('src', img);
    await expect(
      page.getByLabel('block-item-CardItem-general-table').getByRole('cell').getByRole('img').first(),
    ).toHaveJSProperty('width', 24);

    // 8. 切换图片大小到 Large，大小切换正常
    await page
      .getByLabel('block-item-CardItem-general-table')
      .getByRole('button', { name: 'url', exact: true })
      .hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-general' })
      .hover();
    await page.getByRole('menuitem', { name: 'Size Small' }).click();
    await page.getByRole('option', { name: 'Large' }).click();
    await expect(
      page.getByLabel('block-item-CardItem-general-table').getByRole('cell').getByRole('img').first(),
    ).toHaveJSProperty('width', 72);
  });
});
