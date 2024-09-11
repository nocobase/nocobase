import { ExtendCollectionsProvider, FormBlockProvider, ISchema, Plugin, SchemaComponent } from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import React from 'react';

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

const schema: ISchema = {
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
};

const Demo = () => {
  return (
    <ExtendCollectionsProvider collections={[bookCollection]}>
      <SchemaComponent schema={schema} />
    </ExtendCollectionsProvider>
  );
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo });
  }
}

const app = mockApp({
  plugins: [DemoPlugin],
  components: {
    FormBlockProvider,
  },
});

export default app.getRootComponent();
