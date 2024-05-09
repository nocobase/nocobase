import { ISchema } from '@formily/react';
import { Application, Input, SchemaComponent, SchemaComponentProvider, Table } from '@nocobase/client';
import React from 'react';

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
        dataSource: [
          { id: 1, name: 'Name1' },
          { id: 2, name: 'Name2' },
          { id: 3, name: 'Name3' },
        ],
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

const Root = () => {
  return (
    <SchemaComponentProvider components={{ Table, Input }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};

const app = new Application({
  providers: [Root],
});

export default app.getRootComponent();
