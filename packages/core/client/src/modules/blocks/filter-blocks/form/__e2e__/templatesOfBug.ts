/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const oneFilterFormWithInherit = {
  collections: [
    {
      name: 'parent',
      fields: [
        {
          name: 'parentField1',
          interface: 'input',
        },
        {
          name: 'parentField2',
          interface: 'input',
        },
      ],
    },
    {
      name: 'child',
      fields: [
        {
          name: 'childField1',
          interface: 'input',
        },
        {
          name: 'childField2',
          interface: 'input',
        },
      ],
      inherits: ['parent'],
    },
  ],
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    properties: {
      kq51phui0q9: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          pp7ov10hhjj: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '0.21.0-alpha.15',
            properties: {
              nz5peics4uj: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '0.21.0-alpha.15',
                properties: {
                  ibeh994er9g: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-decorator': 'FilterFormBlockProvider',
                    'x-use-decorator-props': 'useFilterFormBlockDecoratorProps',
                    'x-decorator-props': {
                      dataSource: 'main',
                      collection: 'child',
                    },
                    'x-toolbar': 'BlockSchemaToolbar',
                    'x-settings': 'blockSettings:filterForm',
                    'x-component': 'CardItem',
                    'x-filter-targets': [],
                    'x-filter-operators': {},
                    'x-app-version': '0.21.0-alpha.15',
                    properties: {
                      al2miukt2y0: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'FormV2',
                        'x-use-component-props': 'useFilterFormBlockProps',
                        'x-app-version': '0.21.0-alpha.15',
                        properties: {
                          grid: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'filterForm:configureFields',
                            'x-app-version': '0.21.0-alpha.15',
                            'x-uid': 'fs8883bxalw',
                            'x-async': false,
                            'x-index': 1,
                          },
                          ni40rr6efvb: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-initializer': 'filterForm:configureActions',
                            'x-component': 'ActionBar',
                            'x-component-props': {
                              layout: 'one-column',
                              style: {
                                float: 'right',
                              },
                            },
                            'x-app-version': '0.21.0-alpha.15',
                            'x-uid': 'jhtfu538zve',
                            'x-async': false,
                            'x-index': 2,
                          },
                        },
                        'x-uid': 'krv6g3fyqwu',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'zne83pn4hvx',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': '7s8os6m891x',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'chovlhzi0ee',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': '9xzpdna59re',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'oxtr4rkwpwy',
    'x-async': true,
    'x-index': 1,
  },
};
