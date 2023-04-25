import {
  Form,
  FormItem,
  Markdown,
  SchemaComponent,
  SchemaComponentProvider,
  SchemaInitializer,
  SchemaInitializerItemOptions,
  SchemaInitializerProvider,
  useSchemaInitializer,
} from '@nocobase/client';
import { Input } from 'antd';
import React from 'react';

const useFormItemInitializerFields = () => {
  return [
    {
      type: 'item',
      title: 'Name',
      component: 'CollectionFieldInitializer',
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
      type: 'item',
      title: 'Title',
      component: 'CollectionFieldInitializer',
      schema: {
        type: 'string',
        title: 'Title',
        name: 'title',
        'x-component': 'Input',
        'x-decorator': 'FormItem',
        'x-collection-field': 'posts.title',
      },
    },
  ] as SchemaInitializerItemOptions[];
};

const TextInitializer = SchemaInitializer.itemWrap((props) => {
  const { insert } = props;
  return (
    <SchemaInitializer.Item
      onClick={() => {
        insert({
          type: 'void',
          'x-component': 'Markdown.Void',
          'x-decorator': 'FormItem',
          // 'x-editable': false,
        });
      }}
    />
  );
});

const Page = (props) => {
  const { render } = useSchemaInitializer('AddFormItem');
  return (
    <div>
      {props.children}
      {render()}
    </div>
  );
};

export default function App() {
  const initializers = {
    AddFormItem: {
      title: 'Configure fields',
      insertPosition: 'beforeEnd',
      items: [
        {
          type: 'itemGroup',
          title: 'Display fields',
          // 从 hook 动态加载字段
          children: useFormItemInitializerFields(),
        },
        {
          type: 'divider',
        },
        {
          type: 'item',
          title: 'Add text',
          component: 'TextInitializer',
        },
      ],
    },
  };
  return (
    <SchemaComponentProvider designable components={{ TextInitializer, Page, Form, Input, FormItem, Markdown }}>
      <SchemaInitializerProvider initializers={initializers}>
        <SchemaComponent
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
        />
      </SchemaInitializerProvider>
    </SchemaComponentProvider>
  );
}
