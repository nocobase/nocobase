import { enableToConfig, expect, test } from '@nocobase/test/client';
const tablePageSchema = {
  _isJSONSchemaObject: true,
  version: '2.0',
  type: 'void',
  'x-component': 'Page',
  properties: {
    '3r0yxum84w2': {
      _isJSONSchemaObject: true,
      version: '2.0',
      type: 'void',
      'x-component': 'Grid',
      'x-initializer': 'BlockInitializers',
      properties: {
        vduni5v1u2v: {
          _isJSONSchemaObject: true,
          version: '2.0',
          type: 'void',
          'x-component': 'Grid.Row',
          properties: {
            qwrauugqc1k: {
              _isJSONSchemaObject: true,
              version: '2.0',
              type: 'void',
              'x-component': 'Grid.Col',
              properties: {
                '92vs3ej14vo': {
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
                      'x-uid': 'gzu2uanef12',
                      'x-async': false,
                      'x-index': 1,
                    },
                    vlkh4fiq98e: {
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
                              'x-uid': 'q44b0dv50za',
                              'x-async': false,
                              'x-index': 1,
                            },
                          },
                          'x-uid': 'i8tnis8ymcm',
                          'x-async': false,
                          'x-index': 1,
                        },
                      },
                      'x-uid': 'u60i2x1lo97',
                      'x-async': false,
                      'x-index': 2,
                    },
                  },
                  'x-uid': '6jb6jfh1770',
                  'x-async': false,
                  'x-index': 1,
                },
              },
              'x-uid': '9oykdej2ufq',
              'x-async': false,
              'x-index': 1,
            },
          },
          'x-uid': '8iolmzoelll',
          'x-async': false,
          'x-index': 1,
        },
      },
      'x-uid': '0dhkzj75zh7',
      'x-async': false,
      'x-index': 1,
    },
  },
  'x-uid': 'n8gs3wg1sxp',
  'x-async': true,
  'x-index': 1,
};

test.describe('add action & remove action', () => {
  test('add action & remove action in block', async ({ page, mockPage }) => {
    await mockPage({ pageSchema: tablePageSchema }).goto();
    await page.getByTestId('table-block-users').click();
    await page.getByTestId('configure-actions-button-of-table-block-users').hover();
    //添加按钮
    await page.getByRole('menuitem', { name: 'Filter' }).click();
    await page.getByRole('menuitem', { name: 'Add new' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByTestId('configure-actions-button-of-table-block-users').hover();
    await page.getByText('Enable actions').hover();
    await page.waitForTimeout(1000); // 等待1秒钟

    await expect(page.getByTestId('table-block-users').getByLabel('Filter', { exact: true })).toBeVisible();
    await expect(page.getByTestId('table-block-users').getByRole('button', { name: 'plus Add new' })).toBeVisible();
    await expect(page.getByTestId('table-block-users').getByLabel('Delete', { exact: true })).toBeVisible();
    await expect(await page.getByRole('menuitem', { name: 'Filter' }).getByRole('switch').isChecked()).toBe(true);
    await expect(await page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch').isChecked()).toBe(true);
    await expect(await page.getByRole('menuitem', { name: 'Delete' }).getByRole('switch').isChecked()).toBe(true);
    //移除按钮
    await page.getByRole('menuitem', { name: 'Filter' }).click();
    await page.getByRole('menuitem', { name: 'Add new' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await expect(page.getByTestId('table-block-users').getByRole('button', { name: 'plus Add new' })).not.toBeVisible();
    await expect(page.getByTestId('table-block-users').getByRole('button', { name: 'Delete' })).not.toBeVisible();
    await expect(page.getByTestId('table-block-users').getByLabel('Filter', { exact: true })).not.toBeVisible();
  });
});

test.describe('action drag in block', () => {
  test('drag th action orders', async ({ page, mockPage }) => {
    await mockPage({ pageSchema: tablePageSchema }).goto();
    await page.getByTestId('table-block-users').click();
    await page.getByTestId('configure-actions-button-of-table-block-users').hover();
    //添加按钮
    await page.getByRole('menuitem', { name: 'Add new' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('menuitem', { name: 'Refresh' }).click();
    await page.getByTestId('configure-actions-button-of-table-block-users').hover();
    await page.getByText('Enable actions').hover();
    await page.waitForTimeout(1000); // 等待1秒钟

    const addNewBtn = page.getByTestId('table-block-users').getByRole('button', { name: 'plus Add new' });
    await addNewBtn.hover();
    const addNewDrag = await page
      .getByTestId('table-block-users')
      .getByRole('button', { name: 'plus Add new' })
      .getByLabel('designer-drag');
    await addNewDrag.hover();

    const delBtn = await page.getByLabel('Delete', { exact: true });
    await addNewDrag.dragTo(delBtn);
    const refreshBtn = await page.getByLabel('Refresh');
    await addNewBtn.hover();
    await addNewBtn.getByLabel('designer-drag').dragTo(refreshBtn);

    const addNew = await addNewBtn.boundingBox();
    const del = await delBtn.boundingBox();
    const refresh = await refreshBtn.boundingBox();
    const max = Math.max(addNew.x, refresh.x, del.x);
    //拖拽调整排序符合预期
    await expect(addNew.x).toBe(max);
  });
});

test.describe('action display config', () => {
  test('editing action name,icon and color', async ({ page, mockPage }) => {
    await mockPage({ pageSchema: tablePageSchema }).goto();
    await page.getByTestId('table-block-users').click();
    await page.getByTestId('configure-actions-button-of-table-block-users').hover();
    //添加按钮
    await page.getByRole('menuitem', { name: 'Add new' }).click();
    await page.getByTestId('table-block-users').getByRole('button', { name: 'plus Add new' }).hover();
    await page
      .getByTestId('table-block-users')
      .getByRole('button', { name: 'plus Add new' })
      .getByLabel('designer-schema-settings')
      .click();
    //更新按钮图标、名称、样式
    await page.getByText('Edit button').click();
    await page.getByRole('textbox').fill('Add new1');
    await page.getByRole('button', { name: 'close', exact: true }).click();
    await page.getByRole('button', { name: 'Select icon', exact: true }).click();
    await page.getByLabel('user-add').click();
    await page.getByLabel('Danger red').check();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(
      await page.getByTestId('table-block-users').locator('.nb-action-bar').getByLabel('user-add'),
    ).toBeVisible();
    await expect(
      page.getByTestId('table-block-users').locator('.nb-action-bar').locator('.ant-btn-dangerous'),
    ).toBeVisible();
  });
  test('action open mode ', async ({ page, mockPage }) => {
    await mockPage({ pageSchema: tablePageSchema }).goto();
    await page.getByTestId('table-block-users').click();
    await page.getByTestId('configure-actions-button-of-table-block-users').hover();
    //添加按钮
    await page.getByRole('menuitem', { name: 'Add new' }).click();
    await page.getByTestId('table-block-users').getByRole('button', { name: 'plus Add new' }).hover();
    await page
      .getByTestId('table-block-users')
      .getByRole('button', { name: 'plus Add new' })
      .getByLabel('designer-schema-settings')
      .click();

    await page.getByTestId('table-block-users').getByRole('button', { name: 'plus Add new' }).click();
    await expect(await page.getByTestId('action-drawer')).toBeVisible();

    //更新按钮打开方式
    await page.getByRole('menuitem', { name: 'Open mode Search Drawer' }).click();
    await page.getByRole('option', { name: 'Dialog' }).click();
    await page.getByTestId('table-block-users').getByRole('button', { name: 'plus Add new' }).click();
    // 验证打开的组件的角色为 "dialog"
    const drawerComponent = page.getByRole('dialog');
    await expect(drawerComponent).toBeInViewport();
  });
  test('setting action model size', async ({ page, mockPage }) => {
    await mockPage({ pageSchema: tablePageSchema }).goto();
  });
});

test.describe('action linkage rule', () => {
  test('action linkage to hide', async ({ page, mockPage }) => {
    await mockPage({ pageSchema: tablePageSchema }).goto();
  });
  test('action linkage to disabled', async ({ page, mockPage }) => {
    await mockPage({ pageSchema: tablePageSchema }).goto();
  });
});
