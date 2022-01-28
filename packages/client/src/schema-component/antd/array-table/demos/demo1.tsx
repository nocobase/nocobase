/**
 * title: 勾选
 */
import { FormItem } from '@formily/antd';
import { ISchema } from '@formily/react';
import { ArrayTable, Input, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
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
      'x-decorator': 'FormItem',
      'x-component': 'ArrayTable',
      'x-component-props': {
        rowKey: 'id',
      },
      'x-reactions': {
        target: 'read',
        fulfill: {
          state: {
            value: '{{$self.value}}',
          },
        },
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
    read: {
      type: 'array',
      title: `阅读模式`,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'ArrayTable',
      'x-component-props': {
        rowKey: 'id',
      },
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider components={{ Input, ArrayTable, FormItem }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
