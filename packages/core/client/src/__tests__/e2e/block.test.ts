import { enableToConfig, expect, test } from '@nocobase/test/client';

test.describe('add block & delete block', () => {
  test('add block,then delete block', async ({ page, mockPage }) => {
    await mockPage().goto();
    await page.getByTestId('add-block-button-in-page').click();
    await page.getByRole('menuitem', { name: 'table Table right' }).click();
    await page.getByRole('menuitem', { name: 'Users' }).click();
    await page.getByRole('menuitem', { name: 'Users' }).hover();

    await expect(page.getByTestId('configure-actions-button-of-table-block-users')).toBeVisible();
    await expect(page.getByTestId('configure-columns-button-of-table-block-users')).toBeVisible();
  });
});

test.describe('block title', () => {
  test('edit block title', async ({ page, mockPage }) => {
    await mockPage({
      pageSchema: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Page',
        properties: {
          jm95gnk847q: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'BlockInitializers',
            properties: {
              b2ps1vq3a9p: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Row',
                properties: {
                  opp53dr7gb5: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-component': 'Grid.Col',
                    properties: {
                      h5orh9vynsz: {
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
                            'x-uid': 'ow8w8cak703',
                            'x-async': false,
                            'x-index': 1,
                          },
                          f7jdg3wq7vf: {
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
                                    'x-uid': '3dx0frmdnuk',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': '6nwlfsxeriy',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '7neygv75vrq',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'x62u9vpf875',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'o370xv5t1mi',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'qonzca5rlws',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'wkmha3jwokn',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'cmi8e3xbopy',
        'x-async': true,
        'x-index': 1,
      },
    }).goto();
    await page.getByTestId('users-resource').getByTestId('designer-schema-settings').locator('svg').click();
    await page.getByText('Edit block title').click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('block title');
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByTestId('users-resource').getByText('block title')).toBeVisible();
    //回显
    await page.getByTestId('users-resource').getByTestId('designer-schema-settings').locator('svg').click();
    await page.getByText('Edit block title').click();
    await expect(page.getByRole('textbox').inputValue()).toBe('block title');
  });
});

test.describe('blcok template', () => {
  test('form block save as block template', async ({ page, mockPage }) => {
    await mockPage({
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
                                  hmx352mpg0n: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Grid.Row',
                                    properties: {
                                      '462mil002c4': {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        'x-component': 'Grid.Col',
                                        properties: {
                                          phone: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'string',
                                            'x-designer': 'FormItem.Designer',
                                            'x-component': 'CollectionField',
                                            'x-decorator': 'FormItem',
                                            'x-collection-field': 'users.phone',
                                            'x-component-props': {},
                                            'x-uid': '1lum3kv33xx',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'dci5ihd63ee',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'gof6ouj3fcu',
                                    'x-async': false,
                                    'x-index': 2,
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
    await page.getByTestId('users-resource').getByRole('img', { name: 'menu' }).locator('path').click();
    await page.getByText('Save as block template').click();
    await page.getByLabel('Save as template').getByRole('textbox').dblclick();
    await page
      .locator(
        '.ant-formily-layout > .ant-formily-item > .ant-formily-item-control > .ant-formily-item-control-content > .ant-formily-item-control-content-component > .ant-input-affix-wrapper',
      )
      .click();
    await page.getByLabel('Save as template').getByRole('textbox').fill('Users_Form');
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(
      page.getByTestId('form-block').locator('.general-schema-designer-title > .title-tag').innerText,
    ).toContain('Reference template');
  });
  test.skip('using block template ', async ({ page, mockPage }) => {
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
