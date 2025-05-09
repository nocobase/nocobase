/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';
import { SchemaComponent, useAPIClient, useCurrentUserContext, useLazy } from '@nocobase/client';
import React, { useCallback } from 'react';
import { useAuthTranslation } from '../locale';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from '@formily/react';
// import { useSignUpForms } from '../pages';
import { Authenticator } from '../authenticator';

export function useRedirect(next = '/admin') {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  return useCallback(() => {
    navigate(searchParams.get('redirect') || '/admin', { replace: true });
  }, [navigate, searchParams]);
}

export const useSignIn = (authenticator: string) => {
  const form = useForm();
  const api = useAPIClient();
  const redirect = useRedirect();
  const { refreshAsync } = useCurrentUserContext();
  return {
    async run() {
      await form.submit();
      await api.auth.signIn(form.values, authenticator);
      await refreshAsync();
      redirect();
    },
  };
};

const getPasswordForm = ({ showForgotPassword }: { showForgotPassword?: boolean }): ISchema => ({
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
          return /^[^@.<>"'/]{1,50}$/.test(value) || t("Please enter a valid username");
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
      'x-component-props': { placeholder: '{{t("Password")}}', style: {}, showForgotPassword },
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
    links: {
      type: 'void',
      'x-component': 'div',
      'x-component-props': {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
        },
      },
      properties: {
        signUp: {
          type: 'void',
          'x-component': 'Link',
          'x-component-props': {
            to: '{{ signUpLink }}',
          },
          'x-content': '{{t("Create an account")}}',
          'x-visible': '{{ allowSignUp }}',
        },
        forgotPassword: {
          type: 'void',
          'x-component': 'Link',
          'x-component-props': {
            to: '{{"/forgot-password?name=" + authenticator.name}}',
          },
          'x-content': '{{t("Forgot password")}}',
          'x-visible': showForgotPassword,
        },
      },
    },
  },
});
export const SignInForm = (props: { authenticator: Authenticator }) => {
  const { t } = useAuthTranslation();
  const authenticator = props.authenticator;
  const { authType, name, options } = authenticator;
  const useSignUpForms = useLazy<typeof import('../pages').useSignUpForms>(() => import('../pages'), 'useSignUpForms');
  const signUpPages = useSignUpForms();
  const allowSignUp = signUpPages[authType] && options?.allowSignUp ? true : false;
  const signUpLink = `/signup?name=${name}`;

  const useBasicSignIn = () => {
    return useSignIn(name);
  };
  return (
    <SchemaComponent
      schema={getPasswordForm({ showForgotPassword: !!options?.enableResetPassword })}
      scope={{ useBasicSignIn, allowSignUp, signUpLink, t, authenticator }}
    />
  );
};
