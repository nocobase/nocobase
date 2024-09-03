/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';
import { SchemaComponent, useAPIClient, useCurrentUserContext } from '@nocobase/client';
import React, { useCallback, useEffect, useState } from 'react';
import { useAuthTranslation } from '../locale';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from '@formily/react';
import { useSignUpForms } from '../pages';
import { Authenticator } from '../authenticator';

import { useLWAuthContext } from '../basic/code';

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
  const { codeIsVisible, setCodeIsVisible, loginShow, setLoginShow, setChangePassword, setLWuserID } =
    useLWAuthContext();

  const setCodeShow = () => {
    setCodeIsVisible(true); // 这将异步更新codeIsVisible的状态
  };

  useEffect(() => {
    const signInAsync = async () => {
      if (loginShow) {
        await form.submit();
        const { data } = await api.auth.signIn(form.values, authenticator);
        await refreshAsync();
        redirect();
        // if (data.data.user.passwordLose == '200') {
        //   await refreshAsync();
        //   redirect();
        // } else {
        //   setLWuserID(data.data.user.id);
        //   setChangePassword(true);
        //   form.values['password'] = '';
        // }
      }
    };
    signInAsync();
    setLoginShow(false);
  }, [loginShow, setLoginShow, api.auth, authenticator, form, redirect, refreshAsync, setChangePassword, setLWuserID]);

  return {
    async run() {
      if (form.values['account'] === undefined || form.values['password'] === undefined) {
        await form.submit();
        return;
      } else {
        console.log('form.values:', form.values);
        setCodeShow();
      }
    },
  };
};

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
    signUp: {
      type: 'void',
      'x-component': 'Link',
      'x-component-props': {
        to: '{{ signUpLink }}',
      },
      'x-content': '{{t("Create an account")}}',
      'x-visible': '{{ allowSignUp }}',
    },
  },
};
export const SignInForm = (props: { authenticator: Authenticator }) => {
  const { t } = useAuthTranslation();
  const authenticator = props.authenticator;
  const { authType, name, options } = authenticator;
  const signUpPages = useSignUpForms();
  const allowSignUp = signUpPages[authType] && options?.allowSignUp ? true : false;
  const signUpLink = `/signup?name=${name}`;

  const useBasicSignIn = () => {
    return useSignIn(name);
  };
  return <SchemaComponent schema={passwordForm} scope={{ useBasicSignIn, allowSignUp, signUpLink, t }} />;
};
