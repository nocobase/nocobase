import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { SchemaComponent, useAPIClient, useCurrentDocumentTitle, useSystemSettings } from '..';

const schema: ISchema = {
  type: 'object',
  name: uid(),
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
            useAction: '{{ useSignin }}',
            style: { width: '100%' },
          },
        },
      },
    },
    link: {
      type: 'void',
      'x-component': 'div',
      'x-visible': '{{allowSignUp}}',
      properties: {
        link: {
          title: '{{t("Create an account")}}',
          type: 'void',
          'x-component': 'Link',
          'x-content': '{{t("Create an account")}}',
          'x-component-props': { to: '/signup' },
        },
      },
    },
  },
};

export const useSignin = () => {
  const location = useLocation<any>();
  const history = useHistory();
  const form = useForm();
  const api = useAPIClient();
  const redirect = location?.['query']?.redirect;
  return {
    async run() {
      await form.submit();
      await api.auth.signIn(form.values);
      history.push(redirect || '/admin');
    },
  };
};

export const SigninPage = () => {
  useCurrentDocumentTitle('Signin');
  const ctx = useSystemSettings();
  const allowSignUp = ctx?.data?.data?.allowSignUp;
  return (
    <div>
      <SchemaComponent scope={{ useSignin, allowSignUp }} schema={schema} />
    </div>
  );
};
