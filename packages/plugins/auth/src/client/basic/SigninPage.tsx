import { Authenticator, SchemaComponent, SignupPageContext, useSignIn } from '@nocobase/client';
import { ISchema } from '@formily/react';
import React, { useContext } from 'react';

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
    signup: {
      type: 'void',
      'x-component': 'Link',
      'x-component-props': {
        to: '{{ signupLink }}',
      },
      'x-content': '{{t("Create an account")}}',
      'x-visible': '{{ allowSignUp }}',
    },
  },
};
export default (props: { authenticator: Authenticator }) => {
  const authenticator = props.authenticator;
  const { authType, name, options } = authenticator;
  const signupPages = useContext(SignupPageContext);
  const allowSignUp = !!signupPages[authType] && !options?.disabledSignup;
  const signupLink = `/signup?authType=${authType}&name=${name}`;

  const useBasicSignIn = () => {
    return useSignIn(name);
  };
  return <SchemaComponent schema={passwordForm} scope={{ useBasicSignIn, allowSignUp, signupLink }} />;
};
