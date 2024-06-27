/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  Page,
  expect,
  expectSettingsMenu,
  expectSupportedVariables,
  oneEmptyTableBlockWithActions,
  oneEmptyTableWithTreeCollection,
  oneTableBlockWithAddNewAndViewAndEditAndBasicFields,
  test,
} from '@nocobase/test/e2e';
import { T3843, oneTableWithColumnFixed, oneTableWithUpdateRecord } from './templatesOfBug';

const addSomeCustomActions = async (page: Page) => {
  // 先删除掉之前的 actions
  const deleteAction = async (name: string) => {
    await page.getByLabel(`action-Action.Link-${name}-`).hover();
    await page.getByRole('button', { name: 'designer-schema-settings-Action.Link-Action.Designer-general' }).hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
  };

  await deleteAction('View');
  await deleteAction('Edit');
  await deleteAction('Delete');
  await deleteAction('Duplicate');

  // 再增加两个自定义的 actions
  await page.getByRole('button', { name: 'Actions', exact: true }).hover();
  await page.getByLabel('designer-schema-initializer-TableV2.Column-TableV2.ActionColumnDesigner-general').hover();
  await page.getByRole('menuitem', { name: 'Popup' }).click();

  await page.getByRole('button', { name: 'Actions', exact: true }).hover();
  await page.getByLabel('designer-schema-initializer-TableV2.Column-TableV2.ActionColumnDesigner-general').hover();
  await page.getByRole('menuitem', { name: 'Update record' }).click();
};

test.describe('actions schema settings', () => {
  test.describe('add new', () => {
    const showMenu = async (page: Page) => {
      await page.getByRole('button', { name: 'Add new' }).hover();
      await page.getByRole('button', { name: 'designer-schema-settings-Action-Action.Designer-general' }).hover();
    };

    test('supported options', async ({ page, mockPage, mockRecord }) => {
      await mockPage(oneEmptyTableBlockWithActions).goto();

      await expectSettingsMenu({
        page,
        showMenu: () => showMenu(page),
        supportedOptions: ['Edit button', 'Open mode', 'Popup size', 'Delete'],
      });
    });

    test('edit button', async ({ page, mockPage, mockRecord }) => {
      await mockPage(oneEmptyTableBlockWithActions).goto();

      await showMenu(page);
      await page.getByRole('menuitem', { name: 'Edit button' }).click();
      await page.getByLabel('block-item-Input-general-').getByRole('textbox').click();
      await page.getByLabel('block-item-Input-general-').getByRole('textbox').fill('1234');
      await page.getByRole('button', { name: 'OK', exact: true }).click();

      await expect(page.getByRole('button', { name: '1234' })).toBeVisible();
    });

    test('open mode', async ({ page, mockPage, mockRecord }) => {
      await mockPage(oneEmptyTableBlockWithActions).goto();
      await showMenu(page);

      // 默认是 drawer
      await expect(page.getByRole('menuitem', { name: 'Open mode' }).getByText('Drawer')).toBeVisible();

      // 切换为 dialog
      await page.getByRole('menuitem', { name: 'Open mode' }).click();
      await page.getByRole('option', { name: 'Dialog' }).click();

      await page.getByRole('button', { name: 'Add new' }).click();
      await expect(page.getByTestId('modal-Action.Container-general-Add record')).toBeVisible();
      await page.getByLabel('modal-Action.Container-general-Add record-mask').click();

      // 切换为 page
      await page.getByLabel('action-Action-Add new-create-').hover();
      await page.getByRole('button', { name: 'designer-schema-settings-Action-Action.Designer-general' }).hover();
      await page.getByRole('menuitem', { name: 'Open mode Dialog' }).click();
      await page.getByRole('option', { name: 'Page' }).click();

      // 点击按钮后会跳转到一个页面
      await page.getByLabel('action-Action-Add new-create-').click();
      expect(page.url()).toContain('/subpages/');

      // 配置出一个表单
      await page.getByLabel('schema-initializer-Grid-popup').hover();
      await page.getByRole('menuitem', { name: 'form Form right' }).hover();
      await page.getByRole('menuitem', { name: 'Current collection' }).click();

      await page.getByLabel('schema-initializer-Grid-form:').hover();
      await page.getByRole('menuitem', { name: 'Single select' }).click();
      await page.mouse.move(300, 0);

      await page.getByLabel('schema-initializer-ActionBar-').hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();

      // 创建一条数据后返回，列表中应该有这条数据
      await page.getByTestId('select-single').click();
      await page.getByRole('option', { name: 'option3' }).click();

      await page.getByLabel('action-Action-Submit-submit-').click();

      await page.goBack();

      await page.getByLabel('schema-initializer-TableV2-').hover();
      await page.getByRole('menuitem', { name: 'Single select' }).click();
      await page.mouse.move(300, 0);
      await expect(page.getByRole('button', { name: 'option3' })).toHaveCount(1);
    });

    test('popup size', async ({ page, mockPage, mockRecord }) => {
      await mockPage(oneEmptyTableBlockWithActions).goto();

      await showMenu(page);
      // 默认值 middle
      await expect(page.getByRole('menuitem', { name: 'Popup size' }).getByText('Middle')).toBeVisible();

      // 切换为 small
      await page.getByRole('menuitem', { name: 'Popup size' }).click();
      await page.getByRole('option', { name: 'Small' }).click();

      await page.getByRole('button', { name: 'Add new' }).click();
      const drawerWidth =
        (await page.getByTestId('drawer-Action.Container-general-Add record').boundingBox())?.width || 0;
      expect(drawerWidth).toBeLessThanOrEqual(400);

      await page.getByLabel('drawer-Action.Container-general-Add record-mask').click();

      // 切换为 large
      await showMenu(page);
      await page.getByRole('menuitem', { name: 'Popup size' }).click();
      await page.getByRole('option', { name: 'Large' }).click();

      await page.getByRole('button', { name: 'Add new' }).click();
      const drawerWidth2 =
        (await page.getByTestId('drawer-Action.Container-general-Add record').boundingBox())?.width || 0;
      expect(drawerWidth2).toBeGreaterThanOrEqual(800);
    });

    test('delete', async ({ page, mockPage, mockRecord }) => {
      await mockPage(oneEmptyTableBlockWithActions).goto();

      await showMenu(page);
      await page.getByRole('menuitem', { name: 'Delete' }).click();
      await page.mouse.move(300, 0);
      await page.getByRole('button', { name: 'OK', exact: true }).click();

      await expect(page.getByRole('button', { name: 'Add new' })).toBeHidden();
    });
  });

  test.describe('bulk delete', () => {
    test('supported options', async ({ page, mockPage }) => {
      await mockPage(oneEmptyTableBlockWithActions).goto();

      await expectSettingsMenu({
        page,
        showMenu: async () => {
          await page.getByRole('button', { name: 'Delete' }).hover();
          await page.getByRole('button', { name: 'designer-schema-settings-Action-Action.Designer-general' }).hover();
        },
        supportedOptions: ['Edit button', 'Delete'],
      });
    });
  });

  test.describe('filter', () => {
    const showMenu = async (page: Page) => {
      await page.getByRole('button', { name: 'Filter' }).hover();
      await page.getByLabel('designer-schema-settings-Filter.Action-Filter.Action.Designer-general').hover();
    };

    test('supported options', async ({ page, mockPage, mockRecord }) => {
      await mockPage(oneEmptyTableBlockWithActions).goto();

      await expectSettingsMenu({
        page,
        showMenu: () => showMenu(page),
        supportedOptions: [
          'Edit button',
          'Delete',
          'Many to one',
          'One to many',
          'Single select',
          'ID',
          'Created at',
          'Last updated at',
          'Created by',
          'Last updated by',
        ],
      });
    });
  });

  test.describe('delete', () => {
    const showMenu = async (page: Page) => {
      await page.getByLabel('action-Action.Link-Delete-destroy-general-table-0').hover();
      await page.getByRole('button', { name: 'designer-schema-settings-Action.Link-Action.Designer-general' }).hover();
    };

    test('supported options', async ({ page, mockPage, mockRecord }) => {
      const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
      await mockRecord('general');
      await nocoPage.goto();

      await expectSettingsMenu({
        page,
        showMenu: () => showMenu(page),
        supportedOptions: ['Edit button', 'Linkage rules', 'Delete'],
      });
    });

    test('edit button', async ({ page, mockPage, mockRecord }) => {
      const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
      await mockRecord('general');
      await nocoPage.goto();

      await showMenu(page);
      await page.getByRole('menuitem', { name: 'Edit button' }).click();
      await page.getByLabel('block-item-Input-general-').getByRole('textbox').click();
      await page.getByLabel('block-item-Input-general-').getByRole('textbox').fill('Delete record');
      await page.getByRole('button', { name: 'OK', exact: true }).click();

      await expect(page.getByLabel('action-Action.Link-Delete record-destroy-general-table-0')).toBeVisible();
    });
  });

  test.describe('edit', () => {
    const showMenu = async (page: Page) => {
      await page.getByLabel('action-Action.Link-Edit-update-general-table-0').hover();
      await page.getByRole('button', { name: 'designer-schema-settings-Action.Link-Action.Designer-general' }).hover();
    };

    test('supported options', async ({ page, mockPage, mockRecord }) => {
      const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
      await mockRecord('general');
      await nocoPage.goto();

      await expectSettingsMenu({
        page,
        showMenu: () => showMenu(page),
        supportedOptions: ['Edit button', 'Linkage rules', 'Open mode', 'Popup size', 'Delete'],
      });
    });
  });

  test.describe('refresh', () => {
    test('supported options', async ({ page, mockPage }) => {
      await mockPage(oneEmptyTableBlockWithActions).goto();

      await expectSettingsMenu({
        page,
        showMenu: async () => {
          await page.getByRole('button', { name: 'Refresh' }).hover();
          await page.getByRole('button', { name: 'designer-schema-settings-Action-Action.Designer-general' }).hover();
        },
        supportedOptions: ['Edit button', 'Delete'],
      });
    });
  });

  test.describe('view', () => {
    const showMenu = async (page: Page) => {
      await page.getByLabel('action-Action.Link-View-view-general-table-0').hover();
      await page.getByRole('button', { name: 'designer-schema-settings-Action.Link-Action.Designer-general' }).hover();
    };

    test('supported options', async ({ page, mockPage, mockRecord }) => {
      const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
      await mockRecord('general');
      await nocoPage.goto();

      await expectSettingsMenu({
        page,
        showMenu: () => showMenu(page),
        supportedOptions: ['Edit button', 'Linkage rules', 'Open mode', 'Popup size', 'Delete'],
      });
    });

    test('linkage rules', async ({ page, mockPage, mockRecord }) => {
      const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
      await mockRecord('general');
      await nocoPage.goto();

      const openLinkageRules = async () => {
        await page.getByLabel('action-Action.Link-View record-view-general-table-0').hover();
        await page
          .getByRole('button', { name: 'designer-schema-settings-Action.Link-Action.Designer-general' })
          .hover();
        await page.getByRole('menuitem', { name: 'Linkage rules' }).click();
      };

      // 设置第一组规则 --------------------------------------------------------------------------
      await openLinkageRules();
      await page.getByRole('button', { name: 'plus Add linkage rule' }).click();

      // 添加一个条件：ID 等于 1
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('select-filter-field').click();
      await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
      await page.getByRole('spinbutton').click();
      await page.getByRole('spinbutton').fill('1');

      // action: 禁用按钮
      await page.getByText('Add property').click();
      await page.getByLabel('block-item-ArrayCollapse-general').click();
      await page.getByTestId('select-linkage-properties').click();
      await page.getByRole('option', { name: 'Disabled' }).click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();

      await expect(page.getByLabel('action-Action.Link-View record-view-general-table-0')).toHaveAttribute(
        'disabled',
        '',
      );

      // 设置第二组规则 --------------------------------------------------------------------------
      await openLinkageRules();
      await page.getByRole('button', { name: 'plus Add linkage rule' }).click();
      await page.locator('.ant-collapse-header').nth(1).getByRole('img', { name: 'right' }).click();

      // 添加一个条件：ID 等于 1
      await page.getByRole('tabpanel').getByText('Add condition', { exact: true }).click();
      await page.getByRole('button', { name: 'Select field' }).click();
      await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
      await page.getByRole('spinbutton').click();
      await page.getByRole('spinbutton').fill('1');

      // action: 使按钮可用
      await page.getByRole('tabpanel').getByText('Add property').click();
      await page.locator('.ant-select', { hasText: 'action' }).click();
      await page.getByRole('option', { name: 'Enabled' }).click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();

      // 后面的 action 会覆盖前面的
      await expect(page.getByLabel('action-Action.Link-View record-view-general-table-0')).not.toHaveAttribute(
        'disabled',
        '',
      );
    });

    test('open mode: page', async ({ page, mockPage, mockRecord }) => {
      await mockPage({
        pageSchema: {
          _isJSONSchemaObject: true,
          version: '2.0',
          type: 'void',
          'x-component': 'Page',
          properties: {
            '4hkzwf7xiwx': {
              _isJSONSchemaObject: true,
              version: '2.0',
              type: 'void',
              'x-component': 'Grid',
              'x-initializer': 'page:addBlock',
              properties: {
                '8876jkmbc0j': {
                  _isJSONSchemaObject: true,
                  version: '2.0',
                  type: 'void',
                  'x-component': 'Grid.Row',
                  'x-app-version': '1.2.8-alpha',
                  properties: {
                    '8hg0vhy0tz0': {
                      _isJSONSchemaObject: true,
                      version: '2.0',
                      type: 'void',
                      'x-component': 'Grid.Col',
                      'x-app-version': '1.2.8-alpha',
                      properties: {
                        ejbnvzcacpb: {
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
                          'x-app-version': '1.2.8-alpha',
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
                              'x-app-version': '1.2.8-alpha',
                              'x-uid': 'hb16vet3e9h',
                              'x-async': false,
                              'x-index': 1,
                            },
                            b1fkx7l3lqk: {
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
                              'x-app-version': '1.2.8-alpha',
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
                                  'x-app-version': '1.2.8-alpha',
                                  properties: {
                                    '9d3q7flbesh': {
                                      _isJSONSchemaObject: true,
                                      version: '2.0',
                                      type: 'void',
                                      'x-decorator': 'DndContext',
                                      'x-component': 'Space',
                                      'x-component-props': {
                                        split: '|',
                                      },
                                      'x-app-version': '1.2.8-alpha',
                                      properties: {
                                        md90hk6dgga: {
                                          'x-uid': 'ud03p691p2i',
                                          _isJSONSchemaObject: true,
                                          version: '2.0',
                                          type: 'void',
                                          title: 'View record',
                                          'x-action': 'view',
                                          'x-toolbar': 'ActionSchemaToolbar',
                                          'x-settings': 'actionSettings:view',
                                          'x-component': 'Action.Link',
                                          'x-component-props': {
                                            openMode: 'drawer',
                                            iconColor: '#1677FF',
                                            danger: false,
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
                                                  'x-initializer': 'popup:addTab',
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
                                                          'x-initializer': 'popup:common:addBlock',
                                                          properties: {
                                                            sl3cha2cvm9: {
                                                              _isJSONSchemaObject: true,
                                                              version: '2.0',
                                                              type: 'void',
                                                              'x-component': 'Grid.Row',
                                                              'x-app-version': '1.2.8-alpha',
                                                              properties: {
                                                                efcxs5deb11: {
                                                                  _isJSONSchemaObject: true,
                                                                  version: '2.0',
                                                                  type: 'void',
                                                                  'x-component': 'Grid.Col',
                                                                  'x-app-version': '1.2.8-alpha',
                                                                  properties: {
                                                                    cq3c4x58uv8: {
                                                                      'x-uid': '48ndgvjusx0',
                                                                      _isJSONSchemaObject: true,
                                                                      version: '2.0',
                                                                      type: 'void',
                                                                      'x-acl-action': 'users:get',
                                                                      'x-decorator': 'DetailsBlockProvider',
                                                                      'x-use-decorator-props':
                                                                        'useDetailsDecoratorProps',
                                                                      'x-decorator-props': {
                                                                        dataSource: 'main',
                                                                        collection: 'users',
                                                                        readPretty: true,
                                                                        action: 'get',
                                                                      },
                                                                      'x-toolbar': 'BlockSchemaToolbar',
                                                                      'x-settings': 'blockSettings:details',
                                                                      'x-component': 'CardItem',
                                                                      'x-app-version': '1.2.8-alpha',
                                                                      'x-component-props': {
                                                                        title: 'Details',
                                                                      },
                                                                      properties: {
                                                                        qzudlhn0oci: {
                                                                          _isJSONSchemaObject: true,
                                                                          version: '2.0',
                                                                          type: 'void',
                                                                          'x-component': 'Details',
                                                                          'x-read-pretty': true,
                                                                          'x-use-component-props': 'useDetailsProps',
                                                                          'x-app-version': '1.2.8-alpha',
                                                                          properties: {
                                                                            hhuvprt9qkx: {
                                                                              _isJSONSchemaObject: true,
                                                                              version: '2.0',
                                                                              type: 'void',
                                                                              'x-initializer':
                                                                                'details:configureActions',
                                                                              'x-component': 'ActionBar',
                                                                              'x-component-props': {
                                                                                style: {
                                                                                  marginBottom: 24,
                                                                                },
                                                                              },
                                                                              'x-app-version': '1.2.8-alpha',
                                                                              'x-uid': 't532hppuhhd',
                                                                              'x-async': false,
                                                                              'x-index': 1,
                                                                            },
                                                                            grid: {
                                                                              _isJSONSchemaObject: true,
                                                                              version: '2.0',
                                                                              type: 'void',
                                                                              'x-component': 'Grid',
                                                                              'x-initializer':
                                                                                'details:configureFields',
                                                                              'x-app-version': '1.2.8-alpha',
                                                                              properties: {
                                                                                rcqh876sdp3: {
                                                                                  _isJSONSchemaObject: true,
                                                                                  version: '2.0',
                                                                                  type: 'void',
                                                                                  'x-component': 'Grid.Row',
                                                                                  'x-app-version': '1.2.8-alpha',
                                                                                  properties: {
                                                                                    '399yhxj2n3k': {
                                                                                      _isJSONSchemaObject: true,
                                                                                      version: '2.0',
                                                                                      type: 'void',
                                                                                      'x-component': 'Grid.Col',
                                                                                      'x-app-version': '1.2.8-alpha',
                                                                                      properties: {
                                                                                        nickname: {
                                                                                          _isJSONSchemaObject: true,
                                                                                          version: '2.0',
                                                                                          type: 'string',
                                                                                          'x-toolbar':
                                                                                            'FormItemSchemaToolbar',
                                                                                          'x-settings':
                                                                                            'fieldSettings:FormItem',
                                                                                          'x-component':
                                                                                            'CollectionField',
                                                                                          'x-decorator': 'FormItem',
                                                                                          'x-collection-field':
                                                                                            'users.nickname',
                                                                                          'x-component-props': {},
                                                                                          'x-app-version':
                                                                                            '1.2.8-alpha',
                                                                                          'x-uid': '0jxfoc7hndh',
                                                                                          'x-async': false,
                                                                                          'x-index': 1,
                                                                                        },
                                                                                      },
                                                                                      'x-uid': '4qljzi4ndyv',
                                                                                      'x-async': false,
                                                                                      'x-index': 1,
                                                                                    },
                                                                                  },
                                                                                  'x-uid': 'ne81cyfsbjb',
                                                                                  'x-async': false,
                                                                                  'x-index': 1,
                                                                                },
                                                                              },
                                                                              'x-uid': 'hk6i6c12h3i',
                                                                              'x-async': false,
                                                                              'x-index': 2,
                                                                            },
                                                                          },
                                                                          'x-uid': 'ztg6637y1ne',
                                                                          'x-async': false,
                                                                          'x-index': 1,
                                                                        },
                                                                      },
                                                                      'x-async': false,
                                                                      'x-index': 1,
                                                                    },
                                                                  },
                                                                  'x-uid': '9adrj3pcevi',
                                                                  'x-async': false,
                                                                  'x-index': 1,
                                                                },
                                                              },
                                                              'x-uid': 'cl10ahmo9by',
                                                              'x-async': false,
                                                              'x-index': 1,
                                                            },
                                                            ldd6v9tyucb: {
                                                              _isJSONSchemaObject: true,
                                                              version: '2.0',
                                                              type: 'void',
                                                              'x-component': 'Grid.Row',
                                                              'x-app-version': '1.2.8-alpha',
                                                              properties: {
                                                                pstw5adsq5o: {
                                                                  _isJSONSchemaObject: true,
                                                                  version: '2.0',
                                                                  type: 'void',
                                                                  'x-component': 'Grid.Col',
                                                                  'x-app-version': '1.2.8-alpha',
                                                                  properties: {
                                                                    zz234wka6vz: {
                                                                      'x-uid': 'te1we7isnhz',
                                                                      _isJSONSchemaObject: true,
                                                                      version: '2.0',
                                                                      type: 'void',
                                                                      'x-acl-action': 'users.roles:view',
                                                                      'x-decorator': 'DetailsBlockProvider',
                                                                      'x-use-decorator-props':
                                                                        'useDetailsWithPaginationDecoratorProps',
                                                                      'x-decorator-props': {
                                                                        dataSource: 'main',
                                                                        association: 'users.roles',
                                                                        readPretty: true,
                                                                        action: 'list',
                                                                        params: {
                                                                          pageSize: 1,
                                                                        },
                                                                      },
                                                                      'x-toolbar': 'BlockSchemaToolbar',
                                                                      'x-settings':
                                                                        'blockSettings:detailsWithPagination',
                                                                      'x-component': 'CardItem',
                                                                      'x-app-version': '1.2.8-alpha',
                                                                      'x-component-props': {
                                                                        title: 'Association block',
                                                                      },
                                                                      properties: {
                                                                        l9udri1zsv7: {
                                                                          _isJSONSchemaObject: true,
                                                                          version: '2.0',
                                                                          type: 'void',
                                                                          'x-component': 'Details',
                                                                          'x-read-pretty': true,
                                                                          'x-use-component-props':
                                                                            'useDetailsWithPaginationProps',
                                                                          'x-app-version': '1.2.8-alpha',
                                                                          properties: {
                                                                            grvze9sdawq: {
                                                                              _isJSONSchemaObject: true,
                                                                              version: '2.0',
                                                                              type: 'void',
                                                                              'x-initializer':
                                                                                'details:configureActions',
                                                                              'x-component': 'ActionBar',
                                                                              'x-component-props': {
                                                                                style: {
                                                                                  marginBottom: 24,
                                                                                },
                                                                              },
                                                                              'x-app-version': '1.2.8-alpha',
                                                                              'x-uid': 'wk0gfg70k0c',
                                                                              'x-async': false,
                                                                              'x-index': 1,
                                                                            },
                                                                            grid: {
                                                                              _isJSONSchemaObject: true,
                                                                              version: '2.0',
                                                                              type: 'void',
                                                                              'x-component': 'Grid',
                                                                              'x-initializer':
                                                                                'details:configureFields',
                                                                              'x-app-version': '1.2.8-alpha',
                                                                              properties: {
                                                                                v8bvtnoja3x: {
                                                                                  _isJSONSchemaObject: true,
                                                                                  version: '2.0',
                                                                                  type: 'void',
                                                                                  'x-component': 'Grid.Row',
                                                                                  'x-app-version': '1.2.8-alpha',
                                                                                  properties: {
                                                                                    e2vli230fql: {
                                                                                      _isJSONSchemaObject: true,
                                                                                      version: '2.0',
                                                                                      type: 'void',
                                                                                      'x-component': 'Grid.Col',
                                                                                      'x-app-version': '1.2.8-alpha',
                                                                                      properties: {
                                                                                        name: {
                                                                                          _isJSONSchemaObject: true,
                                                                                          version: '2.0',
                                                                                          type: 'string',
                                                                                          'x-toolbar':
                                                                                            'FormItemSchemaToolbar',
                                                                                          'x-settings':
                                                                                            'fieldSettings:FormItem',
                                                                                          'x-component':
                                                                                            'CollectionField',
                                                                                          'x-decorator': 'FormItem',
                                                                                          'x-collection-field':
                                                                                            'roles.name',
                                                                                          'x-component-props': {},
                                                                                          'x-app-version':
                                                                                            '1.2.8-alpha',
                                                                                          'x-uid': 'leeamsjfgqn',
                                                                                          'x-async': false,
                                                                                          'x-index': 1,
                                                                                        },
                                                                                      },
                                                                                      'x-uid': 'usgby9v925w',
                                                                                      'x-async': false,
                                                                                      'x-index': 1,
                                                                                    },
                                                                                  },
                                                                                  'x-uid': '69c6wchsh5b',
                                                                                  'x-async': false,
                                                                                  'x-index': 1,
                                                                                },
                                                                              },
                                                                              'x-uid': 'cfbf2ty6rhz',
                                                                              'x-async': false,
                                                                              'x-index': 2,
                                                                            },
                                                                            pagination: {
                                                                              _isJSONSchemaObject: true,
                                                                              version: '2.0',
                                                                              type: 'void',
                                                                              'x-component': 'Pagination',
                                                                              'x-use-component-props':
                                                                                'useDetailsPaginationProps',
                                                                              'x-app-version': '1.2.8-alpha',
                                                                              'x-uid': 'ap394y0ezco',
                                                                              'x-async': false,
                                                                              'x-index': 3,
                                                                            },
                                                                          },
                                                                          'x-uid': 'g7bo1djalz6',
                                                                          'x-async': false,
                                                                          'x-index': 1,
                                                                        },
                                                                      },
                                                                      'x-async': false,
                                                                      'x-index': 1,
                                                                    },
                                                                  },
                                                                  'x-uid': 'p6pjlaeabar',
                                                                  'x-async': false,
                                                                  'x-index': 1,
                                                                },
                                                              },
                                                              'x-uid': 'vt1zgkhdrl8',
                                                              'x-async': false,
                                                              'x-index': 2,
                                                            },
                                                            row_e36fkny8odp: {
                                                              _isJSONSchemaObject: true,
                                                              version: '2.0',
                                                              type: 'void',
                                                              'x-component': 'Grid.Row',
                                                              'x-index': 3,
                                                              properties: {
                                                                qmc56j0ey82: {
                                                                  _isJSONSchemaObject: true,
                                                                  version: '2.0',
                                                                  type: 'void',
                                                                  'x-component': 'Grid.Col',
                                                                  properties: {
                                                                    xkykwl13upy: {
                                                                      'x-uid': 'witajgm9436',
                                                                      _isJSONSchemaObject: true,
                                                                      version: '2.0',
                                                                      type: 'void',
                                                                      'x-settings': 'blockSettings:markdown',
                                                                      'x-decorator': 'CardItem',
                                                                      'x-decorator-props': {
                                                                        name: 'markdown',
                                                                      },
                                                                      'x-component': 'Markdown.Void',
                                                                      'x-editable': false,
                                                                      'x-component-props': {
                                                                        content:
                                                                          '--- \n\nThe following blocks all use variables.',
                                                                      },
                                                                      'x-app-version': '1.2.8-alpha',
                                                                      'x-async': false,
                                                                      'x-index': 1,
                                                                    },
                                                                  },
                                                                  'x-uid': 'u9slxyqyjva',
                                                                  'x-async': false,
                                                                  'x-index': 1,
                                                                },
                                                              },
                                                              'x-uid': 'c15ckwf9bfh',
                                                              'x-async': false,
                                                            },
                                                            '7ek9blpx7sw': {
                                                              _isJSONSchemaObject: true,
                                                              version: '2.0',
                                                              type: 'void',
                                                              'x-component': 'Grid.Row',
                                                              'x-app-version': '1.2.8-alpha',
                                                              properties: {
                                                                s3djmoa1kdm: {
                                                                  _isJSONSchemaObject: true,
                                                                  version: '2.0',
                                                                  type: 'void',
                                                                  'x-component': 'Grid.Col',
                                                                  'x-app-version': '1.2.8-alpha',
                                                                  properties: {
                                                                    t4yomnfik7v: {
                                                                      'x-uid': '2ntepquubp8',
                                                                      _isJSONSchemaObject: true,
                                                                      version: '2.0',
                                                                      type: 'void',
                                                                      'x-acl-action-props': {
                                                                        skipScopeCheck: true,
                                                                      },
                                                                      'x-acl-action': 'users.roles:create',
                                                                      'x-decorator': 'FormBlockProvider',
                                                                      'x-use-decorator-props':
                                                                        'useCreateFormBlockDecoratorProps',
                                                                      'x-decorator-props': {
                                                                        dataSource: 'main',
                                                                        association: 'users.roles',
                                                                      },
                                                                      'x-toolbar': 'BlockSchemaToolbar',
                                                                      'x-settings': 'blockSettings:createForm',
                                                                      'x-component': 'CardItem',
                                                                      'x-app-version': '1.2.8-alpha',
                                                                      'x-component-props': {
                                                                        title: 'Variable: Current role',
                                                                      },
                                                                      properties: {
                                                                        gpegyxxlg9s: {
                                                                          _isJSONSchemaObject: true,
                                                                          version: '2.0',
                                                                          type: 'void',
                                                                          'x-component': 'FormV2',
                                                                          'x-use-component-props':
                                                                            'useCreateFormBlockProps',
                                                                          'x-app-version': '1.2.8-alpha',
                                                                          properties: {
                                                                            grid: {
                                                                              _isJSONSchemaObject: true,
                                                                              version: '2.0',
                                                                              type: 'void',
                                                                              'x-component': 'Grid',
                                                                              'x-initializer': 'form:configureFields',
                                                                              'x-app-version': '1.2.8-alpha',
                                                                              properties: {
                                                                                '8rcj0xfttuu': {
                                                                                  _isJSONSchemaObject: true,
                                                                                  version: '2.0',
                                                                                  type: 'void',
                                                                                  'x-component': 'Grid.Row',
                                                                                  'x-app-version': '1.2.8-alpha',
                                                                                  properties: {
                                                                                    '0v4kqye0ibq': {
                                                                                      _isJSONSchemaObject: true,
                                                                                      version: '2.0',
                                                                                      type: 'void',
                                                                                      'x-component': 'Grid.Col',
                                                                                      'x-app-version': '1.2.8-alpha',
                                                                                      properties: {
                                                                                        title: {
                                                                                          'x-uid': 'u2s2tzdej9l',
                                                                                          _isJSONSchemaObject: true,
                                                                                          version: '2.0',
                                                                                          type: 'string',
                                                                                          'x-toolbar':
                                                                                            'FormItemSchemaToolbar',
                                                                                          'x-settings':
                                                                                            'fieldSettings:FormItem',
                                                                                          'x-component':
                                                                                            'CollectionField',
                                                                                          'x-decorator': 'FormItem',
                                                                                          'x-collection-field':
                                                                                            'roles.title',
                                                                                          'x-component-props': {},
                                                                                          'x-app-version':
                                                                                            '1.2.8-alpha',
                                                                                          default: '{{$nRole}}',
                                                                                          'x-async': false,
                                                                                          'x-index': 1,
                                                                                        },
                                                                                      },
                                                                                      'x-uid': 'jjw69unhi73',
                                                                                      'x-async': false,
                                                                                      'x-index': 1,
                                                                                    },
                                                                                  },
                                                                                  'x-uid': 'dos9kkrtudw',
                                                                                  'x-async': false,
                                                                                  'x-index': 1,
                                                                                },
                                                                              },
                                                                              'x-uid': '87bd6es8q0u',
                                                                              'x-async': false,
                                                                              'x-index': 1,
                                                                            },
                                                                            '27pckgxgpfj': {
                                                                              _isJSONSchemaObject: true,
                                                                              version: '2.0',
                                                                              type: 'void',
                                                                              'x-initializer':
                                                                                'createForm:configureActions',
                                                                              'x-component': 'ActionBar',
                                                                              'x-component-props': {
                                                                                layout: 'one-column',
                                                                                style: {
                                                                                  marginTop: 'var(--nb-spacing)',
                                                                                },
                                                                              },
                                                                              'x-app-version': '1.2.8-alpha',
                                                                              'x-uid': 'dkfshq47o8i',
                                                                              'x-async': false,
                                                                              'x-index': 2,
                                                                            },
                                                                          },
                                                                          'x-uid': '4gz0unx7rya',
                                                                          'x-async': false,
                                                                          'x-index': 1,
                                                                        },
                                                                      },
                                                                      'x-async': false,
                                                                      'x-index': 1,
                                                                    },
                                                                  },
                                                                  'x-uid': 'wr8env9e30j',
                                                                  'x-async': false,
                                                                  'x-index': 1,
                                                                },
                                                              },
                                                              'x-uid': 'mcmyeg3147y',
                                                              'x-async': false,
                                                              'x-index': 4,
                                                            },
                                                            rjt3znbrf3q: {
                                                              _isJSONSchemaObject: true,
                                                              version: '2.0',
                                                              type: 'void',
                                                              'x-component': 'Grid.Row',
                                                              'x-app-version': '1.2.8-alpha',
                                                              properties: {
                                                                '4uxjny23hm5': {
                                                                  _isJSONSchemaObject: true,
                                                                  version: '2.0',
                                                                  type: 'void',
                                                                  'x-component': 'Grid.Col',
                                                                  'x-app-version': '1.2.8-alpha',
                                                                  properties: {
                                                                    e93x4mhkui9: {
                                                                      'x-uid': '1ppi52hawn4',
                                                                      _isJSONSchemaObject: true,
                                                                      version: '2.0',
                                                                      type: 'void',
                                                                      'x-acl-action-props': {
                                                                        skipScopeCheck: true,
                                                                      },
                                                                      'x-acl-action': 'users:create',
                                                                      'x-decorator': 'FormBlockProvider',
                                                                      'x-use-decorator-props':
                                                                        'useCreateFormBlockDecoratorProps',
                                                                      'x-decorator-props': {
                                                                        dataSource: 'main',
                                                                        collection: 'users',
                                                                        isCusomeizeCreate: true,
                                                                      },
                                                                      'x-toolbar': 'BlockSchemaToolbar',
                                                                      'x-settings': 'blockSettings:createForm',
                                                                      'x-component': 'CardItem',
                                                                      'x-app-version': '1.2.8-alpha',
                                                                      'x-component-props': {
                                                                        title: 'Variable: Current popup record',
                                                                      },
                                                                      properties: {
                                                                        szglhz28rug: {
                                                                          _isJSONSchemaObject: true,
                                                                          version: '2.0',
                                                                          type: 'void',
                                                                          'x-component': 'FormV2',
                                                                          'x-use-component-props':
                                                                            'useCreateFormBlockProps',
                                                                          'x-app-version': '1.2.8-alpha',
                                                                          properties: {
                                                                            grid: {
                                                                              _isJSONSchemaObject: true,
                                                                              version: '2.0',
                                                                              type: 'void',
                                                                              'x-component': 'Grid',
                                                                              'x-initializer': 'form:configureFields',
                                                                              'x-app-version': '1.2.8-alpha',
                                                                              properties: {
                                                                                j6yhv8x9v6m: {
                                                                                  _isJSONSchemaObject: true,
                                                                                  version: '2.0',
                                                                                  type: 'void',
                                                                                  'x-component': 'Grid.Row',
                                                                                  'x-app-version': '1.2.8-alpha',
                                                                                  properties: {
                                                                                    '0vb82er0zyq': {
                                                                                      _isJSONSchemaObject: true,
                                                                                      version: '2.0',
                                                                                      type: 'void',
                                                                                      'x-component': 'Grid.Col',
                                                                                      'x-app-version': '1.2.8-alpha',
                                                                                      properties: {
                                                                                        nickname: {
                                                                                          'x-uid': '35o8hx997k2',
                                                                                          _isJSONSchemaObject: true,
                                                                                          version: '2.0',
                                                                                          type: 'string',
                                                                                          'x-toolbar':
                                                                                            'FormItemSchemaToolbar',
                                                                                          'x-settings':
                                                                                            'fieldSettings:FormItem',
                                                                                          'x-component':
                                                                                            'CollectionField',
                                                                                          'x-decorator': 'FormItem',
                                                                                          'x-collection-field':
                                                                                            'users.nickname',
                                                                                          'x-component-props': {},
                                                                                          'x-app-version':
                                                                                            '1.2.8-alpha',
                                                                                          default:
                                                                                            '{{$nPopupRecord.nickname}}',
                                                                                          'x-async': false,
                                                                                          'x-index': 1,
                                                                                        },
                                                                                      },
                                                                                      'x-uid': 'lywj2998nly',
                                                                                      'x-async': false,
                                                                                      'x-index': 1,
                                                                                    },
                                                                                  },
                                                                                  'x-uid': 'lin5pq4bpex',
                                                                                  'x-async': false,
                                                                                  'x-index': 1,
                                                                                },
                                                                              },
                                                                              'x-uid': 'p6x3vd3fhez',
                                                                              'x-async': false,
                                                                              'x-index': 1,
                                                                            },
                                                                            dvj11mlfnah: {
                                                                              _isJSONSchemaObject: true,
                                                                              version: '2.0',
                                                                              type: 'void',
                                                                              'x-initializer':
                                                                                'createForm:configureActions',
                                                                              'x-component': 'ActionBar',
                                                                              'x-component-props': {
                                                                                layout: 'one-column',
                                                                                style: {
                                                                                  marginTop: 'var(--nb-spacing)',
                                                                                },
                                                                              },
                                                                              'x-app-version': '1.2.8-alpha',
                                                                              'x-uid': 'gma9mwzv4dr',
                                                                              'x-async': false,
                                                                              'x-index': 2,
                                                                            },
                                                                          },
                                                                          'x-uid': 'l5a4ychqmrs',
                                                                          'x-async': false,
                                                                          'x-index': 1,
                                                                        },
                                                                      },
                                                                      'x-async': false,
                                                                      'x-index': 1,
                                                                    },
                                                                  },
                                                                  'x-uid': '9168tscxqr0',
                                                                  'x-async': false,
                                                                  'x-index': 1,
                                                                },
                                                              },
                                                              'x-uid': '610enru817y',
                                                              'x-async': false,
                                                              'x-index': 5,
                                                            },
                                                            '6vt3eg1fdkf': {
                                                              _isJSONSchemaObject: true,
                                                              version: '2.0',
                                                              type: 'void',
                                                              'x-component': 'Grid.Row',
                                                              'x-app-version': '1.2.8-alpha',
                                                              properties: {
                                                                ukqk042qbtz: {
                                                                  _isJSONSchemaObject: true,
                                                                  version: '2.0',
                                                                  type: 'void',
                                                                  'x-component': 'Grid.Col',
                                                                  'x-app-version': '1.2.8-alpha',
                                                                  'x-uid': 'ejjhbc28t3p',
                                                                  'x-async': false,
                                                                  'x-index': 1,
                                                                },
                                                              },
                                                              'x-uid': 'q3j2vgv8gfg',
                                                              'x-async': false,
                                                              'x-index': 6,
                                                            },
                                                            h7pk2zbtoe2: {
                                                              _isJSONSchemaObject: true,
                                                              version: '2.0',
                                                              type: 'void',
                                                              'x-component': 'Grid.Row',
                                                              'x-app-version': '1.2.8-alpha',
                                                              properties: {
                                                                '9cnceetg9e3': {
                                                                  _isJSONSchemaObject: true,
                                                                  version: '2.0',
                                                                  type: 'void',
                                                                  'x-component': 'Grid.Col',
                                                                  'x-app-version': '1.2.8-alpha',
                                                                  properties: {
                                                                    xnp9sk5bp8n: {
                                                                      _isJSONSchemaObject: true,
                                                                      version: '2.0',
                                                                      type: 'void',
                                                                      'x-decorator': 'TableBlockProvider',
                                                                      'x-acl-action': 'users.roles:list',
                                                                      'x-use-decorator-props':
                                                                        'useTableBlockDecoratorProps',
                                                                      'x-decorator-props': {
                                                                        association: 'users.roles',
                                                                        dataSource: 'main',
                                                                        action: 'list',
                                                                        params: {
                                                                          pageSize: 20,
                                                                        },
                                                                        rowKey: 'name',
                                                                        showIndex: true,
                                                                        dragSort: false,
                                                                      },
                                                                      'x-toolbar': 'BlockSchemaToolbar',
                                                                      'x-settings': 'blockSettings:table',
                                                                      'x-component': 'CardItem',
                                                                      'x-filter-targets': [],
                                                                      'x-app-version': '1.2.8-alpha',
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
                                                                          'x-app-version': '1.2.8-alpha',
                                                                          'x-uid': '1q67rp6unjp',
                                                                          'x-async': false,
                                                                          'x-index': 1,
                                                                        },
                                                                        msso4r8x4u3: {
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
                                                                          'x-app-version': '1.2.8-alpha',
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
                                                                              'x-initializer':
                                                                                'table:configureItemActions',
                                                                              'x-settings': 'fieldSettings:TableColumn',
                                                                              'x-toolbar-props': {
                                                                                initializer:
                                                                                  'table:configureItemActions',
                                                                              },
                                                                              'x-app-version': '1.2.8-alpha',
                                                                              properties: {
                                                                                vrn0nxktd4u: {
                                                                                  _isJSONSchemaObject: true,
                                                                                  version: '2.0',
                                                                                  type: 'void',
                                                                                  'x-decorator': 'DndContext',
                                                                                  'x-component': 'Space',
                                                                                  'x-component-props': {
                                                                                    split: '|',
                                                                                  },
                                                                                  'x-app-version': '1.2.8-alpha',
                                                                                  properties: {
                                                                                    kpqrl0kgpyb: {
                                                                                      'x-uid': 'obkauwgfgq7',
                                                                                      _isJSONSchemaObject: true,
                                                                                      version: '2.0',
                                                                                      type: 'void',
                                                                                      title: 'View role',
                                                                                      'x-action': 'view',
                                                                                      'x-toolbar':
                                                                                        'ActionSchemaToolbar',
                                                                                      'x-settings':
                                                                                        'actionSettings:view',
                                                                                      'x-component': 'Action.Link',
                                                                                      'x-component-props': {
                                                                                        openMode: 'drawer',
                                                                                        iconColor: '#1677FF',
                                                                                        danger: false,
                                                                                      },
                                                                                      'x-decorator':
                                                                                        'ACLActionProvider',
                                                                                      'x-designer-props': {
                                                                                        linkageAction: true,
                                                                                      },
                                                                                      properties: {
                                                                                        drawer: {
                                                                                          _isJSONSchemaObject: true,
                                                                                          version: '2.0',
                                                                                          type: 'void',
                                                                                          title:
                                                                                            '{{ t("View record") }}',
                                                                                          'x-component':
                                                                                            'Action.Container',
                                                                                          'x-component-props': {
                                                                                            className:
                                                                                              'nb-action-popup',
                                                                                          },
                                                                                          properties: {
                                                                                            tabs: {
                                                                                              _isJSONSchemaObject: true,
                                                                                              version: '2.0',
                                                                                              type: 'void',
                                                                                              'x-component': 'Tabs',
                                                                                              'x-component-props': {},
                                                                                              'x-initializer':
                                                                                                'popup:addTab',
                                                                                              properties: {
                                                                                                tab1: {
                                                                                                  _isJSONSchemaObject:
                                                                                                    true,
                                                                                                  version: '2.0',
                                                                                                  type: 'void',
                                                                                                  title:
                                                                                                    '{{t("Details")}}',
                                                                                                  'x-component':
                                                                                                    'Tabs.TabPane',
                                                                                                  'x-designer':
                                                                                                    'Tabs.Designer',
                                                                                                  'x-component-props':
                                                                                                    {},
                                                                                                  properties: {
                                                                                                    grid: {
                                                                                                      _isJSONSchemaObject:
                                                                                                        true,
                                                                                                      version: '2.0',
                                                                                                      type: 'void',
                                                                                                      'x-component':
                                                                                                        'Grid',
                                                                                                      'x-initializer':
                                                                                                        'popup:common:addBlock',
                                                                                                      properties: {
                                                                                                        heliwtqu3eq: {
                                                                                                          _isJSONSchemaObject:
                                                                                                            true,
                                                                                                          version:
                                                                                                            '2.0',
                                                                                                          type: 'void',
                                                                                                          'x-component':
                                                                                                            'Grid.Row',
                                                                                                          'x-app-version':
                                                                                                            '1.2.8-alpha',
                                                                                                          properties: {
                                                                                                            jbt07chbalw:
                                                                                                              {
                                                                                                                _isJSONSchemaObject:
                                                                                                                  true,
                                                                                                                version:
                                                                                                                  '2.0',
                                                                                                                type: 'void',
                                                                                                                'x-component':
                                                                                                                  'Grid.Col',
                                                                                                                'x-app-version':
                                                                                                                  '1.2.8-alpha',
                                                                                                                properties:
                                                                                                                  {
                                                                                                                    i437g06welg:
                                                                                                                      {
                                                                                                                        'x-uid':
                                                                                                                          'edf63ztrbxq',
                                                                                                                        _isJSONSchemaObject:
                                                                                                                          true,
                                                                                                                        version:
                                                                                                                          '2.0',
                                                                                                                        type: 'void',
                                                                                                                        'x-acl-action':
                                                                                                                          'users.roles:get',
                                                                                                                        'x-decorator':
                                                                                                                          'DetailsBlockProvider',
                                                                                                                        'x-use-decorator-props':
                                                                                                                          'useDetailsDecoratorProps',
                                                                                                                        'x-decorator-props':
                                                                                                                          {
                                                                                                                            dataSource:
                                                                                                                              'main',
                                                                                                                            association:
                                                                                                                              'users.roles',
                                                                                                                            readPretty:
                                                                                                                              true,
                                                                                                                            action:
                                                                                                                              'get',
                                                                                                                          },
                                                                                                                        'x-toolbar':
                                                                                                                          'BlockSchemaToolbar',
                                                                                                                        'x-settings':
                                                                                                                          'blockSettings:details',
                                                                                                                        'x-component':
                                                                                                                          'CardItem',
                                                                                                                        'x-is-current':
                                                                                                                          true,
                                                                                                                        'x-app-version':
                                                                                                                          '1.2.8-alpha',
                                                                                                                        'x-component-props':
                                                                                                                          {
                                                                                                                            title:
                                                                                                                              'Details',
                                                                                                                          },
                                                                                                                        properties:
                                                                                                                          {
                                                                                                                            u0gd3xb9lu3:
                                                                                                                              {
                                                                                                                                _isJSONSchemaObject:
                                                                                                                                  true,
                                                                                                                                version:
                                                                                                                                  '2.0',
                                                                                                                                type: 'void',
                                                                                                                                'x-component':
                                                                                                                                  'Details',
                                                                                                                                'x-read-pretty':
                                                                                                                                  true,
                                                                                                                                'x-use-component-props':
                                                                                                                                  'useDetailsProps',
                                                                                                                                'x-app-version':
                                                                                                                                  '1.2.8-alpha',
                                                                                                                                properties:
                                                                                                                                  {
                                                                                                                                    b8zdned1saz:
                                                                                                                                      {
                                                                                                                                        _isJSONSchemaObject:
                                                                                                                                          true,
                                                                                                                                        version:
                                                                                                                                          '2.0',
                                                                                                                                        type: 'void',
                                                                                                                                        'x-initializer':
                                                                                                                                          'details:configureActions',
                                                                                                                                        'x-component':
                                                                                                                                          'ActionBar',
                                                                                                                                        'x-component-props':
                                                                                                                                          {
                                                                                                                                            style:
                                                                                                                                              {
                                                                                                                                                marginBottom: 24,
                                                                                                                                              },
                                                                                                                                          },
                                                                                                                                        'x-app-version':
                                                                                                                                          '1.2.8-alpha',
                                                                                                                                        'x-uid':
                                                                                                                                          'plxpukolwn4',
                                                                                                                                        'x-async':
                                                                                                                                          false,
                                                                                                                                        'x-index': 1,
                                                                                                                                      },
                                                                                                                                    grid: {
                                                                                                                                      _isJSONSchemaObject:
                                                                                                                                        true,
                                                                                                                                      version:
                                                                                                                                        '2.0',
                                                                                                                                      type: 'void',
                                                                                                                                      'x-component':
                                                                                                                                        'Grid',
                                                                                                                                      'x-initializer':
                                                                                                                                        'details:configureFields',
                                                                                                                                      'x-app-version':
                                                                                                                                        '1.2.8-alpha',
                                                                                                                                      properties:
                                                                                                                                        {
                                                                                                                                          mz536stgwkv:
                                                                                                                                            {
                                                                                                                                              _isJSONSchemaObject:
                                                                                                                                                true,
                                                                                                                                              version:
                                                                                                                                                '2.0',
                                                                                                                                              type: 'void',
                                                                                                                                              'x-component':
                                                                                                                                                'Grid.Row',
                                                                                                                                              'x-app-version':
                                                                                                                                                '1.2.8-alpha',
                                                                                                                                              properties:
                                                                                                                                                {
                                                                                                                                                  '8yutqqodl7q':
                                                                                                                                                    {
                                                                                                                                                      _isJSONSchemaObject:
                                                                                                                                                        true,
                                                                                                                                                      version:
                                                                                                                                                        '2.0',
                                                                                                                                                      type: 'void',
                                                                                                                                                      'x-component':
                                                                                                                                                        'Grid.Col',
                                                                                                                                                      'x-app-version':
                                                                                                                                                        '1.2.8-alpha',
                                                                                                                                                      properties:
                                                                                                                                                        {
                                                                                                                                                          title:
                                                                                                                                                            {
                                                                                                                                                              _isJSONSchemaObject:
                                                                                                                                                                true,
                                                                                                                                                              version:
                                                                                                                                                                '2.0',
                                                                                                                                                              type: 'string',
                                                                                                                                                              'x-toolbar':
                                                                                                                                                                'FormItemSchemaToolbar',
                                                                                                                                                              'x-settings':
                                                                                                                                                                'fieldSettings:FormItem',
                                                                                                                                                              'x-component':
                                                                                                                                                                'CollectionField',
                                                                                                                                                              'x-decorator':
                                                                                                                                                                'FormItem',
                                                                                                                                                              'x-collection-field':
                                                                                                                                                                'roles.title',
                                                                                                                                                              'x-component-props':
                                                                                                                                                                {},
                                                                                                                                                              'x-app-version':
                                                                                                                                                                '1.2.8-alpha',
                                                                                                                                                              'x-uid':
                                                                                                                                                                'oll0umtp7tn',
                                                                                                                                                              'x-async':
                                                                                                                                                                false,
                                                                                                                                                              'x-index': 1,
                                                                                                                                                            },
                                                                                                                                                        },
                                                                                                                                                      'x-uid':
                                                                                                                                                        '75ns4lofnq7',
                                                                                                                                                      'x-async':
                                                                                                                                                        false,
                                                                                                                                                      'x-index': 1,
                                                                                                                                                    },
                                                                                                                                                },
                                                                                                                                              'x-uid':
                                                                                                                                                'tytsnjz1iji',
                                                                                                                                              'x-async':
                                                                                                                                                false,
                                                                                                                                              'x-index': 1,
                                                                                                                                            },
                                                                                                                                        },
                                                                                                                                      'x-uid':
                                                                                                                                        'q9wcv2kt2n2',
                                                                                                                                      'x-async':
                                                                                                                                        false,
                                                                                                                                      'x-index': 2,
                                                                                                                                    },
                                                                                                                                  },
                                                                                                                                'x-uid':
                                                                                                                                  'qyzoxdhemtt',
                                                                                                                                'x-async':
                                                                                                                                  false,
                                                                                                                                'x-index': 1,
                                                                                                                              },
                                                                                                                          },
                                                                                                                        'x-async':
                                                                                                                          false,
                                                                                                                        'x-index': 1,
                                                                                                                      },
                                                                                                                  },
                                                                                                                'x-uid':
                                                                                                                  '1v4p33jtwx0',
                                                                                                                'x-async':
                                                                                                                  false,
                                                                                                                'x-index': 1,
                                                                                                              },
                                                                                                          },
                                                                                                          'x-uid':
                                                                                                            'i8qn6tn2etg',
                                                                                                          'x-async':
                                                                                                            false,
                                                                                                          'x-index': 1,
                                                                                                        },
                                                                                                        f0ugu63rh9c: {
                                                                                                          _isJSONSchemaObject:
                                                                                                            true,
                                                                                                          version:
                                                                                                            '2.0',
                                                                                                          type: 'void',
                                                                                                          'x-component':
                                                                                                            'Grid.Row',
                                                                                                          'x-app-version':
                                                                                                            '1.2.8-alpha',
                                                                                                          properties: {
                                                                                                            skrtxdw11vg:
                                                                                                              {
                                                                                                                _isJSONSchemaObject:
                                                                                                                  true,
                                                                                                                version:
                                                                                                                  '2.0',
                                                                                                                type: 'void',
                                                                                                                'x-component':
                                                                                                                  'Grid.Col',
                                                                                                                'x-app-version':
                                                                                                                  '1.2.8-alpha',
                                                                                                                properties:
                                                                                                                  {
                                                                                                                    b6wpu86agsn:
                                                                                                                      {
                                                                                                                        'x-uid':
                                                                                                                          'fkcab93zwgk',
                                                                                                                        _isJSONSchemaObject:
                                                                                                                          true,
                                                                                                                        version:
                                                                                                                          '2.0',
                                                                                                                        type: 'void',
                                                                                                                        'x-decorator':
                                                                                                                          'TableBlockProvider',
                                                                                                                        'x-acl-action':
                                                                                                                          'roles:list',
                                                                                                                        'x-use-decorator-props':
                                                                                                                          'useTableBlockDecoratorProps',
                                                                                                                        'x-decorator-props':
                                                                                                                          {
                                                                                                                            collection:
                                                                                                                              'roles',
                                                                                                                            dataSource:
                                                                                                                              'main',
                                                                                                                            action:
                                                                                                                              'list',
                                                                                                                            params:
                                                                                                                              {
                                                                                                                                pageSize: 20,
                                                                                                                                filter:
                                                                                                                                  {
                                                                                                                                    $and: [
                                                                                                                                      {
                                                                                                                                        name: {
                                                                                                                                          $includes:
                                                                                                                                            '{{$nParentPopupRecord.roles.name}}',
                                                                                                                                        },
                                                                                                                                      },
                                                                                                                                    ],
                                                                                                                                  },
                                                                                                                              },
                                                                                                                            rowKey:
                                                                                                                              'name',
                                                                                                                            showIndex:
                                                                                                                              true,
                                                                                                                            dragSort:
                                                                                                                              false,
                                                                                                                          },
                                                                                                                        'x-toolbar':
                                                                                                                          'BlockSchemaToolbar',
                                                                                                                        'x-settings':
                                                                                                                          'blockSettings:table',
                                                                                                                        'x-component':
                                                                                                                          'CardItem',
                                                                                                                        'x-filter-targets':
                                                                                                                          [],
                                                                                                                        'x-app-version':
                                                                                                                          '1.2.8-alpha',
                                                                                                                        'x-component-props':
                                                                                                                          {
                                                                                                                            title:
                                                                                                                              "Use 'Parent popup recor' in data scope",
                                                                                                                          },
                                                                                                                        properties:
                                                                                                                          {
                                                                                                                            actions:
                                                                                                                              {
                                                                                                                                _isJSONSchemaObject:
                                                                                                                                  true,
                                                                                                                                version:
                                                                                                                                  '2.0',
                                                                                                                                type: 'void',
                                                                                                                                'x-initializer':
                                                                                                                                  'table:configureActions',
                                                                                                                                'x-component':
                                                                                                                                  'ActionBar',
                                                                                                                                'x-component-props':
                                                                                                                                  {
                                                                                                                                    style:
                                                                                                                                      {
                                                                                                                                        marginBottom:
                                                                                                                                          'var(--nb-spacing)',
                                                                                                                                      },
                                                                                                                                  },
                                                                                                                                'x-app-version':
                                                                                                                                  '1.2.8-alpha',
                                                                                                                                'x-uid':
                                                                                                                                  'n45qyt4l7p8',
                                                                                                                                'x-async':
                                                                                                                                  false,
                                                                                                                                'x-index': 1,
                                                                                                                              },
                                                                                                                            pld27iksvjt:
                                                                                                                              {
                                                                                                                                _isJSONSchemaObject:
                                                                                                                                  true,
                                                                                                                                version:
                                                                                                                                  '2.0',
                                                                                                                                type: 'array',
                                                                                                                                'x-initializer':
                                                                                                                                  'table:configureColumns',
                                                                                                                                'x-component':
                                                                                                                                  'TableV2',
                                                                                                                                'x-use-component-props':
                                                                                                                                  'useTableBlockProps',
                                                                                                                                'x-component-props':
                                                                                                                                  {
                                                                                                                                    rowKey:
                                                                                                                                      'id',
                                                                                                                                    rowSelection:
                                                                                                                                      {
                                                                                                                                        type: 'checkbox',
                                                                                                                                      },
                                                                                                                                  },
                                                                                                                                'x-app-version':
                                                                                                                                  '1.2.8-alpha',
                                                                                                                                properties:
                                                                                                                                  {
                                                                                                                                    actions:
                                                                                                                                      {
                                                                                                                                        _isJSONSchemaObject:
                                                                                                                                          true,
                                                                                                                                        version:
                                                                                                                                          '2.0',
                                                                                                                                        type: 'void',
                                                                                                                                        title:
                                                                                                                                          '{{ t("Actions") }}',
                                                                                                                                        'x-action-column':
                                                                                                                                          'actions',
                                                                                                                                        'x-decorator':
                                                                                                                                          'TableV2.Column.ActionBar',
                                                                                                                                        'x-component':
                                                                                                                                          'TableV2.Column',
                                                                                                                                        'x-toolbar':
                                                                                                                                          'TableColumnSchemaToolbar',
                                                                                                                                        'x-initializer':
                                                                                                                                          'table:configureItemActions',
                                                                                                                                        'x-settings':
                                                                                                                                          'fieldSettings:TableColumn',
                                                                                                                                        'x-toolbar-props':
                                                                                                                                          {
                                                                                                                                            initializer:
                                                                                                                                              'table:configureItemActions',
                                                                                                                                          },
                                                                                                                                        'x-app-version':
                                                                                                                                          '1.2.8-alpha',
                                                                                                                                        properties:
                                                                                                                                          {
                                                                                                                                            pgr25kbm5zw:
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
                                                                                                                                                'x-app-version':
                                                                                                                                                  '1.2.8-alpha',
                                                                                                                                                'x-uid':
                                                                                                                                                  'f0cusyi0qg3',
                                                                                                                                                'x-async':
                                                                                                                                                  false,
                                                                                                                                                'x-index': 1,
                                                                                                                                              },
                                                                                                                                          },
                                                                                                                                        'x-uid':
                                                                                                                                          'vg540gtmup2',
                                                                                                                                        'x-async':
                                                                                                                                          false,
                                                                                                                                        'x-index': 1,
                                                                                                                                      },
                                                                                                                                    '9kuhit9axbf':
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
                                                                                                                                        'x-app-version':
                                                                                                                                          '1.2.8-alpha',
                                                                                                                                        properties:
                                                                                                                                          {
                                                                                                                                            title:
                                                                                                                                              {
                                                                                                                                                _isJSONSchemaObject:
                                                                                                                                                  true,
                                                                                                                                                version:
                                                                                                                                                  '2.0',
                                                                                                                                                'x-collection-field':
                                                                                                                                                  'roles.title',
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
                                                                                                                                                'x-app-version':
                                                                                                                                                  '1.2.8-alpha',
                                                                                                                                                'x-uid':
                                                                                                                                                  'w8tgvckzkgc',
                                                                                                                                                'x-async':
                                                                                                                                                  false,
                                                                                                                                                'x-index': 1,
                                                                                                                                              },
                                                                                                                                          },
                                                                                                                                        'x-uid':
                                                                                                                                          'bj9txs37q50',
                                                                                                                                        'x-async':
                                                                                                                                          false,
                                                                                                                                        'x-index': 2,
                                                                                                                                      },
                                                                                                                                  },
                                                                                                                                'x-uid':
                                                                                                                                  'cfpfvp6acu3',
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
                                                                                                                  'zxcdynph3qu',
                                                                                                                'x-async':
                                                                                                                  false,
                                                                                                                'x-index': 1,
                                                                                                              },
                                                                                                          },
                                                                                                          'x-uid':
                                                                                                            '0obzkof2agt',
                                                                                                          'x-async':
                                                                                                            false,
                                                                                                          'x-index': 2,
                                                                                                        },
                                                                                                        '9zm7fz6qs11': {
                                                                                                          _isJSONSchemaObject:
                                                                                                            true,
                                                                                                          version:
                                                                                                            '2.0',
                                                                                                          type: 'void',
                                                                                                          'x-component':
                                                                                                            'Grid.Row',
                                                                                                          'x-app-version':
                                                                                                            '1.2.8-alpha',
                                                                                                          properties: {
                                                                                                            xn7xjfcea4f:
                                                                                                              {
                                                                                                                _isJSONSchemaObject:
                                                                                                                  true,
                                                                                                                version:
                                                                                                                  '2.0',
                                                                                                                type: 'void',
                                                                                                                'x-component':
                                                                                                                  'Grid.Col',
                                                                                                                'x-app-version':
                                                                                                                  '1.2.8-alpha',
                                                                                                                properties:
                                                                                                                  {
                                                                                                                    h8iybxqo68a:
                                                                                                                      {
                                                                                                                        'x-uid':
                                                                                                                          'ybylt4pirzc',
                                                                                                                        _isJSONSchemaObject:
                                                                                                                          true,
                                                                                                                        version:
                                                                                                                          '2.0',
                                                                                                                        type: 'void',
                                                                                                                        'x-acl-action-props':
                                                                                                                          {
                                                                                                                            skipScopeCheck:
                                                                                                                              true,
                                                                                                                          },
                                                                                                                        'x-acl-action':
                                                                                                                          'users:create',
                                                                                                                        'x-decorator':
                                                                                                                          'FormBlockProvider',
                                                                                                                        'x-use-decorator-props':
                                                                                                                          'useCreateFormBlockDecoratorProps',
                                                                                                                        'x-decorator-props':
                                                                                                                          {
                                                                                                                            dataSource:
                                                                                                                              'main',
                                                                                                                            collection:
                                                                                                                              'users',
                                                                                                                            isCusomeizeCreate:
                                                                                                                              true,
                                                                                                                          },
                                                                                                                        'x-toolbar':
                                                                                                                          'BlockSchemaToolbar',
                                                                                                                        'x-settings':
                                                                                                                          'blockSettings:createForm',
                                                                                                                        'x-component':
                                                                                                                          'CardItem',
                                                                                                                        'x-app-version':
                                                                                                                          '1.2.8-alpha',
                                                                                                                        'x-component-props':
                                                                                                                          {
                                                                                                                            title:
                                                                                                                              "Use 'Current popup record' and 'Parent popup record' in linkage rules",
                                                                                                                          },
                                                                                                                        properties:
                                                                                                                          {
                                                                                                                            v515rcx3gq9:
                                                                                                                              {
                                                                                                                                _isJSONSchemaObject:
                                                                                                                                  true,
                                                                                                                                version:
                                                                                                                                  '2.0',
                                                                                                                                type: 'void',
                                                                                                                                'x-component':
                                                                                                                                  'FormV2',
                                                                                                                                'x-use-component-props':
                                                                                                                                  'useCreateFormBlockProps',
                                                                                                                                'x-app-version':
                                                                                                                                  '1.2.8-alpha',
                                                                                                                                properties:
                                                                                                                                  {
                                                                                                                                    grid: {
                                                                                                                                      'x-uid':
                                                                                                                                        'rcl4n8ekgkc',
                                                                                                                                      _isJSONSchemaObject:
                                                                                                                                        true,
                                                                                                                                      version:
                                                                                                                                        '2.0',
                                                                                                                                      type: 'void',
                                                                                                                                      'x-component':
                                                                                                                                        'Grid',
                                                                                                                                      'x-initializer':
                                                                                                                                        'form:configureFields',
                                                                                                                                      'x-app-version':
                                                                                                                                        '1.2.8-alpha',
                                                                                                                                      'x-linkage-rules':
                                                                                                                                        [
                                                                                                                                          {
                                                                                                                                            condition:
                                                                                                                                              {
                                                                                                                                                $and: [],
                                                                                                                                              },
                                                                                                                                            actions:
                                                                                                                                              [
                                                                                                                                                {
                                                                                                                                                  targetFields:
                                                                                                                                                    [
                                                                                                                                                      'nickname',
                                                                                                                                                    ],
                                                                                                                                                  operator:
                                                                                                                                                    'value',
                                                                                                                                                  value:
                                                                                                                                                    {
                                                                                                                                                      mode: 'express',
                                                                                                                                                      value:
                                                                                                                                                        '{{$nPopupRecord.name}}',
                                                                                                                                                      result:
                                                                                                                                                        '{{$nPopupRecord.name}}',
                                                                                                                                                    },
                                                                                                                                                },
                                                                                                                                                {
                                                                                                                                                  targetFields:
                                                                                                                                                    [
                                                                                                                                                      'username',
                                                                                                                                                    ],
                                                                                                                                                  operator:
                                                                                                                                                    'value',
                                                                                                                                                  value:
                                                                                                                                                    {
                                                                                                                                                      mode: 'express',
                                                                                                                                                      value:
                                                                                                                                                        '{{$nParentPopupRecord.username}}',
                                                                                                                                                      result:
                                                                                                                                                        '{{$nParentPopupRecord.username}}',
                                                                                                                                                    },
                                                                                                                                                },
                                                                                                                                              ],
                                                                                                                                          },
                                                                                                                                        ],
                                                                                                                                      properties:
                                                                                                                                        {
                                                                                                                                          mwpb4y1xvwc:
                                                                                                                                            {
                                                                                                                                              _isJSONSchemaObject:
                                                                                                                                                true,
                                                                                                                                              version:
                                                                                                                                                '2.0',
                                                                                                                                              type: 'void',
                                                                                                                                              'x-component':
                                                                                                                                                'Grid.Row',
                                                                                                                                              'x-app-version':
                                                                                                                                                '1.2.8-alpha',
                                                                                                                                              properties:
                                                                                                                                                {
                                                                                                                                                  lznos2z04u7:
                                                                                                                                                    {
                                                                                                                                                      _isJSONSchemaObject:
                                                                                                                                                        true,
                                                                                                                                                      version:
                                                                                                                                                        '2.0',
                                                                                                                                                      type: 'void',
                                                                                                                                                      'x-component':
                                                                                                                                                        'Grid.Col',
                                                                                                                                                      'x-app-version':
                                                                                                                                                        '1.2.8-alpha',
                                                                                                                                                      properties:
                                                                                                                                                        {
                                                                                                                                                          nickname:
                                                                                                                                                            {
                                                                                                                                                              _isJSONSchemaObject:
                                                                                                                                                                true,
                                                                                                                                                              version:
                                                                                                                                                                '2.0',
                                                                                                                                                              type: 'string',
                                                                                                                                                              'x-toolbar':
                                                                                                                                                                'FormItemSchemaToolbar',
                                                                                                                                                              'x-settings':
                                                                                                                                                                'fieldSettings:FormItem',
                                                                                                                                                              'x-component':
                                                                                                                                                                'CollectionField',
                                                                                                                                                              'x-decorator':
                                                                                                                                                                'FormItem',
                                                                                                                                                              'x-collection-field':
                                                                                                                                                                'users.nickname',
                                                                                                                                                              'x-component-props':
                                                                                                                                                                {},
                                                                                                                                                              'x-app-version':
                                                                                                                                                                '1.2.8-alpha',
                                                                                                                                                              'x-uid':
                                                                                                                                                                'i6av2tkto6l',
                                                                                                                                                              'x-async':
                                                                                                                                                                false,
                                                                                                                                                              'x-index': 1,
                                                                                                                                                            },
                                                                                                                                                        },
                                                                                                                                                      'x-uid':
                                                                                                                                                        '6cu6oi5rwle',
                                                                                                                                                      'x-async':
                                                                                                                                                        false,
                                                                                                                                                      'x-index': 1,
                                                                                                                                                    },
                                                                                                                                                },
                                                                                                                                              'x-uid':
                                                                                                                                                'jzdbzph6mk7',
                                                                                                                                              'x-async':
                                                                                                                                                false,
                                                                                                                                              'x-index': 1,
                                                                                                                                            },
                                                                                                                                          avpc9774lpj:
                                                                                                                                            {
                                                                                                                                              _isJSONSchemaObject:
                                                                                                                                                true,
                                                                                                                                              version:
                                                                                                                                                '2.0',
                                                                                                                                              type: 'void',
                                                                                                                                              'x-component':
                                                                                                                                                'Grid.Row',
                                                                                                                                              'x-app-version':
                                                                                                                                                '1.2.8-alpha',
                                                                                                                                              properties:
                                                                                                                                                {
                                                                                                                                                  '48k53nm8op9':
                                                                                                                                                    {
                                                                                                                                                      _isJSONSchemaObject:
                                                                                                                                                        true,
                                                                                                                                                      version:
                                                                                                                                                        '2.0',
                                                                                                                                                      type: 'void',
                                                                                                                                                      'x-component':
                                                                                                                                                        'Grid.Col',
                                                                                                                                                      'x-app-version':
                                                                                                                                                        '1.2.8-alpha',
                                                                                                                                                      properties:
                                                                                                                                                        {
                                                                                                                                                          username:
                                                                                                                                                            {
                                                                                                                                                              _isJSONSchemaObject:
                                                                                                                                                                true,
                                                                                                                                                              version:
                                                                                                                                                                '2.0',
                                                                                                                                                              type: 'string',
                                                                                                                                                              'x-toolbar':
                                                                                                                                                                'FormItemSchemaToolbar',
                                                                                                                                                              'x-settings':
                                                                                                                                                                'fieldSettings:FormItem',
                                                                                                                                                              'x-component':
                                                                                                                                                                'CollectionField',
                                                                                                                                                              'x-decorator':
                                                                                                                                                                'FormItem',
                                                                                                                                                              'x-collection-field':
                                                                                                                                                                'users.username',
                                                                                                                                                              'x-component-props':
                                                                                                                                                                {},
                                                                                                                                                              'x-app-version':
                                                                                                                                                                '1.2.8-alpha',
                                                                                                                                                              'x-uid':
                                                                                                                                                                'gaunuwoypii',
                                                                                                                                                              'x-async':
                                                                                                                                                                false,
                                                                                                                                                              'x-index': 1,
                                                                                                                                                            },
                                                                                                                                                        },
                                                                                                                                                      'x-uid':
                                                                                                                                                        'kq6lpqn7sl4',
                                                                                                                                                      'x-async':
                                                                                                                                                        false,
                                                                                                                                                      'x-index': 1,
                                                                                                                                                    },
                                                                                                                                                },
                                                                                                                                              'x-uid':
                                                                                                                                                'j8a0hpc8q38',
                                                                                                                                              'x-async':
                                                                                                                                                false,
                                                                                                                                              'x-index': 2,
                                                                                                                                            },
                                                                                                                                        },
                                                                                                                                      'x-async':
                                                                                                                                        false,
                                                                                                                                      'x-index': 1,
                                                                                                                                    },
                                                                                                                                    ck43uehl6sb:
                                                                                                                                      {
                                                                                                                                        _isJSONSchemaObject:
                                                                                                                                          true,
                                                                                                                                        version:
                                                                                                                                          '2.0',
                                                                                                                                        type: 'void',
                                                                                                                                        'x-initializer':
                                                                                                                                          'createForm:configureActions',
                                                                                                                                        'x-component':
                                                                                                                                          'ActionBar',
                                                                                                                                        'x-component-props':
                                                                                                                                          {
                                                                                                                                            layout:
                                                                                                                                              'one-column',
                                                                                                                                            style:
                                                                                                                                              {
                                                                                                                                                marginTop:
                                                                                                                                                  'var(--nb-spacing)',
                                                                                                                                              },
                                                                                                                                          },
                                                                                                                                        'x-app-version':
                                                                                                                                          '1.2.8-alpha',
                                                                                                                                        'x-uid':
                                                                                                                                          '8ypx0en4tuh',
                                                                                                                                        'x-async':
                                                                                                                                          false,
                                                                                                                                        'x-index': 2,
                                                                                                                                      },
                                                                                                                                  },
                                                                                                                                'x-uid':
                                                                                                                                  'euep38x5ww3',
                                                                                                                                'x-async':
                                                                                                                                  false,
                                                                                                                                'x-index': 1,
                                                                                                                              },
                                                                                                                          },
                                                                                                                        'x-async':
                                                                                                                          false,
                                                                                                                        'x-index': 1,
                                                                                                                      },
                                                                                                                  },
                                                                                                                'x-uid':
                                                                                                                  '5tm9p7yp7yw',
                                                                                                                'x-async':
                                                                                                                  false,
                                                                                                                'x-index': 1,
                                                                                                              },
                                                                                                          },
                                                                                                          'x-uid':
                                                                                                            'pgkloesa9q5',
                                                                                                          'x-async':
                                                                                                            false,
                                                                                                          'x-index': 3,
                                                                                                        },
                                                                                                      },
                                                                                                      'x-uid':
                                                                                                        'zo0dy988kb8',
                                                                                                      'x-async': false,
                                                                                                      'x-index': 1,
                                                                                                    },
                                                                                                  },
                                                                                                  'x-uid':
                                                                                                    '9onrofp42n0',
                                                                                                  'x-async': false,
                                                                                                  'x-index': 1,
                                                                                                },
                                                                                              },
                                                                                              'x-uid': '4ry5hqrw816',
                                                                                              'x-async': false,
                                                                                              'x-index': 1,
                                                                                            },
                                                                                          },
                                                                                          'x-uid': '23ivl7e4cwd',
                                                                                          'x-async': false,
                                                                                          'x-index': 1,
                                                                                        },
                                                                                      },
                                                                                      'x-async': false,
                                                                                      'x-index': 1,
                                                                                    },
                                                                                  },
                                                                                  'x-uid': 'hyx52cjis9q',
                                                                                  'x-async': false,
                                                                                  'x-index': 1,
                                                                                },
                                                                              },
                                                                              'x-uid': 'y3oz74k0sde',
                                                                              'x-async': false,
                                                                              'x-index': 1,
                                                                            },
                                                                            u62b74oeoa3: {
                                                                              _isJSONSchemaObject: true,
                                                                              version: '2.0',
                                                                              type: 'void',
                                                                              'x-decorator': 'TableV2.Column.Decorator',
                                                                              'x-toolbar': 'TableColumnSchemaToolbar',
                                                                              'x-settings': 'fieldSettings:TableColumn',
                                                                              'x-component': 'TableV2.Column',
                                                                              'x-app-version': '1.2.8-alpha',
                                                                              properties: {
                                                                                name: {
                                                                                  _isJSONSchemaObject: true,
                                                                                  version: '2.0',
                                                                                  'x-collection-field': 'roles.name',
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
                                                                                  'x-app-version': '1.2.8-alpha',
                                                                                  'x-uid': 'j62s7fv2rz1',
                                                                                  'x-async': false,
                                                                                  'x-index': 1,
                                                                                },
                                                                              },
                                                                              'x-uid': 'vkh30z3hub8',
                                                                              'x-async': false,
                                                                              'x-index': 2,
                                                                            },
                                                                          },
                                                                          'x-uid': 'o5aa8m8sv9y',
                                                                          'x-async': false,
                                                                          'x-index': 2,
                                                                        },
                                                                      },
                                                                      'x-uid': '1c0ppas5bkq',
                                                                      'x-async': false,
                                                                      'x-index': 1,
                                                                    },
                                                                  },
                                                                  'x-uid': 'ch4po0mfhpc',
                                                                  'x-async': false,
                                                                  'x-index': 1,
                                                                },
                                                              },
                                                              'x-uid': 'qzou4f5uq00',
                                                              'x-async': false,
                                                              'x-index': 7,
                                                            },
                                                          },
                                                          'x-uid': 'y3m6fzw3vxm',
                                                          'x-async': false,
                                                          'x-index': 1,
                                                        },
                                                      },
                                                      'x-uid': 'lzrgy21qagb',
                                                      'x-async': false,
                                                      'x-index': 1,
                                                    },
                                                  },
                                                  'x-uid': '2d9k3mjqq5o',
                                                  'x-async': false,
                                                  'x-index': 1,
                                                },
                                              },
                                              'x-uid': 'wqzj6suh29r',
                                              'x-async': false,
                                              'x-index': 1,
                                            },
                                          },
                                          'x-async': false,
                                          'x-index': 1,
                                        },
                                      },
                                      'x-uid': '5ls6p9ujrlt',
                                      'x-async': false,
                                      'x-index': 1,
                                    },
                                  },
                                  'x-uid': 'ko8gsxd2z04',
                                  'x-async': false,
                                  'x-index': 1,
                                },
                              },
                              'x-uid': 'zds12bomc53',
                              'x-async': false,
                              'x-index': 2,
                            },
                          },
                          'x-uid': '0dya4p8vlqd',
                          'x-async': false,
                          'x-index': 1,
                        },
                      },
                      'x-uid': 'ts6uc46oogs',
                      'x-async': false,
                      'x-index': 1,
                    },
                  },
                  'x-uid': 'owznkqli9c2',
                  'x-async': false,
                  'x-index': 1,
                },
              },
              'x-uid': 'mhh5qraws7m',
              'x-async': false,
              'x-index': 1,
            },
          },
          'x-uid': '0cdb9slpkvt',
          'x-async': true,
          'x-index': 1,
        },
      }).goto();

      // 打开弹窗
      await page.getByLabel('action-Action.Link-View').click();

      // 详情区块
      await expect(
        page
          .getByLabel('block-item-CardItem-users-details')
          .getByLabel('block-item-CollectionField-users-details-users.nickname-Nickname'),
      ).toHaveText('Nickname:Super Admin');

      // 关系区块
      await expect(
        page
          .getByLabel('block-item-CardItem-roles-details')
          .getByLabel('block-item-CollectionField-roles-details-roles.name-Role UID'),
      ).toHaveText('Role UID:admin');

      // 使用变量 `Current role` 设置默认值
      await expect(page.getByLabel('block-item-CardItem-roles-form').getByRole('textbox')).toHaveValue('root');

      // 使用变量 `Current popup record` 设置默认值
      await expect(page.getByLabel('block-item-CardItem-users-form').getByRole('textbox')).toHaveValue('Super Admin');

      // -----------------------------------------------------------------------------------------------

      // 打开嵌套弹窗
      await page.getByLabel('action-Action.Link-View role-view-roles-table-admin').click();

      // 详情区块
      await expect(page.getByLabel('block-item-CollectionField-roles-details-roles.title-Role name')).toHaveText(
        'Role name:Admin',
      );

      // 使用变量 `Parent popup record` 设置数据范围
      await expect(
        page
          .getByTestId('drawer-Action.Container-roles-View record')
          .getByLabel('block-item-CardItem-roles-table')
          .getByRole('button', { name: 'Admin', exact: true }),
      ).toBeVisible();
      await expect(
        page
          .getByTestId('drawer-Action.Container-roles-View record')
          .getByLabel('block-item-CardItem-roles-table')
          .getByRole('button', { name: 'Member', exact: true }),
      ).toBeVisible();
      await expect(
        page
          .getByTestId('drawer-Action.Container-roles-View record')
          .getByLabel('block-item-CardItem-roles-table')
          .getByRole('button', { name: 'Root', exact: true }),
      ).toBeVisible();

      // 使用变量 `Current popup record` 和 `Parent popup record` 设置默认值
      await expect(
        page
          .getByTestId('drawer-Action.Container-roles-View record')
          .getByLabel('block-item-CardItem-users-form')
          .getByLabel('block-item-CollectionField-users-form-users.nickname-Nickname')
          .getByRole('textbox'),
      ).toHaveValue('admin');
      await expect(
        page
          .getByTestId('drawer-Action.Container-roles-View record')
          .getByLabel('block-item-CardItem-users-form')
          .getByLabel('block-item-CollectionField-users-form-users.username-Username')
          .getByRole('textbox'),
      ).toHaveValue('nocobase');

      // -----------------------------------------------------------------------------------

      // 关闭嵌套弹窗后，再点击不同的行打开嵌套弹窗，应该显示不同的数据
      await page.getByLabel('drawer-Action.Container-roles-View record-mask').click();
      await page.getByLabel('action-Action.Link-View role-view-roles-table-member').click();

      // 详情区块
      await expect(page.getByLabel('block-item-CollectionField-roles-details-roles.title-Role name')).toHaveText(
        'Role name:Member',
      );

      // 使用变量 `Parent popup record` 设置数据范围
      await expect(
        page
          .getByTestId('drawer-Action.Container-roles-View record')
          .getByLabel('block-item-CardItem-roles-table')
          .getByRole('button', { name: 'Admin', exact: true }),
      ).toBeVisible();
      await expect(
        page
          .getByTestId('drawer-Action.Container-roles-View record')
          .getByLabel('block-item-CardItem-roles-table')
          .getByRole('button', { name: 'Member', exact: true }),
      ).toBeVisible();
      await expect(
        page
          .getByTestId('drawer-Action.Container-roles-View record')
          .getByLabel('block-item-CardItem-roles-table')
          .getByRole('button', { name: 'Root', exact: true }),
      ).toBeVisible();

      // 使用变量 `Current popup record` 和 `Parent popup record` 设置默认值
      await expect(
        page
          .getByTestId('drawer-Action.Container-roles-View record')
          .getByLabel('block-item-CardItem-users-form')
          .getByLabel('block-item-CollectionField-users-form-users.nickname-Nickname')
          .getByRole('textbox'),
      ).toHaveValue('member');
      await expect(
        page
          .getByTestId('drawer-Action.Container-roles-View record')
          .getByLabel('block-item-CardItem-users-form')
          .getByLabel('block-item-CollectionField-users-form-users.username-Username')
          .getByRole('textbox'),
      ).toHaveValue('nocobase');

      // -----------------------------------------------------------------------------------

      // 刷新页面后，弹窗中的内容不变
      await page.reload();

      // 详情区块
      await expect(page.getByLabel('block-item-CollectionField-roles-details-roles.title-Role name')).toHaveText(
        'Role name:Member',
      );

      // 使用变量 `Parent popup record` 设置数据范围
      await expect(
        page
          .getByTestId('drawer-Action.Container-roles-View record')
          .getByLabel('block-item-CardItem-roles-table')
          .getByRole('button', { name: 'Admin', exact: true }),
      ).toBeVisible();
      await expect(
        page
          .getByTestId('drawer-Action.Container-roles-View record')
          .getByLabel('block-item-CardItem-roles-table')
          .getByRole('button', { name: 'Member', exact: true }),
      ).toBeVisible();
      await expect(
        page
          .getByTestId('drawer-Action.Container-roles-View record')
          .getByLabel('block-item-CardItem-roles-table')
          .getByRole('button', { name: 'Root', exact: true }),
      ).toBeVisible();

      // 使用变量 `Current popup record` 和 `Parent popup record` 设置默认值
      await expect(
        page
          .getByTestId('drawer-Action.Container-roles-View record')
          .getByLabel('block-item-CardItem-users-form')
          .getByLabel('block-item-CollectionField-users-form-users.nickname-Nickname')
          .getByRole('textbox'),
      ).toHaveValue('member');
      await expect(
        page
          .getByTestId('drawer-Action.Container-roles-View record')
          .getByLabel('block-item-CardItem-users-form')
          .getByLabel('block-item-CollectionField-users-form-users.username-Username')
          .getByRole('textbox'),
      ).toHaveValue('nocobase');

      // -----------------------------------------------------------------------------------

      // 关闭弹窗，然后将 Open mode 调整为 page
      await page.getByLabel('drawer-Action.Container-roles-View record-mask').click();
      await page.locator('.ant-drawer-mask').click();

      await page.getByLabel('action-Action.Link-View').hover();
      await page.getByLabel('designer-schema-settings-Action.Link-actionSettings:view-users').hover();
      await page.getByRole('menuitem', { name: 'Open mode Drawer' }).click();
      await page.getByRole('option', { name: 'Page' }).click();

      // 跳转到子页面后，其内容应该和弹窗中的内容一致
      await page.getByLabel('action-Action.Link-View').click();
      expect(page.url()).toContain('/subpages');

      // 详情区块
      await expect(
        page
          .getByLabel('block-item-CardItem-users-details')
          .getByLabel('block-item-CollectionField-users-details-users.nickname-Nickname'),
      ).toHaveText('Nickname:Super Admin');

      // 关系区块
      await expect(
        page
          .getByLabel('block-item-CardItem-roles-details')
          .getByLabel('block-item-CollectionField-roles-details-roles.name-Role UID'),
      ).toHaveText('Role UID:admin');

      // 使用变量 `Current role` 设置默认值
      await expect(page.getByLabel('block-item-CardItem-roles-form').getByRole('textbox')).toHaveValue('root');

      // 使用变量 `Current popup record` 设置默认值
      await expect(page.getByLabel('block-item-CardItem-users-form').getByRole('textbox')).toHaveValue('Super Admin');

      // ---------------------------------------------------------------------------------------------------------------

      // 打开子页面中的弹窗
      await page.getByLabel('action-Action.Link-View role-view-roles-table-member').click();

      // 详情区块
      await expect(page.getByLabel('block-item-CollectionField-roles-details-roles.title-Role name')).toHaveText(
        'Role name:Member',
      );

      // 使用变量 `Parent popup record` 设置数据范围
      await expect(
        page
          .getByTestId('drawer-Action.Container-roles-View record')
          .getByLabel('block-item-CardItem-roles-table')
          .getByRole('button', { name: 'Admin', exact: true }),
      ).toBeVisible();
      await expect(
        page
          .getByTestId('drawer-Action.Container-roles-View record')
          .getByLabel('block-item-CardItem-roles-table')
          .getByRole('button', { name: 'Member', exact: true }),
      ).toBeVisible();
      await expect(
        page
          .getByTestId('drawer-Action.Container-roles-View record')
          .getByLabel('block-item-CardItem-roles-table')
          .getByRole('button', { name: 'Root', exact: true }),
      ).toBeVisible();

      // 使用变量 `Current popup record` 和 `Parent popup record` 设置默认值
      await expect(
        page
          .getByTestId('drawer-Action.Container-roles-View record')
          .getByLabel('block-item-CardItem-users-form')
          .getByLabel('block-item-CollectionField-users-form-users.nickname-Nickname')
          .getByRole('textbox'),
      ).toHaveValue('member');
      await expect(
        page
          .getByTestId('drawer-Action.Container-roles-View record')
          .getByLabel('block-item-CardItem-users-form')
          .getByLabel('block-item-CollectionField-users-form-users.username-Username')
          .getByRole('textbox'),
      ).toHaveValue('nocobase');

      // -----------------------------------------------------------------------------------

      // 关闭弹窗后，重新选择一条不同的数据打开，应该显示不同的数据
      await page.getByLabel('drawer-Action.Container-roles-View record-mask').click();
      await page.getByLabel('action-Action.Link-View role-view-roles-table-admin').click();

      // 详情区块
      await expect(page.getByLabel('block-item-CollectionField-roles-details-roles.title-Role name')).toHaveText(
        'Role name:Admin',
      );

      // 使用变量 `Parent popup record` 设置数据范围
      await expect(
        page
          .getByTestId('drawer-Action.Container-roles-View record')
          .getByLabel('block-item-CardItem-roles-table')
          .getByRole('button', { name: 'Admin', exact: true }),
      ).toBeVisible();
      await expect(
        page
          .getByTestId('drawer-Action.Container-roles-View record')
          .getByLabel('block-item-CardItem-roles-table')
          .getByRole('button', { name: 'Member', exact: true }),
      ).toBeVisible();
      await expect(
        page
          .getByTestId('drawer-Action.Container-roles-View record')
          .getByLabel('block-item-CardItem-roles-table')
          .getByRole('button', { name: 'Root', exact: true }),
      ).toBeVisible();

      // 使用变量 `Current popup record` 和 `Parent popup record` 设置默认值
      await expect(
        page
          .getByTestId('drawer-Action.Container-roles-View record')
          .getByLabel('block-item-CardItem-users-form')
          .getByLabel('block-item-CollectionField-users-form-users.nickname-Nickname')
          .getByRole('textbox'),
      ).toHaveValue('admin');
      await expect(
        page
          .getByTestId('drawer-Action.Container-roles-View record')
          .getByLabel('block-item-CardItem-users-form')
          .getByLabel('block-item-CollectionField-users-form-users.username-Username')
          .getByRole('textbox'),
      ).toHaveValue('nocobase');

      // -----------------------------------------------------------------------------------

      // 刷新页面后，弹窗中的内容不变
      await page.reload();

      // 详情区块
      await expect(page.getByLabel('block-item-CollectionField-roles-details-roles.title-Role name')).toHaveText(
        'Role name:Admin',
      );

      // 使用变量 `Parent popup record` 设置数据范围
      await expect(
        page
          .getByTestId('drawer-Action.Container-roles-View record')
          .getByLabel('block-item-CardItem-roles-table')
          .getByRole('button', { name: 'Admin', exact: true }),
      ).toBeVisible();
      await expect(
        page
          .getByTestId('drawer-Action.Container-roles-View record')
          .getByLabel('block-item-CardItem-roles-table')
          .getByRole('button', { name: 'Member', exact: true }),
      ).toBeVisible();
      await expect(
        page
          .getByTestId('drawer-Action.Container-roles-View record')
          .getByLabel('block-item-CardItem-roles-table')
          .getByRole('button', { name: 'Root', exact: true }),
      ).toBeVisible();

      // 使用变量 `Current popup record` 和 `Parent popup record` 设置默认值
      await expect(
        page
          .getByTestId('drawer-Action.Container-roles-View record')
          .getByLabel('block-item-CardItem-users-form')
          .getByLabel('block-item-CollectionField-users-form-users.nickname-Nickname')
          .getByRole('textbox'),
      ).toHaveValue('admin');
      await expect(
        page
          .getByTestId('drawer-Action.Container-roles-View record')
          .getByLabel('block-item-CardItem-users-form')
          .getByLabel('block-item-CollectionField-users-form-users.username-Username')
          .getByRole('textbox'),
      ).toHaveValue('nocobase');

      // -----------------------------------------------------------------------------------

      // 关闭弹窗后，将子页面中的 Open mode 调整为 page
      await page.goBack();
      await page.getByLabel('action-Action.Link-View role-view-roles-table-admin').hover();
      await page
        .getByRole('button', { name: 'designer-schema-settings-Action.Link-actionSettings:view-roles' })
        .hover();
      await page.getByRole('menuitem', { name: 'Open mode Drawer' }).click();
      await page.getByRole('option', { name: 'Page' }).click();

      // 点击按钮跳转到子页面
      await page.getByLabel('action-Action.Link-View role-view-roles-table-admin').click();

      // 详情区块
      await expect(page.getByLabel('block-item-CollectionField-roles-details-roles.title-Role name')).toHaveText(
        'Role name:Admin',
      );

      // 使用变量 `Parent popup record` 设置数据范围
      await expect(
        page.getByLabel('block-item-CardItem-roles-table').getByRole('button', { name: 'Admin', exact: true }),
      ).toBeVisible();
      await expect(
        page.getByLabel('block-item-CardItem-roles-table').getByRole('button', { name: 'Member', exact: true }),
      ).toBeVisible();
      await expect(
        page.getByLabel('block-item-CardItem-roles-table').getByRole('button', { name: 'Root', exact: true }),
      ).toBeVisible();

      // 使用变量 `Current popup record` 和 `Parent popup record` 设置默认值
      await expect(
        page
          .getByLabel('block-item-CardItem-users-form')
          .getByLabel('block-item-CollectionField-users-form-users.nickname-Nickname')
          .getByRole('textbox'),
      ).toHaveValue('admin');
      await expect(
        page
          .getByLabel('block-item-CardItem-users-form')
          .getByLabel('block-item-CollectionField-users-form-users.username-Username')
          .getByRole('textbox'),
      ).toHaveValue('nocobase');
    });
  });

  test.describe('popup', () => {
    const showMenu = async (page: Page) => {
      await page.getByLabel('action-Action.Link-Popup-customize:popup-general-table-0').hover();
      await page
        .getByRole('button', { name: 'designer-schema-settings-Action.Link-actionSettings:popup-general' })
        .hover();
    };

    test('supported options', async ({ page, mockPage, mockRecord }) => {
      const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
      await mockRecord('general');
      await nocoPage.goto();
      await addSomeCustomActions(page);

      await showMenu(page);
      await expectSettingsMenu({
        page,
        showMenu: () => showMenu(page),
        supportedOptions: ['Edit button', 'Linkage rules', 'Open mode', 'Popup size', 'Delete'],
      });
    });
  });

  test.describe('duplicate', () => {
    const showMenu = async (page: Page) => {
      await page.getByLabel('action-Action.Link-Duplicate-duplicate-general-table-0').hover();
      await page.getByRole('button', { name: 'designer-schema-settings-Action.Link-Action.Designer-general' }).hover();
    };

    test('supported options', async ({ page, mockPage, mockRecord }) => {
      const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
      await mockRecord('general');
      await nocoPage.goto();

      await expectSettingsMenu({
        page,
        showMenu: () => showMenu(page),
        supportedOptions: ['Edit button', 'Linkage rules', 'Duplicate mode', 'Open mode', 'Popup size', 'Delete'],
      });
    });
  });

  test.describe('update record', () => {
    const showMenu = async (page: Page) => {
      await page.getByLabel('action-Action.Link-Update record-customize:update-general-table-0').hover();
      await page
        .getByRole('button', { name: 'designer-schema-settings-Action.Link-actionSettings:updateRecord-general' })
        .hover();
    };

    test('supported options', async ({ page, mockPage, mockRecord }) => {
      const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
      await mockRecord('general');
      await nocoPage.goto();
      await addSomeCustomActions(page);

      await showMenu(page);
      await expectSettingsMenu({
        page,
        showMenu: () => showMenu(page),
        supportedOptions: [
          'Edit button',
          'Linkage rules',
          'Assign field values',
          'After successful submission',
          'Delete',
        ],
      });
    });

    test('Assign field values', async ({ page, mockPage, mockRecord }) => {
      const nocoPage = await mockPage(oneTableWithUpdateRecord).waitForInit();
      await mockRecord('users2');
      await nocoPage.goto();

      const openPopup = async () => {
        if (!(await page.getByLabel('action-Action.Link-Update record-customize:update-users2-table-0').isVisible())) {
          await page.getByRole('button', { name: 'Actions', exact: true }).hover();
          await page
            .getByLabel('designer-schema-initializer-TableV2.Column-TableV2.ActionColumnDesigner-users2')
            .hover();
          await page.getByRole('menuitem', { name: 'Update record' }).click();
        }

        await page.getByLabel('action-Action.Link-Update record-customize:update-users2-table-0').hover();
        await page
          .getByLabel('designer-schema-settings-Action.Link-actionSettings:updateRecord-users2')
          .first()
          .hover();
        await page.getByRole('menuitem', { name: 'Assign field values' }).click();

        await page.waitForTimeout(1000);

        if (!(await page.getByLabel('block-item-AssignedField-').getByRole('textbox').isVisible())) {
          await page.getByLabel('schema-initializer-Grid-assignFieldValuesForm:configureFields-users').hover();
          await page.getByRole('menuitem', { name: 'Nickname' }).click();
        }
      };

      const expectNewValue = async (value: string) => {
        await page.getByLabel('action-Action.Link-Update record-customize:update-users2-table-0').click();
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.getByLabel('action-Action-Refresh-refresh').click();
        await expect(page.getByLabel('block-item-CardItem-users2-').getByText(value)).toBeVisible();
      };

      // 1. 打开 Assign field values 配置弹窗
      await openPopup();

      // 2. 将 Nickname 字段的值设置为 `123456`
      await page.getByLabel('block-item-AssignedField-').getByRole('textbox').click();
      await page.getByLabel('block-item-AssignedField-').getByRole('textbox').fill('123456');
      await page.getByRole('button', { name: 'Submit' }).click();

      // 3. 保存后点击 Save record 按钮，然后刷新表格，应该显示一条 Nickname 为 “123456” 的记录
      await expectNewValue('123456');

      // 4. 再次打开 Assign field values 配置弹窗，这次为 Nickname 设置一个变量值（Current role）
      await openPopup();
      await page.getByLabel('variable-button').click();
      await expectSupportedVariables(page, [
        'Constant',
        'Current user',
        'Current role',
        'Date variables',
        'Current record',
      ]);
      await page.getByRole('menuitemcheckbox', { name: 'Current role' }).click();
      await page.getByRole('button', { name: 'Submit' }).click();

      // 5. 保存后点击 Save record 按钮，然后刷新表格，应该显示一条 Nickname 为 “root” 的记录
      await expectNewValue('root');
    });
  });

  test.describe('add child', () => {
    const showMenu = async (page: Page) => {
      await page.getByLabel('action-Action.Link-Add child-create-treeCollection-table-0').hover();
      await page.getByLabel('designer-schema-settings-Action.Link-actionSettings:addChild-tree').hover();
    };

    test('supported options', async ({ page, mockPage, mockRecord }) => {
      const nocoPage = await mockPage(oneEmptyTableWithTreeCollection).waitForInit();
      await nocoPage.goto();
      await page.getByLabel('block-item-CardItem-treeCollection-table').hover();

      // 添加一行数据
      // TODO: 使用 mockRecord 为 tree 表添加一行数据无效
      await page.getByLabel('schema-initializer-ActionBar-table:configureActions-treeCollection').hover();
      await page.getByRole('menuitem', { name: 'Add new' }).click();
      await page.getByRole('button', { name: 'Add new' }).click();
      await page.getByLabel('schema-initializer-Grid-popup:addNew:addBlock-treeCollection').hover();
      await page.getByRole('menuitem', { name: 'form Form' }).hover();
      await page.getByRole('menuitem', { name: 'Current collection' }).click();
      await page.mouse.move(300, 0);
      await page.getByLabel('schema-initializer-ActionBar-createForm:configureActions-treeCollection').hover();
      await page.getByRole('menuitem', { name: 'Submit' }).click();
      await page.mouse.move(300, 0);
      await page.getByRole('button', { name: 'Submit' }).click();

      await page.getByLabel('designer-schema-settings-CardItem-TableBlockDesigner-treeCollection').hover();
      await page.getByRole('menuitem', { name: 'Tree table' }).click();

      // 添加 add child 按钮
      await page.getByRole('button', { name: 'Actions', exact: true }).hover();
      await page.getByLabel('designer-schema-initializer-TableV2.Column-TableV2.ActionColumnDesigner-tree').hover();
      await page.getByRole('menuitem', { name: 'Add child' }).click();

      await expectSettingsMenu({
        page,
        showMenu: () => showMenu(page),
        supportedOptions: ['Edit button', 'Linkage rules', 'Open mode', 'Popup size', 'Delete'],
      });

      // https://nocobase.height.app/T-3235
      // add child 表单中的 Parent 字段应该有数据
      await page.getByLabel('action-Action.Link-Add child-').click({
        position: { x: 5, y: 5 }, // 防止按钮被遮挡
      });
      await page.getByLabel('schema-initializer-Grid-popup').hover();
      await page.getByRole('menuitem', { name: 'form Form' }).hover();
      await page.getByRole('menuitem', { name: 'Current collection' }).click();
      await page.mouse.move(300, 0);
      await page.getByLabel('schema-initializer-Grid-form:').hover();
      await page.getByRole('menuitem', { name: 'Parent', exact: true }).click();
      await page.mouse.move(300, 0);
      await expect(
        page
          .getByLabel('block-item-CollectionField-')
          .getByTestId('select-object-single')
          .getByText('1', { exact: true }),
      ).toBeVisible();
    });
  });

  test.describe('add record', () => {
    const showMenu = async (page: Page) => {
      await page.getByRole('button', { name: 'Add record' }).hover();
      await page.getByRole('button', { name: 'designer-schema-settings-Action-Action.Designer-general' }).hover();
    };

    test('supported options', async ({ page, mockPage, mockRecord }) => {
      await mockPage(oneEmptyTableBlockWithActions).goto();

      await expectSettingsMenu({
        page,
        showMenu: () => showMenu(page),
        supportedOptions: ['Edit button', 'Open mode', 'Popup size', 'Delete'],
      });
    });
  });
});

test.describe('table column schema settings', () => {
  // https://nocobase.height.app/T-3843
  test('set data scope', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(T3843).waitForInit();
    const record1 = await mockRecord('collection1');
    await nocoPage.goto();

    // 1. 关系字段下拉框中应该有数据
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByTestId('select-object-multiple').click();
    await expect(page.getByRole('option', { name: record1.singleLineText, exact: true })).toBeVisible();

    // 2. 为该关系字段设置一个数据范围后，下拉框中应该有一个匹配项
    await page.getByRole('button', { name: 'manyToMany1', exact: true }).hover();
    await page.getByLabel('designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-collection2').hover();
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByRole('menuitemcheckbox', { name: 'ID' }).click();
    await page.getByRole('spinbutton').click();
    await page.getByRole('spinbutton').fill('1');
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.reload();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByTestId('select-object-multiple').click();
    await expect(page.getByRole('option', { name: record1.singleLineText, exact: true })).toBeVisible();
  });

  test('fixed column', async ({ page, mockPage }) => {
    const nocoPage = await mockPage(oneTableWithColumnFixed).waitForInit();
    await nocoPage.goto();
    await expect(page.getByRole('button', { name: 'Roles' })).toBeVisible();
    const element = await page.getByRole('button', { name: 'Roles' });
    const hasClassName = await element.evaluate((el) =>
      el.parentElement.parentElement.className.includes('ant-table-cell-fix-left'),
    );

    await expect(hasClassName).toBe(true);
    //取消固定
    await page.getByRole('button', { name: 'Roles' }).hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-TableV2.Column-fieldSettings:TableColumn-users' })
      .hover();
    await page.getByTestId('schema-settings-menu').getByText('FixedLeft fixed').click();
    await page.getByText('Not fixed').click();
    const hasClassName1 = await element.evaluate((el) =>
      el.parentElement.parentElement.className.includes('ant-table-cell-fix-left'),
    );

    await expect(hasClassName1).toBe(false);
  });
});
