/**
 * title: 组
 */
import React from 'react';
import { SchemaComponentProvider, SchemaComponent, Checkbox } from '@nocobase/client';
import { FormItem } from '@formily/antd';

const options = [
  {
    label: '选项1',
    value: 1,
    color: 'red',
  },
  {
    label: '选项2',
    value: 2,
    color: 'blue',
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
      'x-component': 'Checkbox.Group',
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
      'x-component': 'Checkbox.Group',
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider components={{ Checkbox, FormItem }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
