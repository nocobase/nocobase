/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PageConfig, generalWithM2oSingleSelect } from '@nocobase/test/e2e';

export const T3813: PageConfig = {
  collections: generalWithM2oSingleSelect,
  pageSchema: {
    _isJSONSchemaObject: true,
    version: '2.0',
    type: 'void',
    'x-component': 'Page',
    'x-index': 1,
    properties: {
      '1lqiou007g2': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        'x-index': 1,
        properties: {
          '3psy01qtzke': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '0.21.0-alpha.6',
            properties: {
              r8tniqb18uy: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '0.21.0-alpha.6',
                properties: {
                  '3cffxb3eila': {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action': 'general:view',
                    'x-decorator': 'GridCard.Decorator',
                    'x-use-decorator-props': 'useGridCardBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'general',
                      dataSource: 'main',
                      readPretty: true,
                      action: 'list',
                      params: {
                        pageSize: 12,
                      },
                      runWhenParamsChanged: true,
                      rowKey: 'id',
                    },
                    'x-component': 'BlockItem',
                    'x-use-component-props': 'useGridCardBlockItemProps',
                    'x-toolbar': 'BlockSchemaToolbar',
                    'x-settings': 'blockSettings:gridCard',
                    'x-app-version': '0.21.0-alpha.6',
                    properties: {
                      actionBar: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-initializer': 'gridCard:configureActions',
                        'x-component': 'ActionBar',
                        'x-component-props': {
                          style: {
                            marginBottom: 'var(--nb-spacing)',
                          },
                        },
                        'x-app-version': '0.21.0-alpha.6',
                        'x-uid': 'zpvgtbawsn5',
                        'x-async': false,
                        'x-index': 1,
                      },
                      list: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'array',
                        'x-component': 'GridCard',
                        'x-use-component-props': 'useGridCardBlockProps',
                        'x-app-version': '0.21.0-alpha.6',
                        properties: {
                          item: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'object',
                            'x-component': 'GridCard.Item',
                            'x-read-pretty': true,
                            'x-use-component-props': 'useGridCardItemProps',
                            'x-app-version': '0.21.0-alpha.6',
                            properties: {
                              grid: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid',
                                'x-initializer': 'details:configureFields',
                                'x-app-version': '0.21.0-alpha.6',
                                'x-uid': 'w3xcdsm5s0u',
                                'x-async': false,
                                'x-index': 1,
                              },
                              actionBar: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-align': 'left',
                                'x-initializer': 'gridCard:configureItemActions',
                                'x-component': 'ActionBar',
                                'x-use-component-props': 'useGridCardActionBarProps',
                                'x-component-props': {
                                  layout: 'one-column',
                                },
                                'x-app-version': '0.21.0-alpha.6',
                                'x-uid': 'soskqb7aufc',
                                'x-async': false,
                                'x-index': 2,
                              },
                            },
                            'x-uid': 'e86uubphlyw',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': '51jobmt3bt6',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'a08k64ryw2d',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'd7ppy8ara48',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'porsjpnaluc',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'h98zl5a4yuj',
        'x-async': false,
      },
    },
    'x-uid': 'ozneak5mngm',
    'x-async': true,
  },
};
export const oneGridCardWithInheritFields = {
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
      '6dd4jp5aty3': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'page:addBlock',
        properties: {
          '6j297qld7k5': {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Row',
            'x-app-version': '0.21.0-alpha.15',
            properties: {
              '5ntnn78ittz': {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid.Col',
                'x-app-version': '0.21.0-alpha.15',
                properties: {
                  d5hfemedgra: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-acl-action': 'child:view',
                    'x-decorator': 'GridCard.Decorator',
                    'x-use-decorator-props': 'useGridCardBlockDecoratorProps',
                    'x-decorator-props': {
                      collection: 'child',
                      dataSource: 'main',
                      readPretty: true,
                      action: 'list',
                      params: {
                        pageSize: 12,
                      },
                      runWhenParamsChanged: true,
                      rowKey: 'id',
                    },
                    'x-component': 'BlockItem',
                    'x-use-component-props': 'useGridCardBlockItemProps',
                    'x-toolbar': 'BlockSchemaToolbar',
                    'x-settings': 'blockSettings:gridCard',
                    'x-app-version': '0.21.0-alpha.15',
                    properties: {
                      actionBar: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-initializer': 'gridCard:configureActions',
                        'x-component': 'ActionBar',
                        'x-component-props': {
                          style: {
                            marginBottom: 'var(--nb-spacing)',
                          },
                        },
                        'x-app-version': '0.21.0-alpha.15',
                        'x-uid': 'wwi5qc647uo',
                        'x-async': false,
                        'x-index': 1,
                      },
                      list: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'array',
                        'x-component': 'GridCard',
                        'x-use-component-props': 'useGridCardBlockProps',
                        'x-app-version': '0.21.0-alpha.15',
                        properties: {
                          item: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'object',
                            'x-component': 'GridCard.Item',
                            'x-read-pretty': true,
                            'x-use-component-props': 'useGridCardItemProps',
                            'x-app-version': '0.21.0-alpha.15',
                            properties: {
                              grid: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-component': 'Grid',
                                'x-initializer': 'details:configureFields',
                                'x-app-version': '0.21.0-alpha.15',
                                'x-uid': 'l3t86n7gvzx',
                                'x-async': false,
                                'x-index': 1,
                              },
                              actionBar: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                'x-align': 'left',
                                'x-initializer': 'gridCard:configureItemActions',
                                'x-component': 'ActionBar',
                                'x-use-component-props': 'useGridCardActionBarProps',
                                'x-component-props': {
                                  layout: 'one-column',
                                },
                                'x-app-version': '0.21.0-alpha.15',
                                'x-uid': '82xmd28rt6w',
                                'x-async': false,
                                'x-index': 2,
                              },
                            },
                            'x-uid': 'byt0acukow5',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': '93fip5eoty5',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'd7g6lotr67g',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'j0d554opvl6',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'y89y6kpb09t',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'z2h5z9118ck',
        'x-async': false,
        'x-index': 1,
      },
    },
    'x-uid': 'nf4ji8havvf',
    'x-async': true,
    'x-index': 1,
  },
};
