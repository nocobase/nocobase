import { expect, test } from '@nocobase/test/client';

test.describe('add config in front', () => {
  test('add plugin npm registry', async ({ page, mockPage }) => {
    await mockPage().goto();
    await page.getByTestId('pm-button').click();
    await expect(await page.getByLabel('sample-custom-collection-template')).not.toBeVisible();
    await page.getByRole('button', { name: 'Add new' }).click();
    await page
      .getByTestId('packageName-item')
      .getByRole('textbox')
      .fill('@nocobase/plugin-sample-custom-collection-template');
    await page.getByTestId('submit-action').click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(20000);
    await page.getByPlaceholder('Search plugin').fill('sample-custom-collection-template');
    await expect(await page.getByLabel('sample-custom-collection-template')).toBeVisible();
  });
  test.skip('add plugin local upload', async ({ page, mockPage }) => {});
  test.skip('add plugin  file url', async ({ page, mockPage }) => {});
});

test.describe('remove plugin', () => {
  test('remove plugin,then add plugin', async ({ page, mockPage }) => {
    await mockPage().goto();
    await page.getByTestId('pm-button').click();
    await page.getByPlaceholder('Search plugin').fill('hello');
    await expect(await page.getByLabel('hello')).toBeVisible();
    //未启用的插件可以remove
    const isActive = await page.getByLabel('hello').getByLabel('plugin-enabled').isChecked();
    await expect(isActive).toBe(false);
    await await page.getByLabel('hello').getByRole('button', { name: 'delete Remove' }).click();
    await page.getByRole('button', { name: 'Yes' }).click();
    await page.waitForLoadState('load');
    await page.getByPlaceholder('Search plugin').fill('hello');
    await expect(await page.getByLabel('hello')).not.toBeVisible();
    //将删除的插件加回来
    await page.getByRole('button', { name: 'Add new' }).click();
    await page.getByTestId('packageName-item').getByRole('textbox').fill('@nocobase/plugin-sample-hello');
    await page.getByTestId('submit-action').click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(20000);
    await page.getByPlaceholder('Search plugin').fill('hello');
    await expect(await page.getByLabel('hello')).toBeVisible();
  });
});

test.describe('active plugin', () => {
  test('active plugin', async ({ page, mockPage }) => {
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
    await page.getByTestId('form-block').click();
    await page.getByTestId('form-block').getByTestId('designer-schema-settings').locator('svg').nth(0).click();
    await page.getByText('Save as block template').click();
    await page.getByLabel('Save as template').getByRole('textbox').dblclick();
    await page
      .locator(
        '.ant-formily-layout > .ant-formily-item > .ant-formily-item-control > .ant-formily-item-control-content > .ant-formily-item-control-content-component > .ant-input-affix-wrapper',
      )
      .click();
    await page.getByLabel('Save as template').getByRole('textbox').fill('Users_Form');
    await page.getByRole('button', { name: 'OK' }).click();
    await page.getByTestId('form-block').click();
    await page.waitForTimeout(2000);
    console.log(await page.locator('.general-schema-designer-title > .ant-space-item > .title-tag').innerText());
    const titleTag = await page
      .getByTestId('form-block')
      .locator('.general-schema-designer-title > .title-tag')
      .innerHTML();
    await expect(titleTag).toContain('Reference template');
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

test.describe('activate plugin', () => {
  test('activate plugin', async ({ page, mockPage }) => {});
});

test.describe('enabled plugin', () => {
  test('enabled plugin', async ({ page, mockPage }) => {});
});
test.describe('update plugin', () => {
  test('update plugin', async ({ page, mockPage }) => {});
});
