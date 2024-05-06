/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionField, ExtendCollectionsProvider, FormBlockProvider } from '@nocobase/client';
import { getAppComponent } from '@nocobase/test/web';

const bookCollection = {
  key: 'book',
  name: 'book',
  title: 'book',
  fields: [
    {
      key: 'id',
      name: 'id',
      type: 'bigInt',
      interface: 'integer',
      collectionName: 'book',
      autoIncrement: true,
      uiSchema: {
        type: 'number',
        title: '{{t("ID")}}',
        'x-component': 'InputNumber',
        'x-pattern': 'readPretty',
      },
    },
    {
      key: 'name',
      name: 'name',
      type: 'string',
      interface: 'input',
      description: null,
      collectionName: 'book',
      uiSchema: {
        type: 'string',
        'x-component': 'Input',
        title: 'name',
      },
    },
    {
      key: 'rlzyzn3rke7',
      name: 'price',
      type: 'double',
      interface: 'number',
      description: null,
      collectionName: 'book',
      uiSchema: {
        'x-component-props': {
          step: '1',
          stringMode: true,
        },
        type: 'number',
        'x-component': 'InputNumber',
        title: 'price',
      },
    },
  ],
  logging: true,
  autoGenId: true,
  createdAt: true,
  createdBy: true,
  updatedAt: true,
  updatedBy: true,
  template: 'general',
  view: false,
  schema: 'public',
  filterTargetKey: 'id',
};

const App = getAppComponent({
  schema: {
    type: 'void',
    name: 'root',
    properties: {
      test: {
        type: 'void',
        'x-component': 'FormBlockProvider',
        'x-component-props': {
          collection: 'book',
        },
        properties: {
          form: {
            'x-component': 'FormV2',
            properties: {
              name: {
                'x-decorator': 'FormItem',
                'x-component': 'CollectionField',
              },
              price: {
                'x-decorator': 'FormItem',
                'x-component': 'CollectionField',
              },
            },
          },
        },
      },
    },
  },
  appOptions: {
    components: {
      FormBlockProvider,
      CollectionField,
    },
    providers: [
      [ExtendCollectionsProvider, { collections: [bookCollection] }], // 添加 book 数据表
    ],
  },
  apis: {
    'users:create': { result: 'ok' },
  },
});

export default App;
