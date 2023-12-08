import { expect, test } from '@nocobase/test/client';
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
    await page.getByLabel('block-item-CardItem-users-table').click();
    await page.getByLabel('schema-initializer-ActionBar-TableActionInitializers-users').click();
    //添加按钮
    await page.getByRole('menuitem', { name: 'Filter' }).click();
    await page.getByRole('menuitem', { name: 'Add new' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByLabel('schema-initializer-ActionBar-TableActionInitializers-users').hover();
    await page.getByText('Enable actions').hover();
    await expect(page.getByLabel('action-Filter.Action-Filter-filter-users-table')).toBeVisible();
    await expect(page.getByLabel('action-Action-Add new-create-users-table')).toBeVisible();
    await expect(page.getByLabel('action-Action-Delete-destroy-users-table')).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Filter' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Delete' }).getByRole('switch')).toBeChecked();
    //移除按钮
    await page.getByRole('menuitem', { name: 'Filter' }).click();
    await page.getByRole('menuitem', { name: 'Add new' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await expect(page.getByLabel('action-Action-Add new-create-users-table')).not.toBeVisible();
    await expect(
      page.getByLabel('block-item-CardItem-users-table').getByRole('button', { name: 'Delete' }),
    ).not.toBeVisible();
    await expect(
      page.getByLabel('block-item-CardItem-users-table').getByLabel('Filter', { exact: true }),
    ).not.toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Filter' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Add new' }).getByRole('switch')).not.toBeChecked();
    await expect(page.getByRole('menuitem', { name: 'Delete' }).getByRole('switch')).not.toBeChecked();
  });
});

test.describe('action drag in block', () => {
  test('drag th action orders', async ({ page, mockPage }) => {
    await mockPage({ pageSchema: tablePageSchema }).goto();
    await page.getByLabel('schema-initializer-ActionBar-TableActionInitializers-users').hover();
    //添加按钮
    await page.getByRole('menuitem', { name: 'Add new' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('menuitem', { name: 'Refresh' }).click();
    // 向右挪动鼠标指针，用以关闭下拉列表
    await page.mouse.move(300, 0);

    const addNewBtn = await page.getByLabel('action-Action-Add new-create-users-table');
    await addNewBtn.hover();
    const addNewDrag = await page.getByLabel('action-Action-Add new-create-users-table').getByLabel('designer-drag');
    await addNewDrag.hover();

    const delBtn = await page.getByLabel('action-Action-Delete-destroy-users-table');
    await addNewDrag.dragTo(delBtn);
    const refreshBtn = await page.getByLabel('action-Action-Refresh-refresh-users-table');
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
    await page.getByLabel('schema-initializer-ActionBar-TableActionInitializers-users').hover();
    //添加按钮
    await page.getByRole('menuitem', { name: 'Add new' }).click();
    await page.getByLabel('action-Action-Add new-create-users-table').hover();
    await page.getByLabel('action-Action-Add new-create-users-table').getByLabel('designer-schema-settings').hover();
    //更新按钮图标、名称、样式
    await page.getByRole('menuitem', { name: 'Edit button' }).click();
    await page.getByRole('textbox').fill('Add new1');
    await page.getByRole('button', { name: 'close', exact: true }).click();
    await page.getByRole('button', { name: 'Select icon', exact: true }).click();
    await page.getByLabel('user-add').click();
    await page.getByLabel('Danger red').check();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(
      page.getByLabel('block-item-CardItem-users-table').locator('.nb-action-bar').getByLabel('user-add'),
    ).toBeVisible();
    await expect(
      page.getByLabel('block-item-CardItem-users-table').locator('.nb-action-bar').locator('.ant-btn-dangerous'),
    ).toBeVisible();
  });
  test('action open mode ', async ({ page, mockPage }) => {
    await mockPage({ pageSchema: tablePageSchema }).goto();
    await page.getByLabel('schema-initializer-ActionBar-TableActionInitializers-users').hover();
    //添加按钮
    await page.getByRole('menuitem', { name: 'Add new' }).click();
    await page.getByLabel('action-Action-Add new-create-users-table').click();
    await expect(page.locator('.ant-drawer')).toBeVisible();

    //更新按钮打开方式
    await page.locator('.ant-drawer-mask').click();
    await page.getByLabel('action-Action-Add new-create-users-table').hover();
    await page.getByRole('button', { name: 'designer-schema-settings-Action-Action.Designer-users' }).hover();
    await page.getByRole('menuitem', { name: 'Open mode' }).click();
    await page.getByRole('option', { name: 'Dialog' }).click();
    await page.getByLabel('action-Action-Add new-create-users-table').click();
    const drawerComponent = page.getByTestId('modal-Action.Container-users-Add record');
    await expect(drawerComponent).toBeInViewport();
  });
  test('setting action model size', async ({ page, mockPage }) => {
    await mockPage({ pageSchema: tablePageSchema }).goto();
    await page.getByLabel('schema-initializer-ActionBar-TableActionInitializers-users').hover();
    //添加按钮
    await page.getByRole('menuitem', { name: 'Add new' }).click();
    await page.getByLabel('action-Action-Add new-create-users-table').click();
    await expect(page.locator('.ant-drawer')).toBeVisible();
    await page.locator('.ant-drawer-mask').click();
    //修改尺寸
    await page.getByLabel('action-Action-Add new-create-users-table').hover();
    await page.getByRole('button', { name: 'designer-schema-settings-Action-Action.Designer-users' }).hover();
    await page.getByRole('menuitem', { name: 'Popup size' }).click();

    //默认尺寸为Middle
    await expect(page.getByTitle('Popup size').locator('.ant-select-selection-item')).toHaveText('Middle');
    //设置为large
    await page.getByRole('option', { name: 'Large' }).click();

    await page.getByLabel('action-Action-Add new-create-users-table').click();
    const drawerItem = page.locator('.ant-drawer > .ant-drawer-content-wrapper');
    const drawerWidth = await drawerItem.evaluate((element) => {
      const computedStyle = window.getComputedStyle(element);
      const parent = element.parentElement;
      const parentWidth = window.getComputedStyle(parent).getPropertyValue('width');
      const percentageWidth = (parseFloat(computedStyle.width) / parseFloat(parentWidth)) * 100;
      return percentageWidth;
    });
    //宽度为70%
    expect(drawerWidth).toBe(70);
  });
});

test.describe('action linkage rule', () => {
  test('action linkage to hide', async ({ page, mockPage }) => {
    await mockPage({ pageSchema: tablePageSchema }).goto();
    await page
      .getByLabel('block-item-CardItem-users-table')
      .getByRole('button', { name: 'Actions', exact: true })
      .hover();
    await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-users').hover();
    await page.getByRole('menuitem', { name: 'View' }).click();
    await page.getByLabel('block-item-CardItem-users-table').getByLabel('View').hover();
    await page.getByLabel('View').getByLabel('designer-schema-settings').hover();
    await page.getByRole('menuitem', { name: 'Linkage rules' }).click();
    await page.getByRole('button', { name: 'plus Add linkage rule', exact: true }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByTitle('ID', { exact: true }).getByText('ID').click();
    await page.getByRole('spinbutton').fill('1');
    await page.getByText('Add property').click();
    await page.getByTestId('select-linkage-properties').click();
    await page.getByText('Hidden').click();
    await page.locator('.ant-modal').getByRole('button', { name: 'OK', exact: true }).click();
    //配置中，按钮显示半透明
    const actionItem = page.getByLabel('block-item-CardItem-users-table').getByLabel('View');
    const inputErrorBorderColor = await actionItem.evaluate((element) => {
      const computedStyle = window.getComputedStyle(element);
      return computedStyle.opacity;
    });
    expect(inputErrorBorderColor).toBe('0.1');
    //使用中，按钮隐藏
    await page.getByRole('button', { name: 'highlight' }).click();
    await expect(page.getByLabel('block-item-CardItem-users-table').getByLabel('View')).not.toBeVisible();
  });
  test('action linkage to disabled', async ({ page, mockPage }) => {
    await mockPage({ pageSchema: tablePageSchema }).goto();
    await page
      .getByLabel('block-item-CardItem-users-table')
      .getByRole('button', { name: 'Actions', exact: true })
      .hover();
    await page.getByLabel('designer-schema-settings-TableV2.Column-TableV2.ActionColumnDesigner-users').hover();
    await page.getByRole('menuitem', { name: 'View' }).click();
    await page.getByLabel('block-item-CardItem-users-table').getByLabel('View').hover();
    await page.getByLabel('View').getByLabel('designer-schema-settings').hover();
    await page.getByRole('menuitem', { name: 'Linkage rules' }).click();
    await page.getByRole('button', { name: 'plus Add linkage rule', exact: true }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByTitle('ID', { exact: true }).getByText('ID').click();
    await page.getByRole('spinbutton').fill('1');
    await page.getByText('Add property').click();
    await page.getByTestId('select-linkage-properties').click();
    await page.getByText('Disabled').click();
    await page.locator('.ant-modal').getByRole('button', { name: 'OK', exact: true }).click();

    const linkBtn = page.getByLabel('block-item-CardItem-users-table').getByLabel('View');
    const linkBtnCursor = await linkBtn.evaluate((element) => {
      const computedStyle = window.getComputedStyle(element);
      return computedStyle.cursor;
    });

    //按钮禁用
    expect(linkBtnCursor).toBe('not-allowed');
  });
});
