/**
 * title: 勾选
 */
import { FormItem } from '@formily/antd';
import { Radio, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import React from 'react';

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'boolean',
      title: `编辑模式`,
      'x-decorator': 'FormItem',
      'x-component': 'Radio',
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
      type: 'boolean',
      title: `阅读模式`,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Radio',
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
