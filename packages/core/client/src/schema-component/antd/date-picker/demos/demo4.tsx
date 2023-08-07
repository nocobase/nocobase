/**
 * title: DatePicker.RangePicker
 */
import { FormItem } from '@formily/antd-v5';
import { DatePicker, Input, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import dayjs from 'dayjs';
import React from 'react';

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'boolean',
      title: `Editable`,
      'x-decorator': 'FormItem',
      'x-component': 'DatePicker.RangePicker',
      'x-component-props': {
        gmt: true,
        defaultPickerValue: [dayjs('2023-05-01')],
      },
      'x-reactions': [
        {
          target: 'read1',
          fulfill: {
            state: {
              value: '{{$self.value}}',
            },
          },
        },
        {
          target: 'read2',
          fulfill: {
            state: {
              value: '{{$self.value && $self.value.join(" ~ ")}}',
            },
          },
        },
      ],
    },
    read1: {
      type: 'boolean',
      title: `Read pretty`,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'DatePicker.RangePicker',
      'x-component-props': {
        gmt: true,
        defaultPickerValue: [dayjs('2023-05-01')],
      },
    },
    read2: {
      type: 'string',
      title: `Value`,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-component-props': {},
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider components={{ Input, DatePicker, FormItem }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
