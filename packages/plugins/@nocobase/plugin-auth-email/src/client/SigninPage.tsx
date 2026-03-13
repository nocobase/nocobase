/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaComponent, useAPIClient, useCurrentUserContext, usePlugin } from '@nocobase/client';
import { ISchema, useForm } from '@formily/react';
import React from 'react';
import { Authenticator, useRedirect } from '@nocobase/plugin-auth/client';
import PluginVerificationClient from '@nocobase/plugin-verification/client';
import { useAuthTranslation } from './locale';

const EMAIL_OTP_VERIFICATION_TYPE = 'email-otp';

const emailForm: ISchema = {
  type: 'object',
  name: 'emailForm',
  'x-component': 'FormV2',
  properties: {
    form: {
      type: 'void',
      'x-component': 'VerificationForm',
      'x-component-props': {
        actionType: 'auth:signIn:email',
        verifier: '{{ verifier }}',
      },
    },
    actions: {
      type: 'void',
      title: '{{t("Sign in")}}',
      'x-component': 'Action',
      'x-use-component-props': 'useVerifyActionProps',
      'x-component-props': {
        htmlType: 'submit',
        block: true,
        type: 'primary',
        style: { width: '100%' },
      },
    },
    tip: {
      type: 'void',
      'x-component': 'div',
      'x-content': '{{t("User will be registered automatically if not exists.", {ns: "auth-email"})}}',
      'x-component-props': { style: { color: '#ccc' } },
      'x-visible': '{{ autoSignup }}',
    },
  },
};

const useVerifyActionProps = (authenticator: string) => {
  const form = useForm();
  const api = useAPIClient();
  const redirect = useRedirect();
  const { refreshAsync } = useCurrentUserContext();
  const { t } = useAuthTranslation();
  return {
    title: t('Sign in'),
    async onClick() {
      await form.submit();
      await api.auth.signIn(form.values, authenticator);
      await refreshAsync();
      redirect();
    },
  };
};

export const SigninPage = (props: { authenticator: any }) => {
  const authenticator = props.authenticator as any;
  const { name, options } = authenticator;
  const autoSignup = !!options?.autoSignup;
  const verficationPlugin = usePlugin('verification') as PluginVerificationClient;
  const emailVerification = verficationPlugin.verificationManager.getVerification(EMAIL_OTP_VERIFICATION_TYPE);
  const VerificationForm = emailVerification?.components.VerificationForm;

  return (
    <SchemaComponent
      schema={emailForm}
      scope={{ useVerifyActionProps: () => useVerifyActionProps(name), autoSignup, verifier: options?.verifier }}
      components={{ VerificationForm }}
    />
  );
};
