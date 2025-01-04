/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaComponent, usePlugin } from '@nocobase/client';
import { ISchema } from '@formily/react';
import React from 'react';
import { Authenticator, useSignIn } from '@nocobase/plugin-auth/client';
import PluginVerificationClient, { SMS_OTP_VERIFICATION_TYPE } from '@nocobase/plugin-verification/client';

const phoneForm: ISchema = {
  type: 'object',
  name: 'phoneForm',
  'x-component': 'Form',
  properties: {
    form: {
      type: 'void',
      'x-component': 'VerificationForm',
      'x-component-props': {
        submitButtonProps: {
          title: '{{t("Sign in")}}',
          useAction: '{{ useSMSSignIn }}',
        },
        verificationCodeProps: {
          actionType: 'auth:signIn',
        },
      },
    },
    tip: {
      type: 'void',
      'x-component': 'div',
      'x-content': '{{t("User will be registered automatically if not exists.", {ns: "auth-sms"})}}',
      'x-component-props': { style: { color: '#ccc' } },
      'x-visible': '{{ autoSignup }}',
    },
  },
};

export const SigninPage = (props: { authenticator: Authenticator }) => {
  const authenticator = props.authenticator;
  const { name, options } = authenticator;
  const autoSignup = !!options?.autoSignup;
  const useSMSSignIn = () => {
    return useSignIn(name);
  };
  const verficationPlugin = usePlugin('verification') as PluginVerificationClient;
  const smsVerification = verficationPlugin.verifications.get(SMS_OTP_VERIFICATION_TYPE);
  const VerificationForm = smsVerification?.components.VerificationForm;

  return <SchemaComponent schema={phoneForm} scope={{ useSMSSignIn, autoSignup }} components={{ VerificationForm }} />;
};
