import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { message } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Redirect, useHistory } from 'react-router-dom';
import { SchemaComponent, useAPIClient, useCurrentDocumentTitle, useSystemSettings } from '..';
import VerificationCode from './VerificationCode';

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
    phone: {
      type: 'string',
      required: true,
      'x-component': 'Input',
      'x-validator': 'phone',
      'x-decorator': 'FormItem',
      'x-component-props': { placeholder: '{{t("Phone")}}', style: {} },
      'x-visible': '{{smsAuthEnabled}}',
    },
    code: {
      type: 'string',
      required: true,
      'x-component': 'VerificationCode',
      'x-component-props': {
        actionType: 'users:signup',
        targetFieldName: 'phone',
      },
      'x-decorator': 'FormItem',
      'x-visible': '{{smsAuthEnabled}}',
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
            useAction: '{{ useSignup }}',
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

export const useSignup = () => {
  const history = useHistory();
  const form = useForm();
  const api = useAPIClient();
  const { t } = useTranslation();
  return {
    async run() {
      await form.submit();
      await api.resource('users').signup({
        values: form.values,
      });
      message.success('Sign up successfully, and automatically jump to the sign in page');
      setTimeout(() => {
        history.push('/signin');
      }, 2000);
    },
  };
};

export const SignupPage = () => {
  useCurrentDocumentTitle('Signup');
  const ctx = useSystemSettings();
  const { allowSignUp, smsAuthEnabled } = ctx?.data?.data || {};
  if (!allowSignUp) {
    return <Redirect to={'/signin'} />;
  }
  return (
    <SchemaComponent
      schema={schema}
      components={{
        VerificationCode,
      }}
      scope={{ useSignup, smsAuthEnabled }}
    />
  );
};
