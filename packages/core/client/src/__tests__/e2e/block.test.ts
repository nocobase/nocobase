import { expect, test } from '@nocobase/test/client';

const tablePageSchema = {
  _isJSONSchemaObject: true,
  version: '2.0',
  type: 'void',
  'x-component': 'Page',
  properties: {
    nfiw626bmae: {
      _isJSONSchemaObject: true,
      version: '2.0',
      type: 'void',
      'x-component': 'Grid',
      'x-initializer': 'BlockInitializers',
      properties: {
        '6zubot4baeg': {
          _isJSONSchemaObject: true,
          version: '2.0',
          type: 'void',
          'x-component': 'Grid.Row',
          properties: {
            p5vddyamvmh: {
              _isJSONSchemaObject: true,
              version: '2.0',
              type: 'void',
              'x-component': 'Grid.Col',
              properties: {
                '65mh1a7jk13': {
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
                        mc0dr7t0i5u: {
                          _isJSONSchemaObject: true,
                          version: '2.0',
                          type: 'void',
                          'x-action': 'create',
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
                                          'x-uid': 'y4gqt9b1ftl',
                                          'x-async': false,
                                          'x-index': 1,
                                        },
                                      },
                                      'x-uid': 'qwyp3iu3jsc',
                                      'x-async': false,
                                      'x-index': 1,
                                    },
                                  },
                                  'x-uid': '5m8h1atxs69',
                                  'x-async': false,
                                  'x-index': 1,
                                },
                              },
                              'x-uid': 'tkpv0m3k97b',
                              'x-async': false,
                              'x-index': 1,
                            },
                          },
                          'x-uid': 'ysgq2erbi1m',
                          'x-async': false,
                          'x-index': 1,
                        },
                      },
                      'x-uid': 'qvtl2vfb3am',
                      'x-async': false,
                      'x-index': 1,
                    },
                    t6hmlz97y8w: {
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
                                ep69p7v8k7x: {
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
                                                  'x-uid': '2a0ebei04nl',
                                                  'x-async': false,
                                                  'x-index': 1,
                                                },
                                              },
                                              'x-uid': 'hhe75j1j9ti',
                                              'x-async': false,
                                              'x-index': 1,
                                            },
                                          },
                                          'x-uid': 'nyji3i1v1tu',
                                          'x-async': false,
                                          'x-index': 1,
                                        },
                                      },
                                      'x-uid': '58wvntfrzko',
                                      'x-async': false,
                                      'x-index': 1,
                                    },
                                  },
                                  'x-uid': 'xxhynhvddzv',
                                  'x-async': false,
                                  'x-index': 1,
                                },
                              },
                              'x-uid': 'ako63d8ih0l',
                              'x-async': false,
                              'x-index': 1,
                            },
                          },
                          'x-uid': 'sbh7l3mfswh',
                          'x-async': false,
                          'x-index': 1,
                        },
                      },
                      'x-uid': 'mwa5havp4ru',
                      'x-async': false,
                      'x-index': 2,
                    },
                  },
                  'x-uid': '6fihoeceup9',
                  'x-async': false,
                  'x-index': 1,
                },
              },
              'x-uid': 'apvwtuceule',
              'x-async': false,
              'x-index': 1,
            },
          },
          'x-uid': 'rvkphdnxw24',
          'x-async': false,
          'x-index': 1,
        },
      },
      'x-uid': 'ba5rblyi04p',
      'x-async': false,
      'x-index': 1,
    },
  },
  'x-uid': '7mk2xsg9nl6',
  'x-async': true,
  'x-index': 1,
};
test.describe('add block & delete block', () => {
  test('add block,then delete block', async ({ page, mockPage }) => {
    await mockPage().goto();
    await page.getByTestId('add-block-button-in-page').click();
    await page.getByRole('menuitem', { name: 'table Table right' }).click();
    await page.getByRole('menuitem', { name: 'Users' }).click();
    await page.getByRole('menuitem', { name: 'Users' }).hover();
    await expect(page.getByTestId('block-item')).toBeVisible();
    await expect(page.getByTestId('configure-actions-button-of-table-block-users')).toBeVisible();
    await expect(page.getByTestId('configure-columns-button-of-table-block-users')).toBeVisible();
    //删除区块
    await page.getByTestId('block-item').hover();
    await page.getByTestId('block-item').getByRole('button', { name: 'designer-schema-settings' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByTestId('block-item')).not.toBeVisible();
    await expect(page.getByTestId('configure-actions-button-of-table-block-users')).not.toBeVisible();
    await expect(page.getByTestId('configure-columns-button-of-table-block-users')).not.toBeVisible();
  });
});

test.describe('block title', () => {
  test('edit block title', async ({ page, mockPage }) => {
    await mockPage({
      pageSchema: tablePageSchema,
    }).goto();
    await page.getByTestId('block-item').click();
    await page.getByTestId('block-item').getByRole('button', { name: 'designer-schema-settings' }).click();
    await page.getByText('Edit block title').click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('block title');
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByTestId('block-item').locator('.ant-card-head')).toBeVisible();
    await expect(await page.getByTestId('block-item').locator('.ant-card-head').innerText()).toBe('block title');

    //回显
    await page.getByTestId('block-item').getByRole('button', { name: 'designer-schema-settings' }).click();
    await page.getByText('Edit block title').click();
    const inputValue = await page.getByRole('textbox').inputValue();
    await expect(inputValue).toBe('block title');
  });
});

test.describe('blcok template', () => {
  test('save block template', async ({ page, mockPage }) => {
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
    await page.getByTestId('form-block-users').click();
    await page.getByTestId('form-block-users').getByRole('button', { name: 'designer-schema-settings' }).click();
    await page.getByRole('menuitem', { name: 'Save as block template' }).click();
    await page.getByLabel('Save as template').getByRole('textbox').fill('Users_Form');
    await page.getByRole('button', { name: 'OK' }).click();

    await page.getByTestId('form-block-users').hover();
    await page.waitForTimeout(1000);
    const titleTag = await page.getByTestId('form-block-users').locator('.title-tag').nth(1).innerText();
    await expect(titleTag).toContain('Reference template');
  });
  test('using block template ', async ({ page, mockPage }) => {
    await mockPage({
      name: 'block template',
      pageSchema: tablePageSchema,
    }).goto();
    await page.getByTestId('add-block-button-in-page').click();
    //使用复制模板
    await page.getByRole('menuitem', { name: 'form Form right' }).first().click();
    await page.getByRole('menuitem', { name: 'Users right' }).click();
    await page.getByRole('menuitem', { name: 'Duplicate template right' }).click();
    await page.getByRole('menuitem', { name: 'Users_Form (Fields only)' }).first().click();
    await expect(page.getByTestId('form-block-users')).toBeVisible();

    //在新建操作中使用引用模板
    await page.getByTestId('block-item').getByRole('button', { name: 'plus Add new' }).click();
    await page.getByTestId('action-drawer').getByRole('button', { name: 'plus Add block' }).click();
    await page.getByRole('menuitem', { name: 'form Form right' }).click();
    await page.getByRole('menuitem', { name: 'Reference template right' }).click();
    await page.getByRole('menuitem', { name: 'Users_Form (Fields only)' }).first().click();
    await page.getByTestId('action-drawer').getByRole('button', { name: 'plus Add block' }).hover();
    await page.getByTestId('action-drawer').getByTestId('form-block-users').click();
    await page.locator('.ant-drawer-mask').click();

    //在编辑操作中使用引用模板
    await page.getByTestId('block-item').getByLabel('Edit').click();
    await page.getByTestId('action-drawer').getByRole('button', { name: 'plus Add block' }).click();
    await page.getByRole('menuitem', { name: 'form Form right' }).click();
    await page.getByRole('menuitem', { name: 'Reference template right' }).click();
    await page.getByRole('menuitem', { name: 'Users_Form (Fields only)' }).first().click();
    //修改引用模板
    await page.getByTestId('action-drawer').getByTestId('configure-fields-button-of-form-item-users').click();
    await page.getByRole('menuitem', { name: 'Phone' }).click();
    await page.locator('.ant-drawer-mask').click();
    //复制模板不同步，引用模板同步
    await expect(page.getByTestId('form-block-users').getByTestId('form-block-field-users.phone')).not.toBeVisible();
    await page.getByTestId('block-item').getByRole('button', { name: 'plus Add new' }).click();
    await expect(page.getByTestId('form-block-field-users.phone')).toBeVisible();
  });
});
