import { FormItem } from '@formily/antd-v5';
import { Cascader, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import React from 'react';

const options = [
  {
    value: 'zhejiang',
    label: 'Zhejiang',
    children: [
      {
        value: 'hangzhou',
        label: 'Hangzhou',
        children: [
          {
            value: 'xihu',
            label: 'West Lake',
          },
        ],
      },
    ],
  },
  {
    value: 'jiangsu',
    label: 'Jiangsu',
    children: [
      {
        value: 'nanjing',
        label: 'Nanjing',
        children: [
          {
            value: 'zhonghuamen',
            label: 'Zhong Hua Men',
          },
        ],
      },
    ],
  },
];

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'string',
      title: `编辑模式`,
      name: 'name1',
      enum: options,
      'x-decorator': 'FormItem',
      'x-component': 'Cascader',
      'x-component-props': {
        // changeOnSelect: true,
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
      type: 'string',
      title: `阅读模式`,
      enum: options,
      name: 'name2',
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Cascader',
      'x-component-props': {
        changeOnSelect: true,
      },
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider components={{ Cascader, FormItem }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
