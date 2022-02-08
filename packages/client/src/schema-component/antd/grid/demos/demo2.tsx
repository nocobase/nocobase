import { ISchema, observer, Schema, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import {
  Form,
  FormItem,
  Grid,
  Input,
  Markdown,
  SchemaComponent,
  SchemaComponentProvider,
  SchemaInitializer,
  useDesignable
} from '@nocobase/client';
import { Switch } from 'antd';
import React from 'react';

const schema: ISchema = {
  type: 'void',
  name: 'grid1',
  'x-decorator': 'Form',
  'x-component': 'Grid',
  'x-item-initializer': 'AddGridFormItem',
  'x-uid': uid(),
  properties: {
    row1: {
      type: 'void',
      'x-component': 'Grid.Row',
      'x-uid': uid(),
      properties: {
        col11: {
          type: 'void',
          'x-component': 'Grid.Col',
          properties: {
            name: {
              type: 'string',
              title: 'Name',
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              'x-collection-field': 'posts.name',
            },
            title: {
              type: 'string',
              title: 'Title',
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              'x-collection-field': 'posts.title',
            },
          },
        },
        col12: {
          type: 'void',
          'x-component': 'Grid.Col',
          properties: {
            intro: {
              type: 'string',
              title: 'Intro',
              'x-decorator': 'FormItem',
              'x-component': 'Input',
            },
          },
        },
      },
    },
  },
};

const useFormItemInitializerFields = () => {
  return [
    {
      key: 'name',
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
      key: 'title',
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
  ];
};

const gridRowColWrap = (schema: ISchema) => {
  return {
    type: 'void',
    'x-component': 'Grid.Row',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Grid.Col',
        properties: {
          [schema.name || uid()]: schema,
        },
      },
    },
  };
};

const AddGridFormItem = observer((props: any) => {
  return (
    <SchemaInitializer.Button
      wrap={gridRowColWrap}
      insertPosition={'beforeEnd'}
      items={[
        {
          title: 'Display fields',
          children: useFormItemInitializerFields(),
        },
        {
          type: 'divider',
        },
        {
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
      schema &&
        remove(schema, {
          removeEmptyParents: true,
        });
    },
  };
};

const InitializeFormItem = (props) => {
  const { title, schema, insert } = props;
  const { exists, remove } = useCurrentFieldSchema(schema['x-collection-field']);
  return (
    <SchemaInitializer.Item
      onClick={() => {
        if (exists) {
          return remove();
        }
        insert({
          ...schema,
        });
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {title} <Switch size={'small'} checked={exists} />
      </div>
    </SchemaInitializer.Item>
  );
};

const InitializeTextFormItem = (props) => {
  const { title, insert } = props;
  return (
    <SchemaInitializer.Item
      onClick={(info) => {
        insert({
          type: 'void',
          'x-component': 'Markdown.Void',
          'x-decorator': 'FormItem',
          // 'x-editable': false,
        });
      }}
    >
      {title}
    </SchemaInitializer.Item>
  );
};

export default function App() {
  return (
    <SchemaComponentProvider components={{ AddGridFormItem, Markdown, Form, Grid, Input, FormItem }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
}
