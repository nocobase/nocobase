import { FormItem } from '@formily/antd-v5';
import { Details, FormProvider, Input, SchemaComponent } from '@nocobase/client';
import React from 'react';

const schema = {
  type: 'object',
  properties: {
    details: {
      type: 'string',
      'x-component': 'Details',
      properties: {
        name: {
          type: 'string',
          title: 'Name',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-read-pretty': true,
          default: 'this is name',
        },
        age: {
          type: 'string',
          title: 'Age',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-read-pretty': true,
          default: 'this is age',
        },
      },
    },
  },
};

export default () => {
  return (
    <FormProvider>
      <SchemaComponent components={{ Details, FormItem, Input }} schema={schema} />
    </FormProvider>
  );
};
