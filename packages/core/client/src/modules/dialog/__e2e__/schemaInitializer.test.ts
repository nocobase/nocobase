import {
  expect,
  oneDetailBlockWithM2oFieldToGeneral,
  oneEmptyTableBlockWithActions,
  oneEmptyTableBlockWithCustomizeActions,
  oneFormBlockWithRolesFieldBasedUsers,
  test,
} from '@nocobase/test/e2e';
import { tableWithRoles, tableWithUsers } from './templatesOfBug';

test.describe('where to open a popup and what can be added to it', () => {
  test('add new', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTableBlockWithActions).goto();

    // open dialog
    await page.getByLabel('action-Action-Add new-create-general-table').click();

    // add a tab
    await page.getByLabel('schema-initializer-Tabs-TabPaneInitializersForCreateFormBlock-general').click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('test123');
    await page.getByLabel('action-Action-Submit-general-table').click();

    await expect(page.getByText('test123')).toBeVisible();

    // add blocks
    await page.getByLabel('schema-initializer-Grid-popup:addNew:addBlock-general').hover();
    await page.getByText('Form').click();
    await page.getByText('Markdown').click();

    await page.mouse.move(300, 0);

    await expect(page.getByLabel('block-item-CardItem-general-form')).toBeVisible();
    await expect(page.getByLabel('block-item-Markdown.Void-general-markdown')).toBeVisible();
  });

  test('add record', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTableBlockWithActions).goto();

    // open dialog
    await page.getByLabel('action-Action-Add record-customize:create-general-table').click();

    // add a tab
    await page.getByLabel('schema-initializer-Tabs-TabPaneInitializersForCreateFormBlock-general').click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('test7');
    await page.getByLabel('action-Action-Submit-general-table').click();

    await expect(page.getByText('test7')).toBeVisible();

    // add blocks
    await page.getByLabel('schema-initializer-Grid-popup:addRecord:addBlock-general').hover();
    await page.getByText('Form').hover();
    await page.getByRole('menuitem', { name: 'Users' }).click();

    // add Markdown
    await page.getByLabel('schema-initializer-Grid-popup:addRecord:addBlock-general').hover();
    await page.getByRole('menuitem', { name: 'Markdown' }).click();

    await expect(page.getByLabel('block-item-CardItem-users-form')).toBeVisible();
    await expect(page.getByLabel('block-item-Markdown.Void-general-markdown')).toBeVisible();
  });

  test('view', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    // open dialog
    await page.getByLabel('action-Action.Link-View-view-general-table-0').click();

    // add a tab
    await page.getByLabel('schema-initializer-Tabs-TabPaneInitializers-general').click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('test8');
    await page.getByLabel('action-Action-Submit-general-table-0').click();

    await expect(page.getByText('test8')).toBeVisible();

    // add blocks
    await addBlock(['table Details right', 'Current record']);
    await addBlock(['form Form (Edit)']);
    await addBlock(['Markdown']);

    await expect(page.getByText('GeneralConfigure actionsConfigure fields')).toBeVisible();
    await expect(page.getByText('GeneralConfigure fieldsConfigure actions')).toBeVisible();
    await expect(page.getByLabel('block-item-Markdown.Void-general-markdown')).toBeVisible();

    // 删除已创建的 blocks，腾出页面空间
    // delete details block
    await page.getByText('GeneralConfigure actionsConfigure fields').hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:details-general').hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    // delete form block
    await page.getByLabel('block-item-CardItem-general-form').hover();
    await page.getByLabel('designer-schema-settings-CardItem-blockSettings:editForm-general').hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    // delete markdown block
    await page.getByLabel('block-item-Markdown.Void-general-markdown').hover();
    await page
      .getByRole('button', { name: 'designer-schema-settings-Markdown.Void-blockSettings:markdown-general' })
      .hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // add relationship blocks
    await addBlock(['table Details right', 'Associated records', 'Many to one']);
    await expect(page.getByLabel('block-item-CardItem-users-')).toBeVisible();
    await addBlock(['table Table right', 'Associated records', 'One to many']);
    await expect(page.getByLabel('block-item-CardItem-users-table')).toBeVisible();

    async function addBlock(names: string[]) {
      await page.getByLabel('schema-initializer-Grid-popup').hover();
      for (let i = 0; i < names.length - 1; i++) {
        const name = names[i];
        await page.getByRole('menuitem', { name }).hover();
      }
      await page.getByRole('menuitem', { name: names[names.length - 1] }).click();
      await page.mouse.move(300, 0);
    }
  });

  test('bulk edit', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTableBlockWithCustomizeActions).goto();

    // open dialog
    await page.getByLabel('action-Action-Bulk edit-customize:bulkEdit-general-table').click();
    await page.getByLabel('schema-initializer-Tabs-TabPaneInitializersForBulkEditFormBlock-general').click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('test1');
    await page.getByLabel('action-Action-Submit-general-table').click();

    await expect(page.getByText('test1')).toBeVisible();

    // add blocks
    await page.getByLabel('schema-initializer-Grid-popup:bulkEdit:addBlock-general').hover();
    await page.getByText('Form').click();
    await page.getByRole('menuitem', { name: 'Markdown' }).click();
    await page.mouse.move(300, 0);

    await expect(page.getByLabel('block-item-CardItem-general-form')).toBeVisible();
    await expect(page.getByLabel('block-item-Markdown.Void-general-markdown')).toBeVisible();
  });

  test('association link', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneDetailBlockWithM2oFieldToGeneral).waitForInit();
    const record = await mockRecord('targetToGeneral');
    await nocoPage.goto();

    // open dialog
    await page
      .getByLabel('block-item-CollectionField-targetToGeneral-details-targetToGeneral.toGeneral-toGeneral')
      .getByText(record.id, { exact: true })
      .click();

    // add a tab
    await page.getByLabel('schema-initializer-Tabs-TabPaneInitializers-general').click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('test8');
    await page.getByLabel('action-Action-Submit-general-details').click();

    await expect(page.getByText('test8')).toBeVisible();

    // add blocks
    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-general').hover();
    await page.getByRole('menuitem', { name: 'Details' }).hover();
    await page.getByRole('menuitem', { name: 'Current record' }).click();
    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-general').hover();
    await page.getByRole('menuitem', { name: 'form Form (Edit)' }).first().click();
    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-general').hover();
    await page.getByRole('menuitem', { name: 'Markdown' }).click();
    await page.mouse.move(300, 0);

    await expect(page.getByText('GeneralConfigure actionsConfigure fields')).toBeVisible();
    await expect(page.getByText('GeneralConfigure fieldsConfigure actions')).toBeVisible();
    await expect(page.getByLabel('block-item-Markdown.Void-general-markdown')).toBeVisible();

    // add relationship blocks
    // 下拉列表中，可选择以下区块进行创建
    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-general').hover();
    await expect(page.getByRole('menuitem', { name: 'table Details right' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'form Form (Edit)' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'form Form (Add new) right' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'form Form (Add new) right' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'table Table right' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'ordered-list List right' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'ordered-list Grid Card right' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Calendar' })).toBeVisible();

    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-general').hover();
    await page.getByRole('menuitem', { name: 'Details' }).hover();
    await page.getByRole('menuitem', { name: 'Associated records' }).hover();
    await page.getByRole('menuitem', { name: 'Many to one' }).click();
    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CardItem-users-')).toBeVisible();

    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-general').hover();
    await page.getByRole('menuitem', { name: 'table Table right' }).hover();
    await page.getByRole('menuitem', { name: 'Associated records' }).hover();
    await page.getByRole('menuitem', { name: 'One to many' }).click();
    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CardItem-users-table')).toBeVisible();
    // 屏幕上没有显示错误提示
    await expect(page.locator('.ant-notification-notice').first()).toBeHidden({ timeout: 1000 });
  });

  test('data picker', async ({ page, mockPage }) => {
    await mockPage(oneFormBlockWithRolesFieldBasedUsers).goto();

    // open dialog
    await page.getByTestId('select-data-picker').click();

    // add blocks
    await addBlock('form Table');
    await addBlock('form Form');
    await addBlock('Collapse');
    await addBlock('Add text');

    await expect(page.getByLabel('block-item-CardItem-roles-table-selector')).toBeVisible();
    await expect(page.getByLabel('block-item-CardItem-roles-filter-form')).toBeVisible();
    await expect(page.getByLabel('block-item-CardItem-roles-filter-collapse')).toBeVisible();
    await expect(page.getByLabel('block-item-Markdown.Void-roles-form')).toBeVisible();

    async function addBlock(name: string) {
      await page.getByLabel('schema-initializer-Grid-popup:tableSelector:addBlock-roles').hover();
      await page.getByRole('menuitem', { name }).click();
      await page.mouse.move(300, 0);
    }
  });
});

const tableWithInherit = {
  collections: [
    {
      name: 'targetCollection',
      fields: [
        {
          type: 'string',
          name: 'singleLineText',
          interface: 'input',
        },
      ],
    },
    {
      name: 'father',
      fields: [
        {
          type: 'string',
          name: 'singleLineText',
          interface: 'input',
        },
        {
          name: 'manyToMany',
          interface: 'm2m',
          target: 'targetCollection',
        },
      ],
    },
    {
      name: 'children',
      inherits: ['father'],
    },
  ],
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      egrrnisc7pq: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          bb1fa9y5wwh: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              m8lbibphksn: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  xj86s1jfwmk: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'father:list',
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'father',
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
                        'x-uid': '6j0p8tmwey7',
                        'x-async': false,
                        'x-index': 1,
                      },
                      pm3vc0ire0v: {
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
                              '6izaz7cwt1f': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                properties: {
                                  '9qgblzykl18': {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{ t("View") }}',
                                    'x-action': 'view',
                                    'x-toolbar': 'ActionSchemaToolbar',
                                    'x-settings': 'actionSettings:view',
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
                                                    'x-initializer': 'popup:common:addBlock',
                                                    'x-uid': '9h1njletm7j',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'y9y0jzcb2pp',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': '4m51ixkzi6i',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'kt1n14v8q1u',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'tkod1lyrj9z',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'e84lmt2djp7',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '8pydvn47931',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'zyfhdizs6g3',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': '4r6xuptmtw8',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '0aqn6al8phn',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'em7wvio4zan',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'd0zbm0ezhp5',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'qdffo69m238',
    'x-async': true,
    'x-index': 1,
  },
};

const tableWithInheritWithoutAssociation = {
  collections: [
    {
      name: 'father',
      fields: [
        {
          type: 'string',
          name: 'singleLineText',
          interface: 'input',
        },
      ],
    },
    {
      name: 'children',
      inherits: ['father'],
    },
  ],
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      egrrnisc7pq: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          bb1fa9y5wwh: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              m8lbibphksn: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  xj86s1jfwmk: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 'father:list',
                    'x-use-decorator-props': 'useTableBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'father',
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
                        'x-uid': '6j0p8tmwey7',
                        'x-async': false,
                        'x-index': 1,
                      },
                      pm3vc0ire0v: {
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
                              '6izaz7cwt1f': {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'DndContext',
                                'x-component': 'Space',
                                'x-component-props': {
                                  split: '|',
                                },
                                properties: {
                                  '9qgblzykl18': {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{ t("View") }}',
                                    'x-action': 'view',
                                    'x-toolbar': 'ActionSchemaToolbar',
                                    'x-settings': 'actionSettings:view',
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
                                                    'x-initializer': 'popup:common:addBlock',
                                                    'x-uid': '9h1njletm7j',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'y9y0jzcb2pp',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': '4m51ixkzi6i',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'kt1n14v8q1u',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'tkod1lyrj9z',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'e84lmt2djp7',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '8pydvn47931',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'zyfhdizs6g3',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': '4r6xuptmtw8',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '0aqn6al8phn',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'em7wvio4zan',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'd0zbm0ezhp5',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'qdffo69m238',
    'x-async': true,
    'x-index': 1,
  },
};

test.describe('add blocks to the popup', () => {
  test('no inheritance, no views, no association fields', async ({ page, mockPage }) => {
    await mockPage(tableWithRoles).goto();

    // 打开弹窗
    await page.getByLabel('action-Action.Link-View-view-roles-table-root').click();

    // 直接点击 Details 选项创建详情区块
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'table Details' }).click();
    await page.getByLabel('schema-initializer-Grid-details:configureFields-roles').hover();
    await page.getByRole('menuitem', { name: 'Role UID' }).click();
    await expect(page.getByLabel('block-item-CollectionField-Role').getByText('root')).toBeVisible();
    await page.mouse.move(300, 0);

    // 直接点击 Form(Edit) 选项创建表单区块
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'form Form (Edit)' }).click();
    await page.getByLabel('schema-initializer-Grid-form:').hover();
    await page.getByRole('menuitem', { name: 'Role UID' }).click();
    await expect(
      page.getByLabel('block-item-CollectionField-roles-form-roles.name-Role UID').getByRole('textbox'),
    ).toHaveValue('root');
  });

  test('no inheritance, no views, with association fields', async ({ page, mockPage }) => {
    await mockPage(tableWithUsers).goto();

    // 打开弹窗
    await page.getByLabel('action-Action.Link-View-view-').click();

    // 通过点击 Current record 选项创建详情区块
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'table Details right' }).hover();
    await page.getByRole('menuitem', { name: 'Current record' }).click();
    await page.getByLabel('schema-initializer-Grid-details:configureFields-users').hover();
    await page.getByRole('menuitem', { name: 'Nickname' }).click();
    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-users').getByText('Super Admin')).toBeVisible();

    // 通过 Association records 创建一个关系区块
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'table Details right' }).hover();
    await page.getByRole('menuitem', { name: 'Associated records' }).hover();
    await page.getByRole('menuitem', { name: 'Roles' }).click();
    await page.getByLabel('schema-initializer-Grid-details:configureFields-roles').hover();
    await page.getByRole('menuitem', { name: 'Role UID' }).click();
    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-roles').getByText('admin')).toBeVisible();
  });

  test('with inheritance, with association fields', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(tableWithInherit).waitForInit();
    const fatherRecord = await mockRecord('father');
    await nocoPage.goto();

    // 打开弹窗
    await page.getByLabel('action-Action.Link-View-view-father-table-0').click();

    // 通过 Current record 创建详情区块
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'table Details right' }).hover();
    await page.getByRole('menuitem', { name: 'Current record right' }).hover();
    await page.getByRole('menuitem', { name: 'father' }).click();
    await page.getByLabel('schema-initializer-Grid-details:configureFields-father').hover();
    await page.getByRole('menuitem', { name: 'singleLineText' }).click();
    await page.mouse.move(300, 0);
    await expect(
      page.getByLabel('block-item-CollectionField-father').getByText(fatherRecord.singleLineText),
    ).toBeVisible();

    // 通过 Association records 创建关系区块
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'table Table right' }).hover();
    await page.getByRole('menuitem', { name: 'Associated records' }).hover();
    await page.getByRole('menuitem', { name: 'manyToMany' }).click();
    await page
      .getByTestId('drawer-Action.Container-father-View record')
      .getByLabel('schema-initializer-TableV2-')
      .hover();
    await page.getByRole('menuitem', { name: 'singleLineText' }).click();
    await page.mouse.move(300, 0);
    await expect(
      page
        .getByTestId('drawer-Action.Container-father-View record')
        .getByLabel('block-item-CardItem-')
        .getByRole('row')
        .getByText(fatherRecord.manyToMany[0].singleLineText),
    ).toBeVisible();
  });

  test('with inheritance, no association fields', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(tableWithInheritWithoutAssociation).waitForInit();
    const fatherRecord = await mockRecord('father');
    await nocoPage.goto();

    // 打开弹窗
    await page.getByLabel('action-Action.Link-View-view-father-table-0').click();

    // 通过 Current record 创建详情区块
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'table Details right' }).hover();
    await page.getByRole('menuitem', { name: 'Current record right' }).hover();
    await page.getByRole('menuitem', { name: 'father' }).click();
    await page.getByLabel('schema-initializer-Grid-details:configureFields-father').hover();
    await page.getByRole('menuitem', { name: 'singleLineText' }).click();
    await page.mouse.move(300, 0);
    await expect(
      page.getByLabel('block-item-CollectionField-father').getByText(fatherRecord.singleLineText),
    ).toBeVisible();
  });

  test('only support association fields', async ({ page, mockPage }) => {
    await mockPage(tableWithUsers).goto();

    // 打开弹窗
    await page.getByLabel('action-Action.Link-View-view-').click();

    // 通过 Association records 创建一个关系区块
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'table Table right' }).hover();
    await page.getByRole('menuitem', { name: 'Associated records' }).hover();
    await page.getByRole('menuitem', { name: 'Roles' }).click();
    await page
      .getByTestId('drawer-Action.Container-users-View record')
      .getByLabel('schema-initializer-TableV2-')
      .hover();
    await page.getByRole('menuitem', { name: 'Role UID' }).click();
    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CardItem-roles-').getByRole('row').getByText('root')).toBeVisible();
  });
});
