import { Page, expect, expectSettingsMenu, oneEmptyTableBlockWithActions, test } from '@nocobase/test/e2e';

test.describe('where single data details block can be added', () => {
  test('popup', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await page.getByLabel('action-Action.Link-View-view-general-table-0').click();
    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-general').hover();
    await page.getByRole('menuitem', { name: 'Details' }).hover();
    await page.getByRole('menuitem', { name: 'Current record' }).click();
    await page.mouse.move(300, 0);

    await expect(page.getByLabel('block-item-CardItem-general-details')).toBeVisible();
  });

  // https://nocobase.height.app/T-3848/description
  test('popup opened by clicking on the button for the relationship field', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage({
      collections: [
        {
          name: 'example',
          fields: [
            {
              name: 'manyToOne',
              interface: 'm2o',
              target: 'example',
            },
            {
              name: 'singleLineText',
              interface: 'input',
            },
          ],
        },
      ],
      pageSchema: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Page',
        properties: {
          nzmrteziofg: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'page:addBlock',
            properties: {
              zzpze3c8oge: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Row',
                properties: {
                  ndgxtl4rvu3: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-component': 'Grid.Col',
                    properties: {
                      wvab22d93e8: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-decorator': 'TableBlockProvider',
                        'x-acl-action': 'example:list',
                        'x-use-decorator-props': 'useTableBlockDecoratorProps',
                        'x-decorator-props': {
                          collection: 'example',
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
                            'x-uid': '0clfl0oxnwf',
                            'x-async': false,
                            'x-index': 1,
                          },
                          gnd7uoea2zu: {
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
                                  x59rltkm59a: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-decorator': 'DndContext',
                                    'x-component': 'Space',
                                    'x-component-props': {
                                      split: '|',
                                    },
                                    'x-uid': 'rggytn82ilc',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': '3d6k1i1jx7v',
                                'x-async': false,
                                'x-index': 1,
                              },
                              uvhs4tg6nwm: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-decorator': 'TableV2.Column.Decorator',
                                'x-toolbar': 'TableColumnSchemaToolbar',
                                'x-settings': 'fieldSettings:TableColumn',
                                'x-component': 'TableV2.Column',
                                properties: {
                                  manyToOne: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    'x-collection-field': 'example.manyToOne',
                                    'x-component': 'CollectionField',
                                    'x-component-props': {
                                      fieldNames: {
                                        value: 'id',
                                        label: 'id',
                                      },
                                      ellipsis: true,
                                      size: 'small',
                                    },
                                    'x-read-pretty': true,
                                    'x-decorator': null,
                                    'x-decorator-props': {
                                      labelStyle: {
                                        display: 'none',
                                      },
                                    },
                                    properties: {
                                      pt0gyfcniz8: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        title: '{{ t("View record") }}',
                                        'x-component': 'AssociationField.Viewer',
                                        'x-component-props': {
                                          className: 'nb-action-popup',
                                        },
                                        'x-index': 1,
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
                                                    'x-uid': 'g9v1ckltvex',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'pz1l8oq2ya7',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': '58x2e3ugg1q',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'bdpjlroyuum',
                                        'x-async': false,
                                      },
                                    },
                                    'x-uid': 'ly8hdsl4jjo',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'yu5bgkjqhu8',
                                'x-async': false,
                                'x-index': 2,
                              },
                            },
                            'x-uid': 'l3onkna9ido',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'ee81h3nx17g',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'l6h63fsseo7',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'zu4jp6j2avg',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'fd3cw6sti4y',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': '7c28d1jik0y',
        'x-async': true,
        'x-index': 1,
      },
    }).waitForInit();
    await mockRecord('example');
    await nocoPage.goto();

    // 1.打开弹窗
    await page.getByRole('button', { name: '2', exact: true }).getByText('2').click();

    // 2.通过 Current record 创建一个详情区块
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'table Details right' }).hover();
    await page.getByRole('menuitem', { name: 'Current record' }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('schema-initializer-Grid-details:configureFields-example').hover();
    await page.getByRole('menuitem', { name: 'ID' }).click();
    await page.mouse.move(300, 0);
    await expect(page.getByLabel('block-item-CollectionField-').getByText('2')).toBeVisible();

    // 3.通过 Associated records 创建一个详情区块
    await page.getByLabel('schema-initializer-Grid-popup').hover();
    await page.getByRole('menuitem', { name: 'table Details right' }).hover();
    await page.getByRole('menuitem', { name: 'Associated records' }).hover();
    await page.getByRole('menuitem', { name: 'manyToOne' }).click();
    await page.mouse.move(300, 0);
    await page.getByLabel('schema-initializer-Grid-details:configureFields-example').nth(1).hover();
    await page.getByRole('menuitem', { name: 'ID' }).click();
    await page.mouse.move(300, 0);
    // id 为 2 的记录的关系字段对应的是 3。但是如果 mockRecord 的逻辑变更的话，这里可能会有问题
    await expect(page.getByLabel('block-item-CollectionField-').nth(1).getByText('3')).toBeVisible();
  });
});

test.describe('configure actions', () => {
  test('edit & delete & duplicate & print & customize', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneEmptyTableBlockWithActions).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await page.getByLabel('action-Action.Link-View-view-general-table-0').click();
    await page.getByLabel('schema-initializer-Grid-popup:common:addBlock-general').hover();
    await page.getByRole('menuitem', { name: 'Details' }).hover();
    await page.getByRole('menuitem', { name: 'Current record' }).click();
    await page.mouse.move(300, 0);

    // create edit ------------------------------------------------------------------------------------
    await createAction(page, 'Edit');
    await expect(page.getByLabel('action-Action-Edit-update-')).toBeVisible();
    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('action-Action-Edit-update-').hover();
        await page.getByRole('button', { name: 'designer-schema-settings-Action-actionSettings:edit-general' }).hover();
      },
      supportedOptions: ['Edit button', 'Linkage rules', 'Open mode', 'Popup size', 'Delete'],
    });
    await deleteAction(page, 'action-Action-Edit-update-');

    // create delete ------------------------------------------------------------------------------------
    await createAction(page, 'Delete');
    await expect(page.getByLabel('action-Action-Delete-destroy-general-details-')).toBeVisible();

    // create print
    await createAction(page, 'Print');
    await expect(page.getByLabel('action-Action-Print-print-')).toBeVisible();

    // create customize actions ----------------------------------------------------------------------------
    // Popup
    await createCustomAction(page, 'Popup');
    await expect(page.getByLabel('action-Action-Popup-customize')).toBeVisible();

    // Update record
    await createCustomAction(page, 'Update record');
    await expect(page.getByLabel('action-Action-Update record-')).toBeVisible();
  });
});

test.describe('configure fields', () => {});

async function createAction(page: Page, name: string) {
  await page.getByLabel('schema-initializer-ActionBar-details:configureActions-general').hover();
  await page.getByRole('menuitem', { name: name }).click();
  await expect(page.getByRole('menuitem', { name: name }).getByRole('switch')).toBeChecked();
  await page.mouse.move(300, 0);
}

async function createCustomAction(page: Page, name: string) {
  await page.getByLabel('schema-initializer-ActionBar-details:configureActions-general').hover();
  await page.getByRole('menuitem', { name: 'Customize' }).hover();
  await page.getByRole('menuitem', { name: name }).click();
  await page.mouse.move(0, 400);
}

async function deleteAction(page: Page, label: string) {
  await page.getByLabel(label).hover();
  await page.getByRole('button', { name: 'designer-schema-settings-Action-' }).hover();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.mouse.move(0, 300);
  await page.getByRole('button', { name: 'OK', exact: true }).click();
}
