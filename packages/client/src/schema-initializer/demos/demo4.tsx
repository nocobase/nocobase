import {
  ArrayTable,
  ArrayTableColumnInitializer,
  Input,
  SchemaComponent,
  SchemaComponentProvider
} from '@nocobase/client';
import React from 'react';

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
      'x-column-initializer': 'ArrayTableColumnInitializer',
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
    <SchemaComponentProvider components={{ Input, ArrayTable, ArrayTableColumnInitializer }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
}
