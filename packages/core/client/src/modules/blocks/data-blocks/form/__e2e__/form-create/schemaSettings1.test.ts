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
  oneEmptyForm,
  oneTableBlockWithActionsAndFormBlocks,
  oneTableBlockWithAddNewAndViewAndEditAndBasicFields,
  test,
} from '@nocobase/test/e2e';

export const clickOption = async (page: Page, optionName: string) => {
  await page.getByLabel('block-item-CardItem-general-form').hover();
  await page.getByLabel('designer-schema-settings-CardItem-FormV2.Designer-general').hover();
  await page.getByRole('menuitem', { name: optionName }).click();
};

test.describe('creation form block schema settings', () => {
  test('edit block title', async ({ page, mockPage }) => {
    await mockPage(oneTableBlockWithActionsAndFormBlocks).goto();
    await page.getByRole('button', { name: 'Add new' }).click();

    // 打开编辑弹窗
    await clickOption(page, 'Edit block title');
    await page.getByLabel('block-title').click();
    await page.getByLabel('block-title').fill('Block title 123');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    const runExpect = async () => {
      // 设置成功后，显示在区块顶部
      await expect(
        page.getByLabel('block-item-CardItem-general-form').getByText('Block title 123', { exact: true }),
      ).toBeVisible();

      // 再次打开编辑弹窗时，显示的是上次设置的值
      await clickOption(page, 'Edit block title');
      await expect(page.getByLabel('block-title')).toHaveValue('Block title 123');
    };

    await runExpect();

    // 刷新页面后，显示的应该依然是上次设置的值
    await page.reload();
    await runExpect();
  });

  // deprecated
  test.skip('Save as block template & convert reference to duplicate', async ({ page, mockPage }) => {
    await mockPage(oneTableBlockWithActionsAndFormBlocks).goto();
    await page.getByRole('button', { name: 'Add new' }).click();

    // 打开编辑弹窗
    await clickOption(page, 'Save as block template');
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 设置成功后，不再显示 Save as block template 选项，而是显示 Convert reference to duplicate 选项
    await page.getByLabel('block-item-CardItem-general-form').hover();
    await page.getByLabel('designer-schema-settings-CardItem-FormV2.Designer-general').hover();
    await expect(page.getByRole('menuitem', { name: 'Save as block template' })).not.toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Convert reference to duplicate' })).toBeVisible();

    // 刷新页面
    await page.reload();
    await page.getByLabel('block-item-CardItem-general-form').hover();
    await page.getByLabel('designer-schema-settings-CardItem-FormV2.Designer-general').hover();
    await expect(page.getByRole('menuitem', { name: 'Save as block template' })).not.toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Convert reference to duplicate' })).toBeVisible();

    // Convert reference to duplicate
    await clickOption(page, 'Convert reference to duplicate');
    // 点击之后下拉框不应该关闭，如果下拉框关闭了下面这行代码会报错
    await expect(page.getByRole('menuitem', { name: 'Save as block template' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Convert reference to duplicate' })).not.toBeVisible();

    // 刷新页面
    await page.reload();
    await page.getByLabel('block-item-CardItem-general-form').hover();
    await page.getByLabel('designer-schema-settings-CardItem-FormV2.Designer-general').hover();
    await expect(page.getByRole('menuitem', { name: 'Save as block template' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Convert reference to duplicate' })).not.toBeVisible();

    // 保存为模板之后，应该在 ui-schema-storage 页面显示出来
    await page.goto('/admin/settings/ui-schema-storage');
    await expect(page.getByRole('row', { name: 'General_Form' }).first()).toBeVisible();

    // 删除创建的模板，以免影响其它测试
    await page.getByLabel('Select all').check();
    await page.getByLabel('action-Action-Delete-destroy-').click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByRole('row', { name: 'General_Form' }).first()).toBeHidden();
  });

  test('delete', async ({ page, mockPage }) => {
    await mockPage(oneTableBlockWithActionsAndFormBlocks).goto();

    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByLabel('block-item-CardItem-general-form').hover();
    await page.getByLabel('designer-schema-settings-CardItem-FormV2.Designer-general').hover();

    // 打开编辑弹窗
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 设置成功后，显示在区块顶部
    await expect(page.getByLabel('block-item-CardItem-general-form')).not.toBeVisible();

    // 刷新页面后，区块依然是被删除状态
    await page.reload();
    await expect(page.getByLabel('block-item-CardItem-general-form')).not.toBeVisible();
  });

  test.skip('save as block Template', async ({ page, mockPage }) => {
    await mockPage(oneEmptyForm).goto();

    // 先保存为模板 ------------------------------------------------------------------------
    await showSettingsMenu(page);
    await page.getByRole('menuitem', { name: 'Save as block template' }).click();
    // 输入框中应该有一个默认的名字
    await expect(page.getByRole('dialog').getByRole('textbox')).toHaveValue('General_Form');
    // 设置一个新的名字
    await page.getByRole('dialog').getByRole('textbox').click();
    await page.getByRole('dialog').getByRole('textbox').fill('new_form_template');
    await page.getByRole('dialog').getByRole('button', { name: 'OK', exact: true }).click();

    // 区块左上角应该显示一个文案
    await page.getByLabel('block-item-CardItem-general-form').hover();
    await expect(
      page
        .getByLabel('block-item-CardItem-general-form')
        .getByText('Reference template: new_form_template (Fields only)'),
    ).toBeVisible();

    // settings 菜单中 Save as block template 应该变为 Convert reference to duplicate
    await showSettingsMenu(page);
    await expect(page.getByRole('menuitem', { name: 'Save as block template' })).toBeHidden();
    await expect(page.getByRole('menuitem', { name: 'Convert reference to duplicate' })).toBeVisible();

    // 创建区块的时候，可以选择刚才保存的模板 --------------------------------------------------
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await page.getByRole('menuitem', { name: 'Form right' }).first().hover();
    await page.getByRole('menuitem', { name: 'General right' }).hover();

    // Duplicate template
    await page.getByRole('menuitem', { name: 'Duplicate template right' }).hover();
    await page.getByRole('menuitem', { name: 'new_form_template (Fields only)' }).click();

    // Reference template
    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    await page.getByRole('menuitem', { name: 'Form right' }).first().hover();
    await page.getByRole('menuitem', { name: 'General right' }).hover();
    await page.getByRole('menuitem', { name: 'General right' }).click();
    await page.getByRole('menuitem', { name: 'Reference template right' }).click();
    await page.getByRole('menuitem', { name: 'new_form_template (Fields only)' }).click();

    // 页面中的区块应该成功被创建
    await expect(page.getByLabel('block-item-CardItem-general-form')).toHaveCount(3);

    // 保存为模板之后，应该在 ui-schema-storage 页面显示出来 -----------------------------------------
    await page.goto('/admin/settings/ui-schema-storage');
    await expect(page.getByRole('row', { name: 'new_form_template' }).first()).toBeVisible();

    // 最后需要把保存的模板删除掉，以免影响其它测试
    await page.getByLabel('Select all').check();
    await page.getByLabel('action-Action-Delete-destroy-').click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByRole('row', { name: 'new_form_template' }).first()).toBeHidden();

    async function showSettingsMenu(page) {
      await page.getByLabel('block-item-CardItem-general-form').hover();
      await page.getByLabel('designer-schema-settings-CardItem-FormV2.Designer-general').hover();
    }
  });

  test.describe('form data templates', () => {
    test('basic usage', async ({ page, mockPage, mockRecords }) => {
      const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndBasicFields).waitForInit();
      const records = await mockRecords('general', 3);
      await nocoPage.goto();

      const record = records.find((item) => item.id === 2);

      const openDialog = async () => {
        await page.getByLabel('block-item-CardItem-general-form').hover();
        await page.getByLabel('designer-schema-settings-CardItem-FormV2.Designer-general').hover();
        await page.getByRole('menuitem', { name: 'Form data templates' }).click();
      };

      await page.getByRole('button', { name: 'Add new' }).click();
      await openDialog();
      await page.getByRole('button', { name: 'plus Add template' }).click();

      // 非继承表是不需要显示 Collection 选项的
      await expect(page.getByText('Collection:')).toBeHidden();

      // 添加一个数据范围，条件是：ID = 2
      await page.getByText('Add condition', { exact: true }).click();
      await page.getByTestId('select-filter-field').click();
      await page.getByRole('menuitemcheckbox', { name: 'ID', exact: true }).click();
      await page.getByLabel('Form data templates').getByRole('spinbutton').click();
      await page.getByLabel('Form data templates').getByRole('spinbutton').fill('2');

      // 选择 ID 作为 title field
      await page.getByTestId('select-single').click();
      await page.getByRole('option', { name: 'ID', exact: true }).click();

      // 仅选中一个字段
      await page.getByRole('button', { name: 'singleLineText (Duplicate)' }).click();

      // 保存
      await page.getByRole('button', { name: 'OK', exact: true }).click();

      // 保存成功后应该显示 Data template 选项
      await expect(page.getByText('Data template:')).toBeVisible();

      // 选择一个模板
      await page.getByTestId('select-form-data-template').click();
      await page.getByRole('option', { name: 'Template name 1' }).click();
      await page.getByTestId('select-object-single').click();

      // 因为添加了数据范围，所以只显示一个选项
      await expect(page.getByRole('option')).toHaveCount(1);

      // 选中数据
      await page.getByRole('option', { name: '2' }).click();

      await expect(
        page
          .getByLabel('block-item-CollectionField-general-form-general.singleLineText-singleLineText')
          .getByRole('textbox'),
      ).toHaveValue(record.singleLineText);

      // 其它未选中的字段的数据应该是空的
      await expect(
        page.getByLabel('block-item-CollectionField-general-form-general.integer-integer').getByRole('spinbutton'),
      ).toBeEmpty();

      // 同步表单字段
      await openDialog();
      await page.getByLabel('action-Action.Link-Sync from form fields-general').click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();

      // 重新选择一下数据，字段值才会被填充
      // TODO: 保存后，数据应该直接被填充上
      await page.getByLabel('icon-close-select').last().click();
      await page.getByTestId('select-object-single').click();
      await page.getByRole('option', { name: '2' }).click();

      await expect(
        page.getByLabel('block-item-CollectionField-general-form-general.email-email').getByRole('textbox'),
      ).toHaveValue(record.email);
      await expect(
        page.getByLabel('block-item-CollectionField-general-form-general.integer-integer').getByRole('spinbutton'),
      ).toHaveValue(String(record.integer));
      await expect(
        page.getByLabel('block-item-CollectionField-general-form-general.number-number').getByRole('spinbutton'),
      ).toHaveValue(String(record.number));

      // 隐藏模板选项
      await openDialog();
      await page.getByLabel('Enable form data template').click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();

      await expect(page.getByText('Data template:')).toBeHidden();
    });
  });

  test.skip('save block template & using block template', async ({ page, mockPage, clearBlockTemplates }) => {
    // 确保测试结束后已保存的模板会被清空
    await clearBlockTemplates();
    const nocoPage = await mockPage({
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
            'x-initializer': 'page:addBlock',
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
                                'x-initializer': 'form:configureFields',
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
                                'x-initializer': 'createForm:configureActions',
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
    }).waitForInit();
    await nocoPage.goto();
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
    await expect(page.getByLabel('block-item-CardItem-users-form')).toHaveText(/Reference template/);

    // using block template
    await mockPage({
      pageSchema: {
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
            'x-initializer': 'page:addBlock',
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
                            'x-initializer': 'table:configureActions',
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
                                                'x-initializer': 'popup:addNew:addBlock',
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
                            'x-initializer': 'table:configureColumns',
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
                                'x-initializer': 'table:configureItemActions',
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
                                                        'x-initializer': 'popup:common:addBlock',
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
      },
    }).goto();

    await page.getByLabel('schema-initializer-Grid-page:addBlock').hover();
    //使用复制模板
    await page.getByRole('menuitem', { name: 'form Form' }).first().hover();
    await page.getByRole('menuitem', { name: 'Users' }).hover();
    await page.getByRole('menuitem', { name: 'Duplicate template' }).hover();
    await page.getByRole('menuitem', { name: 'Users_Form (Fields only)' }).first().click();
    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CardItem-users-form')).toBeVisible();

    //在新建操作中使用引用模板
    await page.getByLabel('action-Action-Add new-create-users-table').click();
    await page.getByLabel('schema-initializer-Grid-popup:addNew:addBlock-users').hover();
    await page.getByRole('menuitem', { name: 'form Form' }).first().hover();
    await page.getByRole('menuitem', { name: 'Current collection' }).hover();
    await page.getByRole('menuitem', { name: 'Reference template' }).hover();
    await page.getByRole('menuitem', { name: 'Users_Form (Fields only)' }).first().click();
    await page.mouse.move(300, 0);
    await page.getByLabel('schema-initializer-Grid-popup:addNew:addBlock-users').hover();
    await expect(page.locator('.ant-drawer').getByLabel('block-item-CardItem-users-form')).toBeVisible();
    await page.locator('.ant-drawer-mask').click();

    //在编辑操作中使用引用模板
    await page.getByLabel('action-Action.Link-Edit-update-users-table-0').click();
    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-users').click();
    await page.getByRole('menuitem', { name: 'form Form (Edit)' }).first().hover();
    await page.getByRole('menuitem', { name: 'Reference template' }).hover();
    await page.getByRole('menuitem', { name: 'Users_Form (Fields only)' }).first().click();
    await page.mouse.move(300, 0);

    // 使用模板创建一个新增表单
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'form Form (Add new) right' }).hover();
    await page.getByRole('menuitem', { name: 'Other records right' }).hover();
    await page.getByRole('menuitem', { name: 'Users right' }).hover();
    await page.getByRole('menuitem', { name: 'Duplicate template right' }).hover();
    await page.getByRole('menuitem', { name: 'Users_Form (Fields only)' }).click();
    await expect(
      page.getByTestId('drawer-Action.Container-users-Edit record').getByLabel('block-item-CollectionField-'),
    ).toHaveCount(2);

    //修改引用模板
    await page.locator('.ant-drawer').getByLabel('schema-initializer-Grid-form:configureFields-users').first().hover();
    await page.getByRole('menuitem', { name: 'Phone' }).click();
    await page.locator('.ant-drawer-mask').click();
    //复制模板不同步，引用模板同步
    await expect(
      page.getByLabel('block-item-CardItem-users-form').getByLabel('block-item-CollectionField-users-form-users.phone'),
    ).not.toBeVisible();
    await page.getByLabel('block-item-CardItem-users-table').getByLabel('action-Action-Add').click();
    await expect(page.getByLabel('block-item-CollectionField-users-form-users.phone')).toBeVisible();
    await page.locator('.ant-drawer-mask').click();
  });
});
