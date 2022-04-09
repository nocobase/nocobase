/**
 * title: Input
 */
import { FormItem } from '@formily/antd';
import { SchemaComponent, SchemaComponentProvider, Slate } from '@nocobase/client';
import React from 'react';

const schema = {
  type: 'object',
  properties: {
    input: {
      title: `Editable1`,
      'x-decorator': 'FormItem',
      'x-component': 'Slate.RichText',
      'x-reactions': {
        target: '*(input2,read)',
        fulfill: {
          state: {
            value: '{{$self.value}}',
          },
        },
      },
    },
    input2: {
      title: `Editable2`,
      'x-decorator': 'FormItem',
      'x-component': 'Slate.RichText',
    },
    read: {
      title: `Read pretty`,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Slate.RichText',
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider components={{ Slate, FormItem }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
