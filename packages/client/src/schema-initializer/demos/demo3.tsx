import { observer, Schema, useFieldSchema } from '@formily/react';
import {
  Form,
  FormItem,
  Markdown,
  SchemaComponent,
  SchemaComponentProvider,
  SchemaInitializer,
  SchemaInitializerItemOptions,
  useDesignable
} from '@nocobase/client';
import { Input, Switch } from 'antd';
import React from 'react';

const useFormItemInitializerFields = () => {
  return [
    {
      type: 'item',
      title: 'Name',
      component: InitializeFormItem,
      schema: {
        type: 'string',
        title: 'Name',
        'x-component': 'Input',
        'x-decorator': 'FormItem',
        'x-collection-field': 'posts.name',
      },
    },
    {
      type: 'item',
      title: 'Title',
      component: InitializeFormItem,
      schema: {
        type: 'string',
        title: 'Title',
        'x-component': 'Input',
        'x-decorator': 'FormItem',
        'x-collection-field': 'posts.title',
      },
    },
  ] as SchemaInitializerItemOptions[];
};

const AddFormItemButton = observer((props: any) => {
  return (
    <SchemaInitializer.Button
      wrap={(schema) => schema}
      insertPosition={'beforeEnd'}
      items={[
        {
          type: 'itemGroup',
          title: 'Display fields',
          children: useFormItemInitializerFields(),
        },
        {
          type: 'divider',
        },
        {
          type: 'item',
          title: 'Add text',
          component: InitializeTextFormItem,
        },
      ]}
    >
      Configure fields
    </SchemaInitializer.Button>
  );
});

const useCurrentFieldSchema = (path: string) => {
  const fieldSchema = useFieldSchema();
  const { remove } = useDesignable();
  const findFieldSchema = (schema: Schema) => {
    return schema.reduceProperties((buf, s) => {
      if (s['x-collection-field'] === path) {
        return s;
      }
      const child = findFieldSchema(s);
      if (child) {
        return child;
      }
      return buf;
    });
  };
  const schema = findFieldSchema(fieldSchema);
  return {
    schema,
    exists: !!schema,
    remove() {
      schema && remove(schema);
    },
  };
};

const InitializeFormItem = SchemaInitializer.itemWrap((props) => {
  const { item, insert } = props;
  const { exists, remove } = useCurrentFieldSchema(item.schema['x-collection-field']);
  return (
    <SchemaInitializer.Item
      onClick={() => {
        if (exists) {
          return remove();
        }
        insert({
          ...item.schema,
        });
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {item.title} <Switch size={'small'} checked={exists} />
      </div>
    </SchemaInitializer.Item>
  );
});

const InitializeTextFormItem = SchemaInitializer.itemWrap((props) => {
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
  return (
    <div>
      {props.children}
      <AddFormItemButton />
    </div>
  );
};

export default function App() {
  return (
    <SchemaComponentProvider components={{ Page, Form, Input, FormItem, Markdown }}>
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
    </SchemaComponentProvider>
  );
}
