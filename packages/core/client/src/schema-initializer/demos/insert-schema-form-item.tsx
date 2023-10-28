import React, { FC } from 'react';
import {
  Application,
  CollectionFieldInitializer,
  Form,
  FormItem,
  SchemaInitializerItem,
  Input,
  Markdown,
  Plugin,
  SchemaComponent,
  SchemaComponentProvider,
  SchemaInitializerItemType,
  SchemaInitializer,
  useSchemaInitializer,
  useSchemaInitializerItem,
} from '@nocobase/client';

const useFormItemInitializerFields = () => {
  return [
    {
      name: 'name',
      title: 'Name',
      Component: 'CollectionFieldInitializer',
      schema: {
        type: 'string',
        title: 'Name',
        name: 'name',
        'x-component': 'Input',
        'x-decorator': 'FormItem',
        'x-collection-field': 'posts.name',
      },
    },
    {
      name: 'title',
      title: 'Title',
      Component: 'CollectionFieldInitializer',
      schema: {
        type: 'string',
        title: 'Title',
        name: 'title',
        'x-component': 'Input',
        'x-decorator': 'FormItem',
        'x-collection-field': 'posts.title',
      },
    },
  ] as SchemaInitializerItemType[];
};

const TextInitializer: FC = () => {
  const { insert } = useSchemaInitializer();
  const itemConfig = useSchemaInitializerItem();
  return (
    <SchemaInitializerItem
      onClick={() => {
        insert({
          type: 'void',
          'x-component': 'Markdown.Void',
          'x-decorator': 'FormItem',
          // 'x-editable': false,
        });
      }}
      {...itemConfig}
    />
  );
};

const addFormItemInitializer = new SchemaInitializer({
  name: 'AddFormItem',
  title: 'Configure actions',
  insertPosition: 'beforeEnd',
  items: [
    {
      name: 'displayFields',
      type: 'itemGroup',
      title: 'Display fields',
      // 通过 useChildren 来动态加载子项
      useChildren: useFormItemInitializerFields,
    },
    {
      type: 'divider',
    },
    {
      name: 'add-text',
      title: 'Add text',
      Component: TextInitializer,
    },
  ],
});

const Page = (props) => {
  const element = app.schemaInitializerManager.render('AddFormItem');
  return (
    <div>
      {props.children}
      {element}
    </div>
  );
};

const Root = () => {
  return (
    <div>
      <SchemaComponentProvider designable>
        <SchemaComponent
          components={{ TextInitializer, Page, Form, Input, FormItem, Markdown, CollectionFieldInitializer }}
          schema={{
            type: 'void',
            name: 'page',
            'x-decorator': 'Form',
            'x-component': 'Page',
            properties: {
              title: {
                type: 'string',
                title: 'Title',
                'x-component': 'Input',
                'x-decorator': 'FormItem',
                'x-collection-field': 'posts.title',
              },
              name: {
                type: 'string',
                title: 'Name',
                'x-component': 'Input',
                'x-decorator': 'FormItem',
                'x-collection-field': 'posts.name',
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
    this.app.schemaInitializerManager.add(addFormItemInitializer);
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
