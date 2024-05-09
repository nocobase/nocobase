/**
 * title: Radio Group
 * desc: A group of radio components.
 */
import { FormItem } from '@formily/antd-v5';
import { Radio, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import React from 'react';

const options = [
  {
    label: '男',
    value: '1',
  },
  {
    label: '女',
    value: '2',
  },
];

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'number',
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
      type: 'number',
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
