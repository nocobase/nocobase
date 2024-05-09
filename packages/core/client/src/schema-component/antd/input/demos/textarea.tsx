import { FormItem } from '@formily/antd-v5';
import { Application, Input, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import React from 'react';

const schema = {
  type: 'object',
  properties: {
    input: {
      interface: 'string',
      type: 'string',
      title: `Editable`,
      name: 'name1',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
      'x-reactions': {
        target: '*(read1,read2,read3)',
        fulfill: {
          state: {
            value: '{{$self.value}}',
          },
        },
      },
    },
    read1: {
      interface: 'string',
      type: 'string',
      title: `Read pretty`,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
    },
    read2: {
      interface: 'string',
      type: 'string',
      title: `Read pretty(ellipsis)`,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
      'x-component-props': {
        ellipsis: true,
        style: {
          width: '100px',
        },
      },
    },
    read3: {
      interface: 'string',
      type: 'string',
      title: `Read pretty(autop)`,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
      'x-component-props': {
        autop: true,
      },
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
