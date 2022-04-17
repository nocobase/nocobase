import { FormItem } from '@formily/antd';
import { SchemaComponent, SchemaComponentProvider, Slate } from '@nocobase/client';
import React from 'react';

const schema = {
  type: 'object',
  properties: {
    slate: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Slate.RichText',
      'x-component-props': {
        onChange: (value) => {
          console.log(value);
        },
      },
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
