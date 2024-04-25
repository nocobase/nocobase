import { expect, expectSettingsMenu, test } from '@nocobase/test/e2e';

test.beforeAll(async ({ page }) => {
  await page.goto('/admin/settings/map');
  await page.waitForLoadState('networkidle');
  if (await page.getByRole('button', { name: 'Edit' }).isVisible()) {
    await page.getByRole('button', { name: 'Edit' }).click();
  }
  await page.getByLabel('Access key').click();
  await page.getByLabel('Access key').fill('9717a70e44273882bcf5489f72b4e261');
  await page.getByLabel('securityJsCode or serviceHost').click();
  await page.getByLabel('securityJsCode or serviceHost').fill('6876ed2d3a6168b75c4fba852e16c99c');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('.ant-message-notice').getByText('Saved successfully')).toBeVisible();
});

test.afterAll(async ({ page }) => {
  await page.goto('/admin/settings/map');
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('Access key').clear();
  await page.getByLabel('securityJsCode or serviceHost').clear();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('.ant-message-notice').getByText('Saved successfully')).toBeVisible();
});

test.describe('schema settings', () => {
  test('what settings can be used in map block', async ({ page, mockPage }) => {
    await mockPage({
      collections: [
        {
          name: 'map',
          fields: [
            {
              name: 'point',
              interface: 'point',
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
          '8d5kk0rt54w': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'page:addBlock',
            properties: {
              '8sia51xaucx': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Row',
                'x-app-version': '0.21.0-alpha.15',
                properties: {
                  elij0klumzf: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-component': 'Grid.Col',
                    'x-app-version': '0.21.0-alpha.15',
                    properties: {
                      '05gsh93kbeg': {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-acl-action': 'map:list',
                        'x-decorator': 'MapBlockProvider',
                        'x-decorator-props': {
                          collection: 'map',
                          dataSource: 'main',
                          action: 'list',
                          fieldNames: {
                            field: ['point'],
                          },
                          params: {
                            paginate: false,
                          },
                        },
                        'x-toolbar': 'BlockSchemaToolbar',
                        'x-settings': 'blockSettings:map',
                        'x-component': 'CardItem',
                        'x-filter-targets': [],
                        'x-app-version': '0.21.0-alpha.15',
                        properties: {
                          actions: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-initializer': 'map:configureActions',
                            'x-component': 'ActionBar',
                            'x-component-props': {
                              style: {
                                marginBottom: 16,
                              },
                            },
                            'x-app-version': '0.21.0-alpha.15',
                            'x-uid': 'je3ohoqzqt6',
                            'x-async': false,
                            'x-index': 1,
                          },
                          vdsw8i32n94: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'MapBlock',
                            'x-use-component-props': 'useMapBlockProps',
                            'x-app-version': '0.21.0-alpha.15',
                            properties: {
                              drawer: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Action.Drawer',
                                'x-component-props': {
                                  className: 'nb-action-popup',
                                },
                                title: '{{ t("View record") }}',
                                'x-app-version': '0.21.0-alpha.15',
                                properties: {
                                  tabs: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    'x-component': 'Tabs',
                                    'x-component-props': {},
                                    'x-initializer': 'popup:addTab',
                                    'x-app-version': '0.21.0-alpha.15',
                                    properties: {
                                      tab1: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        title: '{{t("Details")}}',
                                        'x-component': 'Tabs.TabPane',
                                        'x-designer': 'Tabs.Designer',
                                        'x-component-props': {},
                                        'x-app-version': '0.21.0-alpha.15',
                                        properties: {
                                          grid: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            'x-component': 'Grid',
                                            'x-initializer': 'popup:common:addBlock',
                                            'x-app-version': '0.21.0-alpha.15',
                                            'x-uid': 'g5d6t1hpvo8',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'hq5j3w8d8db',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'x0ne9tq1bdf',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'micohua87kv',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'e7hfatz8fxx',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'g2n2rqidaem',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'zmrjvgpsgeh',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'q81voyltwkn',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'lyadz9knnnm',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': '5b3qaiczmyv',
        'x-async': true,
        'x-index': 1,
      },
    }).goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('block-item-CardItem-map-map').hover();
        await page.getByLabel('designer-schema-settings-CardItem-blockSettings:map-map').hover();
      },
      supportedOptions: [
        'Edit block title',
        'Fix block',
        'Map field',
        'Marker field',
        'Concatenation order field',
        'Set data loading mode',
        'The default zoom level of the map',
        'Set the data scope',
        'Connect data blocks',
        'Save as template',
        'Delete',
      ],
    });
  });
});
