/**
 * title: 勾选
 */
import React from 'react';
import { ArrayTable, SchemaComponentProvider, SchemaComponent } from '@nocobase/client';
import { FormItem } from '@formily/antd';

const schema = {
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
    <SchemaComponentProvider components={{ ArrayTable, FormItem }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
