import { SchemaComponent } from '@nocobase/client';
import { ISchema } from '@formily/react';
import React from 'react';
import { uid } from '@formily/shared';
import { useAuthTranslation } from '../locale';
import { useAPIClient } from '@nocobase/client';
import { useForm } from '@formily/react';
import { useNavigate, Navigate } from 'react-router-dom';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAuthenticator } from '../authenticator';

export interface UseSignupProps {
  authenticator?: string;
  message?: {
    success?: string;
  };
}

export const useSignUp = (props?: UseSignupProps) => {
  const navigate = useNavigate();
  const form = useForm();
  const api = useAPIClient();
  const { t } = useTranslation();
  return {
    async run() {
      await form.submit();
      await api.auth.signUp(form.values, props?.authenticator);
      message.success(props?.message?.success || t('Sign up successfully, and automatically jump to the sign in page'));
      setTimeout(() => {
        navigate('/signin');
      }, 2000);
    },
  };
};

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
            useAction: '{{ useBasicSignUp }}',
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

export const SignUpForm = ({ authenticatorName: name }: { authenticatorName: string }) => {
  const { t } = useAuthTranslation();
  const useBasicSignUp = () => {
    return useSignUp({ authenticator: name });
  };
  const authenticator = useAuthenticator(name);
  const { options } = authenticator;
  if (!options?.allowSignUp) {
    return <Navigate to="/not-found" replace={true} />;
  }
  return <SchemaComponent schema={signupPageSchema} scope={{ useBasicSignUp, t }} />;
};
