/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const getMenuSchema = (title: string, hook = false) => ({
  _isJSONSchemaObject: true,
  version: '2.0',
  type: 'void',
  title,
  'x-component': 'Menu.Item',
  'x-decorator': 'ACLMenuItemProvider',
  'x-component-props': {},
  ...(hook
    ? {
        'x-server-hooks': [
          {
            type: 'onSelfSave',
            method: 'extractTextToLocale',
          },
        ],
      }
    : {}),
  properties: {
    page: {
      _isJSONSchemaObject: true,
      version: '2.0',
      type: 'void',
      'x-component': 'Page',
      'x-async': true,
      properties: {
        '8x6xrx59vpd': {
          _isJSONSchemaObject: true,
          version: '2.0',
          type: 'void',
          'x-component': 'Grid',
          'x-initializer': 'page:addBlock',
          'x-uid': 'th3q97bzylq',
          name: '8x6xrx59vpd',
          'x-app-version': '0.21.0-alpha.7',
        },
      },
      'x-uid': 'gqgfjv38all',
      name: 'page',
      'x-app-version': '0.21.0-alpha.7',
    },
  },
  name: '6ler5jumdz0',
  'x-uid': 'ri757idkdw0',
  'x-app-version': '0.21.0-alpha.7',
});

export const getMobileMenuSchema = (title: string, hook = false) => ({
  name: 'tabBar',
  _isJSONSchemaObject: true,
  version: '2.0',
  type: 'void',
  'x-component': 'MTabBar',
  'x-component-props': {},
  properties: {
    '9b6f369x1ef': {
      'x-uid': '0lafotn74pu',
      _isJSONSchemaObject: true,
      version: '2.0',
      type: 'void',
      'x-component': 'MTabBar.Item',
      'x-designer': 'MTabBar.Item.Designer',
      'x-component-props': {
        icon: 'HomeOutlined',
        title,
      },
      ...(hook
        ? {
            'x-server-hooks': [
              {
                type: 'onSelfSave',
                method: 'extractTextToLocale',
              },
            ],
          }
        : {}),
      'x-async': false,
      'x-index': 1,
    },
  },
  'x-uid': 'uq0qwy7rkyg',
  'x-async': false,
  'x-index': 1,
});
