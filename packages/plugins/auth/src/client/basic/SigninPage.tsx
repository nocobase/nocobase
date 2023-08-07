import { ISchema } from '@formily/react';
import { Authenticator, SchemaComponent, SignupPageContext, useSignIn } from '@nocobase/client';
import React, { useContext } from 'react';
import { useAuthTranslation } from '../locale';

const passwordForm: ISchema = {
  type: 'object',
  name: 'passwordForm',
  'x-component': 'FormV2',
  properties: {
    account: {
      type: 'string',
      'x-component': 'Input',
      'x-validator': `{{(value) => {
        if (!value) {
          return t("Please enter your username or email");
        }
        if (value.includes('@')) {
          if (!/^[\\w-]+(\\.[\\w-]+)*@[\\w-]+(\\.[\\w-]+)+$/.test(value)) {
            return t("Please enter a valid email");
          }
        } else {
          return /^[^@.<>"'/]{2,16}$/.test(value) || t("Please enter a valid username");
        }
      }}}`,
      'x-decorator': 'FormItem',
      'x-component-props': { placeholder: '{{t("Username/Email")}}', style: {} },
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
  const { t } = useAuthTranslation();
  const authenticator = props.authenticator;
  const { authType, name, options } = authenticator;
  const signupPages = useContext(SignupPageContext);
  const allowSignUp = !!signupPages[authType] && options?.allowSignup;
  const signupLink = `/signup?authType=${authType}&name=${name}`;

  const useBasicSignIn = () => {
    return useSignIn(name);
  };
  return <SchemaComponent schema={passwordForm} scope={{ useBasicSignIn, allowSignUp, signupLink, t }} />;
};
