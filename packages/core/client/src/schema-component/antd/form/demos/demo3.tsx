import { FormItem, Input } from '@formily/antd-v5';
import { ISchema, observer, useForm } from '@formily/react';
import { Action, Form, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import { Card } from 'antd';
import React from 'react';

const schema: ISchema = {
  type: 'object',
  properties: {
    form1: {
      type: 'void',
      'x-component': 'Form',
      'x-component-props': {
        initialValue: {
          field1: 'aaa',
        },
      },
      properties: {
        field1: {
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          title: 'T1',
        },
        out: {
          'x-component': 'Output',
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

export default observer(() => {
  const Output = observer(
    () => {
      const form = useForm();
      return <pre>{JSON.stringify(form.values, null, 2)}</pre>;
    },
    { displayName: 'Output' },
  );

  const useSubmit = () => {
    const form = useForm();
    return {
      async run() {
        console.log(form.values);
      },
    };
  };

  return (
    <SchemaComponentProvider scope={{ useSubmit }} components={{ Card, Output, Action, Form, Input, FormItem }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
});
