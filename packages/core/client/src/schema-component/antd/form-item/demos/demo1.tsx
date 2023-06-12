import { FormItem, FormProvider, Input, SchemaComponent } from '@nocobase/client';
import React from 'react';

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'string',
      title: 'title',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
  },
};

export default () => {
  return (
    <FormProvider>
      <SchemaComponent components={{ FormItem, Input }} schema={schema} />
    </FormProvider>
  );
};
