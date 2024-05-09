import { FormItem } from '@formily/antd-v5';
import { Application, Input, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import React from 'react';

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'object',
      title: `Editable`,
      'x-decorator': 'FormItem',
      'x-component': 'Input.JSON',
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
      'x-component': 'Input.JSON',
    },
  },
};

const Root = () => {
  return (
    <SchemaComponentProvider components={{ Input, FormItem }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};

const app = new Application({
  providers: [Root],
});

export default app.getRootComponent();
