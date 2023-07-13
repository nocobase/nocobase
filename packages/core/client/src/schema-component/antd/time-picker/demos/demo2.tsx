/**
 * title: TimePicker.RangePicker
 */
import { FormItem } from '@formily/antd-v5';
import { SchemaComponent, SchemaComponentProvider, TimePicker } from '@nocobase/client';
import React from 'react';

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'string',
      title: `Editable`,
      'x-decorator': 'FormItem',
      'x-component': 'TimePicker.RangePicker',
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
      'x-component': 'TimePicker.RangePicker',
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider components={{ TimePicker, FormItem }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
