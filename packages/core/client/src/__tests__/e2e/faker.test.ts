import { describe, expect, gotoPage, test } from '@nocobase/test';

const phonePageConfig = {
  collections: [
    {
      key: '94kecytzenp',
      name: 't_x3mxc1ymorw',
      title: 'faker-testing',
      inherit: false,
      hidden: false,
      description: null,
      fields: [
        {
          key: 'cgzlv8nu6fr',
          name: 'id',
          type: 'bigInt',
          interface: 'id',
          description: null,
          collectionName: 't_x3mxc1ymorw',
          parentKey: null,
          reverseKey: null,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
          uiSchema: {
            type: 'number',
            title: '{{t("ID")}}',
            'x-component': 'InputNumber',
            'x-read-pretty': true,
          },
        },
        {
          key: 'sd7xf79138a',
          name: 'createdAt',
          type: 'date',
          interface: 'createdAt',
          description: null,
          collectionName: 't_x3mxc1ymorw',
          parentKey: null,
          reverseKey: null,
          field: 'createdAt',
          uiSchema: {
            type: 'datetime',
            title: '{{t("Created at")}}',
            'x-component': 'DatePicker',
            'x-component-props': {},
            'x-read-pretty': true,
          },
        },
        {
          key: 'z063hvkfdtf',
          name: 'createdBy',
          type: 'belongsTo',
          interface: 'createdBy',
          description: null,
          collectionName: 't_x3mxc1ymorw',
          parentKey: null,
          reverseKey: null,
          target: 'users',
          foreignKey: 'createdById',
          uiSchema: {
            type: 'object',
            title: '{{t("Created by")}}',
            'x-component': 'AssociationField',
            'x-component-props': {
              fieldNames: {
                value: 'id',
                label: 'nickname',
              },
            },
            'x-read-pretty': true,
          },
          targetKey: 'id',
        },
        {
          key: 'wlnvpjkuv3i',
          name: 'updatedAt',
          type: 'date',
          interface: 'updatedAt',
          description: null,
          collectionName: 't_x3mxc1ymorw',
          parentKey: null,
          reverseKey: null,
          field: 'updatedAt',
          uiSchema: {
            type: 'string',
            title: '{{t("Last updated at")}}',
            'x-component': 'DatePicker',
            'x-component-props': {},
            'x-read-pretty': true,
          },
        },
        {
          key: 'rxyq48pu0kd',
          name: 'updatedBy',
          type: 'belongsTo',
          interface: 'updatedBy',
          description: null,
          collectionName: 't_x3mxc1ymorw',
          parentKey: null,
          reverseKey: null,
          target: 'users',
          foreignKey: 'updatedById',
          uiSchema: {
            type: 'object',
            title: '{{t("Last updated by")}}',
            'x-component': 'AssociationField',
            'x-component-props': {
              fieldNames: {
                value: 'id',
                label: 'nickname',
              },
            },
            'x-read-pretty': true,
          },
          targetKey: 'id',
        },
        {
          key: '3b24xiumcck',
          name: 'f_fyjoexeqvuh',
          type: 'string',
          interface: 'phone',
          description: null,
          collectionName: 't_x3mxc1ymorw',
          parentKey: null,
          reverseKey: null,
          uiSchema: {
            type: 'string',
            'x-component': 'Input',
            'x-component-props': {
              type: 'tel',
            },
            title: 'Phone',
          },
        },
      ],
      category: [],
      logging: true,
      autoGenId: true,
      createdBy: true,
      updatedBy: true,
      createdAt: true,
      updatedAt: true,
      sortable: true,
      template: 'general',
      view: false,
    },
  ],
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      zyfy6q68u10: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'BlockInitializers',
        properties: {
          sfe29sssqks: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              wr0q46863ri: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                properties: {
                  '996h7puslon': {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'TableBlockProvider',
                    'x-acl-action': 't_x3mxc1ymorw:list',
                    'x-decorator-props': {
                      collection: 't_x3mxc1ymorw',
                      resource: 't_x3mxc1ymorw',
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
                        'x-uid': 'to6wvr2ymud',
                        'x-async': false,
                        'x-index': 1,
                      },
                      fmioqg3ac22: {
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
                                'x-uid': '7ueb2r7aiq2',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'q6tqbavh1hz',
                            'x-async': false,
                            'x-index': 1,
                          },
                          '7x5qve01k29': {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'TableV2.Column.Decorator',
                            'x-designer': 'TableV2.Column.Designer',
                            'x-component': 'TableV2.Column',
                            properties: {
                              f_fyjoexeqvuh: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                'x-collection-field': 't_x3mxc1ymorw.f_fyjoexeqvuh',
                                'x-component': 'CollectionField',
                                'x-component-props': {},
                                'x-read-pretty': true,
                                'x-decorator': null,
                                'x-decorator-props': {
                                  labelStyle: {
                                    display: 'none',
                                  },
                                },
                                'x-uid': 'bmewjcb9996',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': '6vqo25ezxbr',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'esirxkr0lca',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'zcbhgqtrof5',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'tsma8ix1lun',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'q8bpsoqjz1b',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'edhta7p0qtf',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': '1o0p25d72br',
    'x-async': true,
    'x-index': 1,
  },
};

describe('faker', () => {
  test('phone', async ({ page }) => {
    await gotoPage(page, phonePageConfig);

    await expect(page.getByRole('cell', { name: '14979013912' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '10313363958' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '14365248205' })).toBeVisible();
  });
});
