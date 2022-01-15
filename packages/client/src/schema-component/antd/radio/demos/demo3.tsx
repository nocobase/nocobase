/**
 * title: 组
 */
import { FormItem } from '@formily/antd';
import { Radio, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import React from 'react';

const options = [
  {
    label: '男',
    value: 1,
    color: 'blue',
  },
  {
    label: '女',
    value: 2,
    color: 'red',
  },
];

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'array',
      title: `编辑模式`,
      enum: options,
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
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
      enum: options,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider components={{ Radio, FormItem }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
