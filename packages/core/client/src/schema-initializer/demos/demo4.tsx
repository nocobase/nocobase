import { uid } from '@formily/shared';
import {
  ArrayTable,
  Input,
  SchemaComponent,
  SchemaComponentProvider,
  SchemaInitializerItemOptions,
  SchemaInitializerProvider,
} from '@nocobase/client';
import React from 'react';

const removeColumn = (schema, cb) => {
  cb(schema, {
    removeParentsIfNoChildren: true,
    breakRemoveOn: {
      'x-component': 'ArrayTable',
    },
  });
};

const useTableColumnInitializerFields = () => {
  const fields: SchemaInitializerItemOptions[] = [
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

// 因为有个动态获取字段的 hook，所以这里将 SchemaInitializerProvider 自定义的处理了一下
const CustomSchemaInitializerProvider: React.FC = (props) => {
  const initializers = {
    AddColumn: {
      insertPosition: 'beforeEnd',
      title: 'Configure columns',
      wrap: columnWrap,
      items: [
        {
          type: 'itemGroup',
          title: 'Display fields',
          children: useTableColumnInitializerFields(),
        },
      ],
    },
  };
  return <SchemaInitializerProvider initializers={initializers}>{props.children}</SchemaInitializerProvider>;
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
};

export default function App() {
  return (
    <SchemaComponentProvider designable components={{ Input, ArrayTable }}>
      <CustomSchemaInitializerProvider>
        <SchemaComponent schema={schema} />
      </CustomSchemaInitializerProvider>
    </SchemaComponentProvider>
  );
}
