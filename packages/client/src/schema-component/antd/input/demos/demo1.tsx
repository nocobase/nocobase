/**
 * title: Input Component
 */
import { FormItem } from '@formily/antd';
import { Input, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import React from 'react';

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'boolean',
      title: `edit mode`,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
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
      title: `pretty mode`,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider components={{ Input, FormItem }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
