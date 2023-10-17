import React from 'react';
import {
  Application,
  CollectionFieldInitializer,
  Input,
  Plugin,
  SchemaComponent,
  SchemaComponentProvider,
  SchemaInitializerItemType,
  SchemaInitializerV2,
} from '@nocobase/client';
import { uid } from '@formily/shared';
import { ArrayTable } from '@formily/antd-v5';

const removeColumn = (schema, cb) => {
  cb(schema, {
    removeParentsIfNoChildren: true,
    breakRemoveOn: {
      'x-component': 'ArrayTable',
    },
  });
};

const useTableColumnInitializerFields = () => {
  const fields: SchemaInitializerItemType[] = [
    {
      type: 'item',
      title: 'Name',
      remove: removeColumn,
      schema: {
        name: 'name',
        type: 'string',
        title: 'Name',
        'x-collection-field': 'posts.name',
        'x-component': 'Input',
        'x-read-pretty': true,
      },
      component: 'CollectionFieldInitializer',
    },
    {
      type: 'item',
      title: 'Title',
      remove: removeColumn,
      schema: {
        name: 'title',
        type: 'string',
        title: 'Title',
        'x-collection-field': 'posts.title',
        'x-component': 'Input',
        'x-read-pretty': true,
      },
      component: 'CollectionFieldInitializer',
    },
  ];
  return fields;
};

const columnWrap = (s) => {
  return {
    name: [uid()],
    type: 'void',
    title: s.title,
    'x-component': 'ArrayTable.Column',
    properties: {
      [s.name]: {
        ...s,
      },
    },
  };
};

const addColumnInitializer = new SchemaInitializerV2({
  title: 'Configure actions',
  insertPosition: 'beforeEnd',
  items: [
    {
      name: 'displayFields',
      type: 'itemGroup',
      title: 'Display fields',
      // 通过 useChildren 来动态加载子项
      useChildren: useTableColumnInitializerFields,
    },
  ],
});

const Root = () => {
  return (
    <div>
      <SchemaComponentProvider designable>
        <SchemaComponent
          components={{ Input, ArrayTable, CollectionFieldInitializer }}
          schema={{
            type: 'object',
            properties: {
              input: {
                type: 'array',
                default: [
                  { id: 1, name: 'Name1' },
                  { id: 2, name: 'Name2' },
                  { id: 3, name: 'Name3' },
                ],
                'x-component': 'ArrayTable',
                'x-initializer': 'AddColumn',
                'x-component-props': {
                  rowKey: 'id',
                },
                properties: {
                  column1: {
                    type: 'void',
                    title: 'Name',
                    'x-component': 'ArrayTable.Column',
                    properties: {
                      name: {
                        type: 'string',
                        'x-component': 'Input',
                        'x-collection-field': 'posts.name',
                        'x-read-pretty': true,
                      },
                    },
                  },
                },
              },
            },
          }}
        ></SchemaComponent>
      </SchemaComponentProvider>
    </div>
  );
};

class MyPlugin extends Plugin {
  async load() {
    this.app.schemaInitializerManager.add('AddFormItem', addFormItemInitializer);
    this.app.router.add('root', {
      path: '/',
      Component: Root,
    });
  }
}

const app = new Application({
  router: {
    type: 'memory',
    initialEntries: ['/'],
  },
  plugins: [MyPlugin],
});

export default app.getRootComponent();
