/**
 * title: 勾选
 */
import { FormItem } from '@formily/antd';
import { ISchema } from '@formily/react';
import { Input, SchemaComponent, SchemaComponentProvider, VoidTable } from '@nocobase/client';
import React from 'react';

const schema: ISchema = {
  type: 'object',
  properties: {
    input: {
      type: 'array',
      title: `编辑模式`,
      'x-decorator': 'FormItem',
      'x-component': 'VoidTable',
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
          'x-component': 'VoidTable.Column',
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
    <SchemaComponentProvider components={{ Input, VoidTable, FormItem }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
