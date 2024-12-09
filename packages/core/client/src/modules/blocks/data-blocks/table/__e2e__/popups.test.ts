/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from '@nocobase/test/e2e';
import { differentURL_DifferentPopupContent } from './templatesOfBug';

test.describe('popup opened by clicking the association field', async () => {
  test('different URL, different popup content', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(differentURL_DifferentPopupContent).waitForInit();
    await mockRecord('users', { roles: [{ name: 'test', title: 'Test' }] });
    await nocoPage.goto();

    await page.getByText('admin').click();
    await expect(page.getByLabel('block-item-CollectionField-')).toHaveText('Role name:Admin');
    const prevURL = page.url();
    await page.goBack();

    await page.getByText('test').click();
    await expect(page.getByLabel('block-item-CollectionField-')).toHaveText('Role name:Test');

    // 通过 URL 打开第一行的弹窗，弹窗中的内容应该是第一行的内容
    await page.goto(prevURL);
    await expect(page.getByLabel('block-item-CollectionField-')).toHaveText('Role name:Admin');
  });

  test('popup configuration should persist across different rows in the same column', async ({
    page,
    mockPage,
    mockRecord,
  }) => {
    const nocoPage = await mockPage({
      pageSchema: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Page',
        properties: {
          rccgypv911m: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'page:addBlock',
            properties: {
              githmw0vywe: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Row',
                'x-app-version': '1.6.0-alpha.3',
                properties: {
                  k76036oekiy: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-component': 'Grid.Col',
                    'x-app-version': '1.6.0-alpha.3',
                    properties: {
                      w6wzrye5ub7: {
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
                        'x-app-version': '1.6.0-alpha.3',
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
                            'x-app-version': '1.6.0-alpha.3',
                            'x-uid': 'cr9fvkuyyq2',
                            'x-async': false,
                            'x-index': 1,
                          },
                          '4c9c8525dks': {
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
                            'x-app-version': '1.6.0-alpha.3',
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
                                'x-app-version': '1.6.0-alpha.3',
                                properties: {
                                  b0umb64pa7m: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-decorator': 'DndContext',
                                    'x-component': 'Space',
                                    'x-component-props': {
                                      split: '|',
                                    },
                                    'x-app-version': '1.6.0-alpha.3',
                                    'x-uid': 'uti3lm42fk5',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'r69a6dptvyb',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'v3yjph96rjs',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': '6nuwmd062mf',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': '4b9z6v33m91',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'wri4ylqnqw3',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': '5e7ud75szwt',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': '38mzn4lv8by',
        'x-async': true,
        'x-index': 1,
      },
    }).waitForInit();
    await mockRecord('users', { roles: [{ name: 'member', title: 'Member' }], nickname: 'test popup' });
    await nocoPage.goto();

    // 1. 新建一个 View 按钮
    await page.getByRole('button', { name: 'Actions', exact: true }).hover();
    await page.getByLabel('designer-schema-initializer-TableV2.Column-fieldSettings:TableColumn-users').hover();
    await page.getByRole('menuitem', { name: 'View' }).click();

    // 2. 点击第一行的 View 按钮，打开弹窗，然后增加一个 Markdown 区块
    await page.getByLabel('action-Action.Link-View-view-users-table-0').click();
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'form Markdown' }).click();
    await expect(page.getByLabel('block-item-Markdown.Void-')).toBeVisible();

    // 3. 关闭弹窗，然后点击第二行的 View 按钮，打开弹窗，弹窗中的 Markdown 区块应该和第一行的一样
    await page.getByLabel('drawer-Action.Container-users-View record-mask').click();
    await page.getByLabel('action-Action.Link-View-view-users-table-1').click();
    await expect(page.getByLabel('block-item-Markdown.Void-')).toBeVisible();

    // 4. 关闭弹窗，然后再点击第一行的 View 按钮，打开弹窗，弹窗中的 Markdown 区块依然存在
    await page.getByLabel('drawer-Action.Container-users-View record-mask').click();
    await page.getByLabel('action-Action.Link-View-view-users-table-0').click();
    await expect(page.getByLabel('block-item-Markdown.Void-')).toBeVisible();
    await page.getByLabel('drawer-Action.Container-users-View record-mask').click();

    // -----------------------------------------------------------------------------------------

    // 1. 新建一个关系字段（Roles）
    await page.getByLabel('schema-initializer-TableV2-').hover();
    await page.getByRole('menuitem', { name: 'Roles' }).click();
    await page.mouse.move(300, 0);

    // 2. 点击第一行的 Roles 字段，打开弹窗，然后增加一个 Markdown 区块
    await page.getByText('root').click();
    await page.getByLabel('schema-initializer-Grid-popup').click();
    await page.getByRole('menuitem', { name: 'form Markdown' }).click();
    await expect(page.getByLabel('block-item-Markdown.Void-')).toBeVisible();

    // 3. 关闭弹窗，然后点击第二行的 Roles 字段，打开弹窗，弹窗中的 Markdown 区块应该和第一行的一样
    await page.getByLabel('drawer-AssociationField.Viewer-roles-View record-mask').click();
    await page.getByText('member').nth(1).click();
    await expect(page.getByLabel('block-item-Markdown.Void-')).toBeVisible();

    // 4. 关闭弹窗，然后再点击第一行的 Roles 字段，打开弹窗，弹窗中的 Markdown 区块依然存在
    await page.getByLabel('drawer-AssociationField.Viewer-roles-View record-mask').click();
    await page.getByText('root').click();
    await expect(page.getByLabel('block-item-Markdown.Void-')).toBeVisible();
    await page.getByLabel('drawer-AssociationField.Viewer-roles-View record-mask').click();

    // ---------------------------------------------------------------------------------------------------

    // 1. 新建一个单行文本字段（nickname），并开启 Enable link
    await page.getByLabel('schema-initializer-TableV2-').hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await page.mouse.move(300, 0);
    // 开启 Enable link
    await page.getByRole('button', { name: 'Nickname' }).hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-users' })
      .hover();
    await page.getByRole('menuitem', { name: 'Enable link' }).click();
    await page.mouse.move(300, 0);

    // 2. 点击第一行的 nickname 字段，打开弹窗，然后增加一个 Markdown 区块
    await page.getByRole('button', { name: 'Super Admin' }).locator('a').click();
    await page.getByLabel('schema-initializer-Grid-popup').click();
    await page.getByRole('menuitem', { name: 'form Markdown' }).click();
    await expect(page.getByLabel('block-item-Markdown.Void-')).toBeVisible();

    // 3. 关闭弹窗，然后点击第二行的 nickname 字段，打开弹窗，弹窗中的 Markdown 区块应该和第一行的一样
    await page.getByLabel('drawer-Action.Container-users-View record-mask').click();
    await page.getByRole('button', { name: 'test popup' }).locator('a').click();
    await expect(page.getByLabel('block-item-Markdown.Void-')).toBeVisible();

    // 4. 关闭弹窗，然后再点击第一行的 nickname 字段，打开弹窗，弹窗中的 Markdown 区块依然存在
    await page.getByLabel('drawer-Action.Container-users-View record-mask').click();
    await page.getByRole('button', { name: 'Super Admin' }).locator('a').click();
    await expect(page.getByLabel('block-item-Markdown.Void-')).toBeVisible();
    await page.getByLabel('drawer-Action.Container-users-View record-mask').click();
  });
});
