import { ISchema } from '@formily/react';
import { AntdSchemaComponentProvider, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import React from 'react';

const schema: ISchema = {
  type: 'object',
  properties: {
    table: {
      type: 'array',
      default: [
        {
          id: 1,
          name: 'Name1',
        },
        {
          id: 2,
          name: 'Name2',
        },
        {
          id: 3,
          name: 'Name3',
        },
        {
          id: 4,
          name: 'Name4',
        },
      ],
      'x-component': 'TableV2',
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
          'x-component': 'TableV2.Column',
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
    <SchemaComponentProvider designable>
      <AntdSchemaComponentProvider>
        <SchemaComponent schema={schema} />
      </AntdSchemaComponentProvider>
    </SchemaComponentProvider>
  );
};
