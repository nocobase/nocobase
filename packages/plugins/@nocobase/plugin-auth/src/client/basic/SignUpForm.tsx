/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaComponent } from '@nocobase/client';
import { ISchema, Schema } from '@formily/react';
import React, { useMemo } from 'react';
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

const getSignupPageSchema = (fieldSchemas: any): ISchema => ({
  type: 'object',
  name: uid(),
  'x-component': 'FormV2',
  properties: {
    ...fieldSchemas,
    password: {
      type: 'string',
      required: true,
      title: '{{t("Password")}}',
      'x-component': 'Password',
      'x-decorator': 'FormItem',
      'x-validator': { password: true },
      'x-component-props': { checkStrength: true, style: {} },
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
      title: '{{t("Confirm password")}}',
      'x-validator': { password: true },
      'x-component-props': { style: {} },
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
});

export const SignUpForm = ({ authenticatorName: name }: { authenticatorName: string }) => {
  const { t } = useAuthTranslation();
  const { t: fieldT } = useTranslation('lm-collections');
  const useBasicSignUp = () => {
    return useSignUp({ authenticator: name });
  };
  const authenticator = useAuthenticator(name);
  const { options } = authenticator;
  const { signupForm } = options;
  const fieldSchemas = useMemo(() => {
    return signupForm
      .filter((field: { show: boolean }) => field.show)
      .reduce((prev: any, item: { field: string; required: boolean; uiSchema: any }) => {
        const uiSchema = {
          ...item.uiSchema,
          title: item.uiSchema.title ? fieldT(Schema.compile(item.uiSchema.title, { t })) : '',
        };
        prev[item.field] = {
          ...uiSchema,
          required: item.required,
          'x-decorator': 'FormItem',
        };
        return prev;
      }, {});
  }, [signupForm]);
  if (!options?.allowSignUp) {
    return <Navigate to="/not-found" replace={true} />;
  }
  const schema = getSignupPageSchema(fieldSchemas);
  return <SchemaComponent schema={schema} scope={{ useBasicSignUp, t }} />;
};
