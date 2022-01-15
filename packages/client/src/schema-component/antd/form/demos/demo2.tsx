import React from 'react';
import { observer, ISchema, useForm } from '@formily/react';
import { SchemaComponent, SchemaComponentProvider, Form, Action } from '@nocobase/client';
import 'antd/dist/antd.css';
import { FormItem, Input } from '@formily/antd';

export default observer(() => {
  const schema: ISchema = {
    type: 'object',
    properties: {
      form1: {
        type: 'void',
        'x-component': 'Form',
        properties: {
          field1: {
            'x-component': 'Input',
            'x-decorator': 'FormItem',
            title: 'T1',
          },
          action1: {
            // type: 'void',
            'x-component': 'Action',
            title: 'Submit',
            'x-component-props': {
              useAction: '{{ useSubmit }}',
            },
          },
        },
      },
    },
  };

  const useSubmit = () => {
    const form = useForm();
    return {
      async run() {
        console.log(form.values);
      },
    };
  };

  return (
    <SchemaComponentProvider scope={{ useSubmit }} components={{ Action, Form, Input, FormItem }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
});
