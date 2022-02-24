import { ISchema } from '@formily/react';
import { Input, SchemaComponent, SchemaComponentProvider, Table } from '@nocobase/client';
import React from 'react';

const schema: ISchema = {
  type: 'object',
  properties: {
    input: {
      type: 'array',
      title: `编辑模式`,
      default: [
        { id: 1, name: 'Name1' },
        { id: 2, name: 'Name2' },
        { id: 3, name: 'Name3' },
      ],
      'x-component': 'Table.Array',
      'x-component-props': {
        rowKey: 'id',
        rowSelection: {
          type: 'checkbox',
        },
      },
      properties: {
        column1: {
          type: 'void',
          title: 'Name',
          'x-component': 'Table.Column',
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

export default () => {
  return (
    <SchemaComponentProvider components={{ Table, Input }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
