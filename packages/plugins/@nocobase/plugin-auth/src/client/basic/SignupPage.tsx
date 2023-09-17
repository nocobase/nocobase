import { SchemaComponent, useSignup } from '@nocobase/client';
import { ISchema } from '@formily/react';
import React from 'react';
import { uid } from '@formily/shared';
import { useAuthTranslation } from '../locale';

const signupPageSchema: ISchema = {
  type: 'object',
  name: uid(),
  'x-component': 'FormV2',
  properties: {
    username: {
      type: 'string',
      required: true,
      'x-component': 'Input',
      'x-validator': { username: true },
      'x-decorator': 'FormItem',
      'x-component-props': { placeholder: '{{t("Username")}}', style: {} },
    },
    password: {
      type: 'string',
      required: true,
      'x-component': 'Password',
      'x-decorator': 'FormItem',
      'x-component-props': { placeholder: '{{t("Password")}}', checkStrength: true, style: {} },
      'x-reactions': [
        {
          dependencies: ['.confirm_password'],
          fulfill: {
            state: {
              selfErrors: '{{$deps[0] && $self.value && $self.value !== $deps[0] ? t("Password mismatch") : ""}}',
            },
          },
        },
      ],
    },
    confirm_password: {
      type: 'string',
      required: true,
      'x-component': 'Password',
      'x-decorator': 'FormItem',
      'x-component-props': { placeholder: '{{t("Confirm password")}}', style: {} },
      'x-reactions': [
        {
          dependencies: ['.password'],
          fulfill: {
            state: {
              selfErrors: '{{$deps[0] && $self.value && $self.value !== $deps[0] ? t("Password mismatch") : ""}}',
            },
          },
        },
      ],
    },
    actions: {
      type: 'void',
      'x-component': 'div',
      properties: {
        submit: {
          title: '{{t("Sign up")}}',
          type: 'void',
          'x-component': 'Action',
          'x-component-props': {
            block: true,
            type: 'primary',
            htmlType: 'submit',
            useAction: '{{ useBasicSignup }}',
            style: { width: '100%' },
          },
        },
      },
    },
    link: {
      type: 'void',
      'x-component': 'div',
      properties: {
        link: {
          type: 'void',
          'x-component': 'Link',
          'x-component-props': { to: '/signin' },
          'x-content': '{{t("Log in with an existing account")}}',
        },
      },
    },
  },
};

export default (props: { name: string }) => {
  const { t } = useAuthTranslation();
  const useBasicSignup = () => {
    return useSignup({ authenticator: props.name });
  };
  return <SchemaComponent schema={signupPageSchema} scope={{ useBasicSignup, t }} />;
};
