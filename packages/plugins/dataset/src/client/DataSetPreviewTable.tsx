import { ISchema } from '@formily/react';
import { Input, SchemaComponent, SchemaComponentProvider, Table } from '@nocobase/client';
import React from 'react';

const a= [{ id: 1, name: 'Name1' },
  { id: 2, name: 'Name2' },
  { id: 3, name: 'Name3' },
]
const schema: ISchema = {
  type: 'object',
  properties: {
    input: {
      type: 'array',
      title: `编辑模式`,
      'x-component': 'Table.Void',
      'x-component-props': {
        rowKey: 'id',
        rowSelection: {
          type: 'checkbox',
        },
        // dataSource: [
        //   { id: 1, name: 'Name1' },
        //   { id: 2, name: 'Name2' },
        //   { id: 3, name: 'Name3' },
        // ],
        dataSource: '{{dataSet}}',
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

interface DataSetPreviewProps {
  dataSet: null | [];
}

export default ({ dataSet }: DataSetPreviewProps) => {
  console.log(dataSet, '===========================');
  return (
    <SchemaComponentProvider scope={{dataSet}} components={{ Table, Input }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
