import { FormItem } from '@formily/antd-v5';
import { RichText, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import React from 'react';
import 'react-quill/dist/quill.snow.css'; // ES6

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'string',
      title: `Editable`,
      'x-decorator': 'FormItem',
      'x-component': 'RichText',
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
      'x-component': 'RichText',
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider components={{ RichText, FormItem }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
