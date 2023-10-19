import { enableToConfig, expect, test } from '@nocobase/test/client';
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
test.describe('add action & remove action', () => {
  test('add action & remove action in block', async ({ page, mockPage }) => {
    await mockPage({ pageSchema: tablePageSchema }).goto();
  });
});

test.describe('action drag in block', () => {
  test('drag th action orders', async ({ page, mockPage }) => {
    await mockPage({ pageSchema: tablePageSchema }).goto();
  });
});

test.describe('action display config', () => {
  test('editing action name,icon and color', async ({ page, mockPage }) => {
    await mockPage({ pageSchema: tablePageSchema }).goto();
  });
  test('action open mode ', async ({ page, mockPage }) => {
    await mockPage({
      pageSchema: {
        'x-uid': 'h8q2mcgo3cq',
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Page',
        'x-component-props': {
          enablePageTabs: true,
        },
        properties: {
          bi8ep3svjee: {
            'x-uid': '9kr7xm9x4ln',
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'BlockInitializers',
            title: 'tab 1',
            'x-async': false,
            'x-index': 1,
          },
          rw91udnzpr3: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            title: 'tab 2',
            'x-component': 'Grid',
            'x-initializer': 'BlockInitializers',
            'x-uid': 'o5vp90rqsjx',
            'x-async': false,
            'x-index': 2,
          },
        },
        'x-async': true,
        'x-index': 1,
      },
    }).goto();

    const sourceElement = await page.locator('span:has-text("tab 2")');
    await sourceElement.hover();
    const source = await page.getByRole('button', { name: 'drag' });
    await source.hover();
    const targetElement = await page.locator('span:has-text("tab 1")');
    const sourceBoundingBox = await sourceElement.boundingBox();
    const targetBoundingBox = await targetElement.boundingBox();
    //拖拽前 1-2
    expect(targetBoundingBox.x).toBeLessThan(sourceBoundingBox.x);
    await source.dragTo(targetElement);
    await sourceElement.dragTo(targetElement);
    await page.waitForTimeout(1000); // 等待1秒钟
    const tab2 = await page.locator('span:has-text("tab 2")').boundingBox();
    const tab1 = await page.locator('span:has-text("tab 1")').boundingBox();
    //拖拽后 2-1
    await expect(tab2.x).toBeLessThan(tab1.x);
  });
  test('setting action model size', async ({ page, mockPage }) => {
    await mockPage({
      pageSchema: {
        'x-uid': 'h8q2mcgo3cq',
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Page',
        'x-component-props': {
          enablePageTabs: true,
        },
        properties: {
          bi8ep3svjee: {
            'x-uid': '9kr7xm9x4ln',
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'BlockInitializers',
            title: 'tab 1',
            'x-async': false,
            'x-index': 1,
          },
          rw91udnzpr3: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            title: 'tab 2',
            'x-component': 'Grid',
            'x-initializer': 'BlockInitializers',
            'x-uid': 'o5vp90rqsjx',
            'x-async': false,
            'x-index': 2,
          },
        },
        'x-async': true,
        'x-index': 1,
      },
    }).goto();

    const sourceElement = await page.locator('span:has-text("tab 2")');
    await sourceElement.hover();
    const source = await page.getByRole('button', { name: 'drag' });
    await source.hover();
    const targetElement = await page.locator('span:has-text("tab 1")');
    const sourceBoundingBox = await sourceElement.boundingBox();
    const targetBoundingBox = await targetElement.boundingBox();
    //拖拽前 1-2
    expect(targetBoundingBox.x).toBeLessThan(sourceBoundingBox.x);
    await source.dragTo(targetElement);
    await sourceElement.dragTo(targetElement);
    await page.waitForTimeout(1000); // 等待1秒钟
    const tab2 = await page.locator('span:has-text("tab 2")').boundingBox();
    const tab1 = await page.locator('span:has-text("tab 1")').boundingBox();
    //拖拽后 2-1
    await expect(tab2.x).toBeLessThan(tab1.x);
  });
});

test.describe('action linkage rule', () => {
  test('action linkage to hide', async ({ page, mockPage }) => {
    await mockPage({ name: 'page tab' }).goto();
    await enableToConfig(page);
    await page
      .locator('div')
      .filter({ hasText: /^page tab$/ })
      .nth(3)
      .click();
    await page.getByTestId('page-designer-button').locator('path').hover();
    //默认不启用
    await expect(page.getByRole('menuitem', { name: 'Enable page tabs' }).getByRole('switch')).not.toBeChecked();
    //启用标签
    await page.getByText('Enable page tabs').click();
    await expect(page.getByRole('tab').locator('div').filter({ hasText: 'Unnamed' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'plus Add tab' })).toBeVisible();
    await page.getByRole('tab').locator('div').filter({ hasText: 'Unnamed' }).click();
    await expect(page.getByTestId('add-block-button-in-page')).toBeVisible();

    //添加新的tab
    await page.getByRole('button', { name: 'plus Add tab' }).click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('page tab 1');
    await page.getByRole('button', { name: 'OK' }).click();
    await page.getByText('page tab 1').click();
    await page.getByRole('button', { name: 'plus Add tab' }).click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('page tab 2');
    await page.getByRole('button', { name: 'OK' }).click();
    await page.getByText('page tab 2').click();

    await page.waitForTimeout(1000); // 等待1秒钟
    const tabMenuItem = await page.getByRole('tab').locator('div > span').filter({ hasText: 'page tab 2' });
    const tabMenuItemActivedColor = await tabMenuItem.evaluate((element) => {
      const computedStyle = window.getComputedStyle(element);
      return computedStyle.color;
    });
    await expect(page.getByText('page tab 1')).toBeVisible();
    await expect(page.getByText('page tab 2')).toBeVisible();
    await expect(page.getByTestId('add-block-button-in-page')).toBeVisible();
    await expect(tabMenuItemActivedColor).toBe('rgb(22, 119, 255)');

    //修改tab名称
    await page.getByText('Unnamed').click();
    await page.getByText('Unnamed').hover();
    await page.getByRole('button', { name: 'menu', exact: true }).hover();
    await page.getByText('Edit', { exact: true }).click();
    await page.getByRole('textbox').fill('page tab');
    await page.getByRole('button', { name: 'OK' }).click();

    const tabMenuItem1 = await page.getByRole('tab').getByText('page tab', { exact: true });
    const tabMenuItemActivedColor1 = await tabMenuItem1.evaluate((element) => {
      const computedStyle = window.getComputedStyle(element);
      return computedStyle.color;
    });
    await expect(tabMenuItem1).toBeVisible();
    await expect(page.getByTestId('add-block-button-in-page')).toBeVisible();
    await expect(tabMenuItemActivedColor1).toBe('rgb(22, 119, 255)');

    //删除 tab
    await page.getByRole('tab').getByText('page tab', { exact: true }).click();
    await page.getByRole('tab').getByText('page tab', { exact: true }).hover();
    await page.getByRole('button', { name: 'menu', exact: true }).hover();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByRole('tab').getByText('page tab', { exact: true })).not.toBeVisible();
    await page.getByRole('tab').getByText('page tab 1').click();

    //禁用标签
  });
  test('action linkage to disabled', async ({ page, mockPage }) => {
    await mockPage({
      pageSchema: {
        'x-uid': 'h8q2mcgo3cq',
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Page',
        'x-component-props': {
          enablePageTabs: true,
        },
        properties: {
          bi8ep3svjee: {
            'x-uid': '9kr7xm9x4ln',
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'BlockInitializers',
            title: 'tab 1',
            'x-async': false,
            'x-index': 1,
          },
          rw91udnzpr3: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            title: 'tab 2',
            'x-component': 'Grid',
            'x-initializer': 'BlockInitializers',
            'x-uid': 'o5vp90rqsjx',
            'x-async': false,
            'x-index': 2,
          },
        },
        'x-async': true,
        'x-index': 1,
      },
    }).goto();

    const sourceElement = await page.locator('span:has-text("tab 2")');
    await sourceElement.hover();
    const source = await page.getByRole('button', { name: 'drag' });
    await source.hover();
    const targetElement = await page.locator('span:has-text("tab 1")');
    const sourceBoundingBox = await sourceElement.boundingBox();
    const targetBoundingBox = await targetElement.boundingBox();
    //拖拽前 1-2
    expect(targetBoundingBox.x).toBeLessThan(sourceBoundingBox.x);
    await source.dragTo(targetElement);
    await sourceElement.dragTo(targetElement);
    await page.waitForTimeout(1000); // 等待1秒钟
    const tab2 = await page.locator('span:has-text("tab 2")').boundingBox();
    const tab1 = await page.locator('span:has-text("tab 1")').boundingBox();
    //拖拽后 2-1
    await expect(tab2.x).toBeLessThan(tab1.x);
  });
});
