import { FormItem } from '@formily/antd-v5';
import { InputNumber, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import React from 'react';

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'string',
      title: `Editable`,
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': {
        addonBefore: '¥',
        addonAfter: '万元',
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
      title: `Read pretty`,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': {
        addonBefore: '¥',
        addonAfter: '万元',
      },
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider components={{ InputNumber, FormItem }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
