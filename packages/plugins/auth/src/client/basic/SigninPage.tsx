import { SchemaComponent, useSignIn } from '@nocobase/client';
import { ISchema } from '@formily/react';
import React from 'react';

const passwordForm: ISchema = {
  type: 'object',
  name: 'passwordForm',
  'x-component': 'FormV2',
  properties: {
    email: {
      type: 'string',
      required: true,
      'x-component': 'Input',
      'x-validator': 'email',
      'x-decorator': 'FormItem',
      'x-component-props': { placeholder: '{{t("Email")}}', style: {} },
    },
    password: {
      type: 'string',
      'x-component': 'Password',
      required: true,
      'x-decorator': 'FormItem',
      'x-component-props': { placeholder: '{{t("Password")}}', style: {} },
    },
    actions: {
      type: 'void',
      'x-component': 'div',
      properties: {
        submit: {
          title: '{{t("Sign in")}}',
          type: 'void',
          'x-component': 'Action',
          'x-component-props': {
            htmlType: 'submit',
            block: true,
            type: 'primary',
            useAction: `{{ useBasicSignIn }}`,
            style: { width: '100%' },
          },
        },
      },
    },
  },
};
export default (props: { name: string }) => {
  const useBasicSignIn = () => {
    return useSignIn(props.name);
  };
  return <SchemaComponent schema={passwordForm} scope={{ useBasicSignIn }} />;
};
