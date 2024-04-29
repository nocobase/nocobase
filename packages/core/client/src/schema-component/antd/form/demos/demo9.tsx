/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BlockSchemaComponentPlugin, VariablesProvider } from '@nocobase/client';
import { renderApp } from '@nocobase/test/client';

export const renderDemo9 = () =>
  renderApp({
    designable: true,
    schema: {
      _isJSONSchemaObject: true,
      version: '2.0',
      type: 'void',
      'x-acl-action-props': {
        skipScopeCheck: true,
      },
      'x-acl-action': 'users:create',
      'x-decorator': 'FormBlockProvider',
      'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
      'x-decorator-props': {
        dataSource: 'main',
        collection: 'users',
      },
      'x-component': 'div',
      'x-app-version': '0.21.0-alpha.10',
      properties: {
        '0s3tm262rre': {
          _isJSONSchemaObject: true,
          version: '2.0',
          type: 'void',
          'x-component': 'FormV2',
          'x-use-component-props': 'useCreateFormBlockProps',
          'x-app-version': '0.21.0-alpha.10',
          properties: {
            grid: {
              'x-uid': 'h38s9pa4ik5',
              _isJSONSchemaObject: true,
              version: '2.0',
              type: 'void',
              'x-component': 'Grid',
              'x-app-version': '0.21.0-alpha.10',
              'x-linkage-rules': [
                {
                  condition: {
                    $and: [
                      {
                        username: {
                          $eq: 'test',
                        },
                      },
                    ],
                  },
                  actions: [
                    {
                      targetFields: ['nickname'],
                      operator: 'none',
                    },
                  ],
                },
              ],
              properties: {
                udpf3e45i3d: {
                  _isJSONSchemaObject: true,
                  version: '2.0',
                  type: 'void',
                  'x-component': 'Grid.Row',
                  'x-app-version': '0.21.0-alpha.10',
                  properties: {
                    hhc0bsk1roi: {
                      _isJSONSchemaObject: true,
                      version: '2.0',
                      type: 'void',
                      'x-component': 'Grid.Col',
                      'x-app-version': '0.21.0-alpha.10',
                      properties: {
                        username: {
                          _isJSONSchemaObject: true,
                          version: '2.0',
                          type: 'string',
                          'x-component': 'CollectionField',
                          'x-decorator': 'FormItem',
                          'x-collection-field': 'users.username',
                          'x-component-props': {},
                          'x-app-version': '0.21.0-alpha.10',
                          'x-uid': '71x74r4t4g0',
                          'x-async': false,
                          'x-index': 1,
                        },
                      },
                      'x-uid': 'ophjdttgmo5',
                      'x-async': false,
                      'x-index': 1,
                    },
                  },
                  'x-uid': 'ta1vq3qr1sd',
                  'x-async': false,
                  'x-index': 3,
                },
                row_rpkxgfonud3: {
                  _isJSONSchemaObject: true,
                  version: '2.0',
                  type: 'void',
                  'x-component': 'Grid.Row',
                  'x-index': 4,
                  properties: {
                    mmo2k17b0q1: {
                      _isJSONSchemaObject: true,
                      version: '2.0',
                      type: 'void',
                      'x-component': 'Grid.Col',
                      properties: {
                        nickname: {
                          _isJSONSchemaObject: true,
                          version: '2.0',
                          type: 'string',
                          'x-component': 'CollectionField',
                          'x-decorator': 'FormItem',
                          'x-collection-field': 'users.nickname',
                          'x-component-props': {},
                          'x-app-version': '0.21.0-alpha.10',
                          'x-uid': 'bcowga6nzzy',
                          'x-async': false,
                          'x-index': 1,
                        },
                      },
                      'x-uid': 'l1awt5at07z',
                      'x-async': false,
                      'x-index': 1,
                    },
                  },
                  'x-uid': 'y1tdyhcwhhi',
                  'x-async': false,
                },
              },
              'x-async': false,
              'x-index': 1,
            },
            '0m1r08p58e9': {
              _isJSONSchemaObject: true,
              version: '2.0',
              type: 'void',
              'x-component': 'ActionBar',
              'x-component-props': {
                layout: 'one-column',
                style: {
                  marginTop: 24,
                },
              },
              'x-app-version': '0.21.0-alpha.10',
              'x-uid': 't4gxf0xxaxc',
              'x-async': false,
              'x-index': 2,
            },
          },
          'x-uid': 'yk2fivh9hgb',
          'x-async': false,
          'x-index': 1,
        },
      },
      'x-uid': 'aqbi3avt3kb',
      'x-async': false,
      'x-index': 1,
    },
    appOptions: {
      plugins: [BlockSchemaComponentPlugin],
      providers: [VariablesProvider],
    },
  });
