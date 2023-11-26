import { expect, test } from '@nocobase/test/client';

const tablePageSchema = {
  _isJSONSchemaObject: true,
  version: '2.0',
  type: 'void',
  'x-component': 'Page',
  properties: {
    mwxaaxb9y9v: {
      _isJSONSchemaObject: true,
      version: '2.0',
      type: 'void',
      'x-component': 'Grid',
      'x-initializer': 'BlockInitializers',
      properties: {
        ibb0kjq3kyl: {
          _isJSONSchemaObject: true,
          version: '2.0',
          type: 'void',
          'x-component': 'Grid.Row',
          properties: {
            p39cigcjpij: {
              _isJSONSchemaObject: true,
              version: '2.0',
              type: 'void',
              'x-component': 'Grid.Col',
              properties: {
                '237ec1x538e': {
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
                        lmeom75gry5: {
                          _isJSONSchemaObject: true,
                          version: '2.0',
                          type: 'void',
                          'x-action': 'create',
                          'x-acl-action': 'create',
                          title: "{{t('Add new')}}",
                          'x-designer': 'Action.Designer',
                          'x-component': 'Action',
                          'x-decorator': 'ACLActionProvider',
                          'x-component-props': {
                            openMode: 'drawer',
                            type: 'primary',
                            component: 'CreateRecordAction',
                            icon: 'PlusOutlined',
                          },
                          'x-align': 'right',
                          'x-acl-action-props': {
                            skipScopeCheck: true,
                          },
                          properties: {
                            drawer: {
                              _isJSONSchemaObject: true,
                              version: '2.0',
                              type: 'void',
                              title: '{{ t("Add record") }}',
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
                                  'x-initializer': 'TabPaneInitializersForCreateFormBlock',
                                  properties: {
                                    tab1: {
                                      _isJSONSchemaObject: true,
                                      version: '2.0',
                                      type: 'void',
                                      title: '{{t("Add new")}}',
                                      'x-component': 'Tabs.TabPane',
                                      'x-designer': 'Tabs.Designer',
                                      'x-component-props': {},
                                      properties: {
                                        grid: {
                                          _isJSONSchemaObject: true,
                                          version: '2.0',
                                          type: 'void',
                                          'x-component': 'Grid',
                                          'x-initializer': 'CreateFormBlockInitializers',
                                          'x-uid': 'w224zhqyair',
                                          'x-async': false,
                                          'x-index': 1,
                                        },
                                      },
                                      'x-uid': 'lll44vre1t6',
                                      'x-async': false,
                                      'x-index': 1,
                                    },
                                  },
                                  'x-uid': 'c025dgp5tyk',
                                  'x-async': false,
                                  'x-index': 1,
                                },
                              },
                              'x-uid': 'og2z02rfxhx',
                              'x-async': false,
                              'x-index': 1,
                            },
                          },
                          'x-uid': 'vn9wxzx83y3',
                          'x-async': false,
                          'x-index': 1,
                        },
                      },
                      'x-uid': '7s3fcxfjc0y',
                      'x-async': false,
                      'x-index': 1,
                    },
                    zqdtqsjqgc1: {
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
                                kdcs236lihl: {
                                  _isJSONSchemaObject: true,
                                  version: '2.0',
                                  type: 'void',
                                  title: '{{ t("Edit") }}',
                                  'x-action': 'update',
                                  'x-designer': 'Action.Designer',
                                  'x-component': 'Action.Link',
                                  'x-component-props': {
                                    openMode: 'drawer',
                                    icon: 'EditOutlined',
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
                                      title: '{{ t("Edit record") }}',
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
                                              title: '{{t("Edit")}}',
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
                                                  'x-uid': 's49vs6v3qs0',
                                                  'x-async': false,
                                                  'x-index': 1,
                                                },
                                              },
                                              'x-uid': '33qff1grgqn',
                                              'x-async': false,
                                              'x-index': 1,
                                            },
                                          },
                                          'x-uid': '3z1hbrs3bre',
                                          'x-async': false,
                                          'x-index': 1,
                                        },
                                      },
                                      'x-uid': '09vwzm2det2',
                                      'x-async': false,
                                      'x-index': 1,
                                    },
                                  },
                                  'x-uid': 'bgdfnken9ua',
                                  'x-async': false,
                                  'x-index': 1,
                                },
                              },
                              'x-uid': 'tn98i5lgydw',
                              'x-async': false,
                              'x-index': 1,
                            },
                          },
                          'x-uid': 'ubmt489cxzn',
                          'x-async': false,
                          'x-index': 1,
                        },
                      },
                      'x-uid': 't6eg1ye4wf4',
                      'x-async': false,
                      'x-index': 2,
                    },
                  },
                  'x-uid': 'h4yvac2sy2g',
                  'x-async': false,
                  'x-index': 1,
                },
              },
              'x-uid': '3xei2593vgu',
              'x-async': false,
              'x-index': 1,
            },
          },
          'x-uid': 'm67du7wrojo',
          'x-async': false,
          'x-index': 1,
        },
      },
      'x-uid': '7aige8a5w3q',
      'x-async': false,
      'x-index': 1,
    },
  },
  'x-uid': 'qpbgsjdsgaq',
  'x-async': true,
  'x-index': 1,
};

test.describe('add block & delete block', () => {
  test('add block,then delete block', async ({ page, mockPage }) => {
    await mockPage().goto();
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    await page.getByRole('menuitem', { name: 'table Table' }).click();
    await page.getByRole('menuitem', { name: 'Users' }).click();
    await expect(page.getByLabel('block-item-CardItem-users-table')).toBeVisible();
    await expect(page.getByLabel('schema-initializer-ActionBar-TableActionInitializers-users')).toBeVisible();
    await expect(page.getByLabel('schema-initializer-TableV2-TableColumnInitializers-users')).toBeVisible();
    //删除区块
    await page.getByLabel('block-item-CardItem-users-table').hover();
    await page
      .getByLabel('block-item-CardItem-users-table')
      .getByRole('button', { name: 'designer-schema-settings' })
      .click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByLabel('block-item-CardItem-users-table')).not.toBeVisible();
    await expect(page.getByLabel('schema-initializer-ActionBar-TableActionInitializers-users')).not.toBeVisible();
    await expect(page.getByLabel('schema-initializer-TableV2-TableColumnInitializers-users')).not.toBeVisible();
  });
});

test.describe('block title', () => {
  test('edit block title', async ({ page, mockPage }) => {
    await mockPage({
      pageSchema: tablePageSchema,
    }).goto();
    await page.getByLabel('block-item-CardItem-users-table').hover();
    await page
      .getByLabel('block-item-CardItem-users-table')
      .getByRole('button', { name: 'designer-schema-settings' })
      .hover();
    await page.getByRole('menuitem', { name: 'Edit block title' }).click();
    await page.getByLabel('block-item-Input-users-Block title').click();
    await page.getByLabel('block-item-Input-users-Block title').getByRole('textbox').fill('block title');
    await page.locator('.ant-modal').getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByLabel('block-item-CardItem-users-table').locator('.ant-card-head')).toBeVisible();
    await expect(page.getByLabel('block-item-CardItem-users-table').locator('.ant-card-head')).toHaveText(
      'block title',
    );

    //回显
    await page
      .getByLabel('block-item-CardItem-users-table')
      .getByRole('button', { name: 'designer-schema-settings' })
      .hover();
    await page.getByRole('menuitem', { name: 'Edit block title' }).click();
    const inputValue = await page.getByRole('textbox').inputValue();
    expect(inputValue).toBe('block title');
  });
});

test.describe('block template', () => {
  test('save block template & using block template', async ({ page, mockPage }) => {
    await mockPage({
      name: 'block template source',
      pageSchema: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Page',
        properties: {
          bg76x03o9f2: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'BlockInitializers',
            properties: {
              gdj0ceke8ac: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Row',
                properties: {
                  ftx8xnesvev: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-component': 'Grid.Col',
                    properties: {
                      tu0dxua38tw: {
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
                        'x-component-props': {},
                        properties: {
                          avv3vpk0nlv: {
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
                                properties: {
                                  gnw25oyqe56: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Row',
                                    properties: {
                                      rdbe3gg1qv5: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        'x-component': 'Grid.Col',
                                        properties: {
                                          nickname: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'string',
                                            'x-designer': 'FormItem.Designer',
                                            'x-component': 'CollectionField',
                                            'x-decorator': 'FormItem',
                                            'x-collection-field': 'users.nickname',
                                            'x-component-props': {},
                                            'x-uid': 'okrljzl6j7s',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': '1zjdduck27k',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'l0cyy3gzz86',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': '4wrgwkyyf81',
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
                                'x-uid': '2apymtcq35d',
                                'x-async': false,
                                'x-index': 2,
                              },
                            },
                            'x-uid': '1tnmbrvb9ad',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'vo1pyqmoe28',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'z59pkpc8uhq',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'vsfafj9qcx9',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'sdj6iw5b0gs',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'uz4dyz41vt1',
        'x-async': true,
        'x-index': 1,
      },
    }).goto();
    await page.getByLabel('block-item-CardItem-users-form').hover();
    await page
      .getByLabel('block-item-CardItem-users-form')
      .getByLabel('designer-schema-settings-CardItem-FormV2.Designer-users')
      .hover();
    await page.getByRole('menuitem', { name: 'Save as block template' }).click();
    await page.getByLabel('Save as template').getByRole('textbox').fill('Users_Form');
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.getByLabel('block-item-CardItem-users-form').hover();

    //保存模板后当前区块为引用区块
    const titleTag = await page.getByLabel('block-item-CardItem-users-form').locator('.title-tag').nth(1).innerText();
    expect(titleTag).toContain('Reference template');

    // using block template
    await mockPage({
      name: 'block template',
      pageSchema: tablePageSchema,
    }).goto();
    await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();
    //使用复制模板
    await page.getByRole('menuitem', { name: 'form Form' }).first().hover();
    await page.getByRole('menuitem', { name: 'Users' }).hover();
    await page.getByRole('menuitem', { name: 'Duplicate template' }).hover();
    await page.getByRole('menuitem', { name: 'Users_Form (Fields only)' }).click();
    await expect(page.getByLabel('block-item-CardItem-users-form')).toBeVisible();

    //在新建操作中使用引用模板
    await page.getByLabel('action-Action-Add new-create-users-table').click();
    await page.getByLabel('schema-initializer-Grid-CreateFormBlockInitializers-users').click();
    await page.getByRole('menuitem', { name: 'form Form' }).hover();
    await page.getByRole('menuitem', { name: 'Reference template' }).hover();
    await page.getByRole('menuitem', { name: 'Users_Form (Fields only)' }).click();
    await page.getByLabel('schema-initializer-Grid-CreateFormBlockInitializers-users').hover();
    await expect(page.locator('.ant-drawer').getByLabel('block-item-CardItem-users-form')).toBeVisible();
    await page.locator('.ant-drawer-mask').click();

    //在编辑操作中使用引用模板
    await page.getByLabel('action-Action.Link-Edit-update-users-table-0').click();
    await page.getByLabel('schema-initializer-Grid-RecordBlockInitializers-users').click();
    await page.getByRole('menuitem', { name: 'form Form' }).hover();
    await page.getByRole('menuitem', { name: 'Reference template' }).hover();
    await page.getByRole('menuitem', { name: 'Users_Form (Fields only)' }).click();
    await page.getByLabel('schema-initializer-Grid-RecordBlockInitializers-users').hover();

    //修改引用模板
    await page.locator('.ant-drawer').getByLabel('schema-initializer-Grid-FormItemInitializers-users').click();
    await page.getByRole('menuitem', { name: 'Phone' }).click();
    await page.locator('.ant-drawer-mask').click();
    //复制模板不同步，引用模板同步
    await expect(
      page.getByLabel('block-item-CardItem-users-form').getByLabel('block-item-CollectionField-users-form-users.phone'),
    ).not.toBeVisible();
    await page.getByLabel('block-item-CardItem-users-table').getByLabel('action-Action-Add').click();
    await expect(page.getByLabel('block-item-CollectionField-users-form-users.phone')).toBeVisible();
    await page.locator('.ant-drawer-mask').click();

    //删除模板
    await page.getByTestId('plugin-settings-button').click();
    await page.getByLabel('ui-schema-storage').click();
    await page.getByRole('menuitem', { name: 'layout Block templates' }).click();
    await page.getByLabel('action-Action.Link-Delete-destroy-uiSchemaTemplates-table-Users_Form').click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
  });
});
