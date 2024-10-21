/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const formSchemaCallback = (options) => ({
  type: 'void',
  'x-toolbar': 'BlockSchemaToolbar',
  'x-toolbar-props': {
    draggable: false,
  },
  'x-settings': 'blockSettings:publicForm',
  'x-component': 'CardItem',
  'x-decorator': 'FormBlockProvider',
  'x-decorator-props': {
    collection: options.collection,
    dataSource: options.dataSource,
    type: 'publicForm',
  },
  'x-use-decorator-props': 'useCreateFormBlockDecoratorProps',
  properties: {
    a69vmspkv8h: {
      type: 'void',
      'x-component': 'FormV2',
      'x-use-component-props': 'useCreateFormBlockProps',
      properties: {
        grid: {
          type: 'void',
          'x-component': 'Grid',
          'x-initializer': 'form:configureFields',
        },
        l9xfwp6cfh1: {
          type: 'void',
          'x-component': 'ActionBar',
          'x-initializer': 'createForm:configureActions',
          'x-component-props': {
            layout: 'one-column',
          },
        },
      },
    },
  },
});
