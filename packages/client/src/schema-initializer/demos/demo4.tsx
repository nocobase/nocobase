import { observer, Schema, useFieldSchema } from '@formily/react';
import {
  ArrayTable,
  Input,
  SchemaComponent,
  SchemaComponentProvider,
  SchemaInitializer,
  useDesignable
} from '@nocobase/client';
import { Switch } from 'antd';
import React from 'react';

const useTableColumnInitializerFields = () => {
  const fields = [
    {
      key: 'name',
      title: 'Name',
      schema: {
        type: 'string',
        name: 'name',
        'x-collection-field': 'posts.name',
        'x-component': 'Input',
      },
      component: ColumnInitializerItem,
    },
    {
      key: 'title',
      title: 'Title',
      schema: {
        type: 'string',
        name: 'title',
        'x-collection-field': 'posts.title',
        'x-component': 'Input',
      },
      component: ColumnInitializerItem,
    },
  ];
  return fields;
};

export const AddTableColumn = observer((props: any) => {
  return (
    <SchemaInitializer.Button
      wrap={(schema) => schema}
      insertPosition={'beforeEnd'}
      items={[
        {
          title: 'Display fields',
          children: useTableColumnInitializerFields(),
        },
      ]}
    >
      Configure columns
    </SchemaInitializer.Button>
  );
});

const useCurrentColumnSchema = (path: string) => {
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
      schema && remove(schema.parent);
    },
  };
};

export const ColumnInitializerItem = (props) => {
  const { title, schema, insert } = props;
  const { exists, remove } = useCurrentColumnSchema(schema['x-collection-field']);
  return (
    <SchemaInitializer.Item
      onClick={() => {
        if (exists) {
          return remove();
        }
        insert({
          type: 'void',
          title: schema.name,
          'x-component': 'ArrayTable.Column',
          properties: {
            [schema.name]: {
              'x-read-pretty': true,
              ...schema,
            },
          },
        });
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {title} <Switch size={'small'} checked={exists} />
      </div>
    </SchemaInitializer.Item>
  );
};

const schema = {
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
      'x-column-initializer': 'AddTableColumn',
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
};

export default function App() {
  return (
    <SchemaComponentProvider components={{ AddTableColumn, Input, ArrayTable }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
}
