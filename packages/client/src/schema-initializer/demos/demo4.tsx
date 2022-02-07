import { observer } from '@formily/react';
import { ArrayTable, Input, SchemaComponent, SchemaComponentProvider, SchemaInitializer } from '@nocobase/client';
import React from 'react';

const useTableColumnInitializerFields = () => {
  const fields = [
    {
      key: 'field1',
      title: 'Field1',
      component: ColumnInitializer,
    },
    {
      key: 'field2',
      title: 'Field2',
      component: 'ColumnInitializer',
    },
  ];
  return fields;
};

export const InitializerButton = observer((props: any) => {
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

export const ColumnInitializer = (props) => {
  const { title, insert } = props;
  return (
    <SchemaInitializer.Item
      onClick={(info) => {
        insert({
          type: 'void',
          title: 'Name',
          'x-component': 'ArrayTable.Column',
          properties: {
            name: {
              type: 'string',
              'x-component': 'Input',
              'x-read-pretty': true,
            },
          },
        });
      }}
    >
      {title}
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
      'x-initializer': 'InitializerButton',
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
    <SchemaComponentProvider components={{ ColumnInitializer, Input, ArrayTable, InitializerButton }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
}
