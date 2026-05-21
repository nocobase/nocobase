/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { type Authenticator, useSignIn } from '@nocobase/plugin-auth/client-v2';
import { VerificationCode } from '@nocobase/plugin-verification/client-v2';
import { Alert, Button, Form, Input, Typography } from 'antd';
import React, { useState } from 'react';
import { useAuthSMSTranslation } from '../locale';

export type SmsPublicOptions = {
  verifier?: string;
  autoSignup: boolean;
};

/**
 * Extract sign-in–facing options from an authenticator returned by
 * `/authenticators:publicList`. That endpoint already flattens server-side
 * `options.public.*` into `options.*` (see plugin-auth server
 * actions/authenticators.ts `publicList`), so reading
 * `authenticator.options.public.verifier` always yields `undefined` and silently
 * sends `verifier: ''` to `smsOTP:publicCreate`. Centralising the unpacking
 * here lets tests pin the contract.
 */
export function pickSmsPublicOptions(authenticator: Authenticator | null | undefined): SmsPublicOptions {
  return {
    verifier: authenticator?.options?.verifier,
    autoSignup: !!authenticator?.options?.autoSignup,
  };
}

/**
 * SMS sign-in form rendered on the v2 `/signin` page when the user picks
 * an SMS authenticator tab. Two fields — phone number + OTP code — paired
 * with `<VerificationCode>` from `@nocobase/plugin-verification/client-v2`,
 * which owns the "send code / countdown" button and talks to the
 * `smsOTP:publicCreate` endpoint.
 *
 * Submission goes through `useSignIn` from `plugin-auth/client-v2`, the
 * same hook the password sign-in form uses — `auth:signIn` plus the
 * standard post-login redirect.
 */
export default function SmsSignInForm({ authenticator }: { authenticator: Authenticator }) {
  const { t } = useAuthSMSTranslation();
  const [form] = Form.useForm();
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const signIn = useSignIn(authenticator.name);

  const { autoSignup, verifier } = pickSmsPublicOptions(authenticator);
  const phone = Form.useWatch('uuid', form);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={async (values) => {
        setErrorMessage('');
        setLoading(true);
        try {
          await signIn.run(values);
        } catch (error: any) {
          setErrorMessage(error?.response?.data?.errors?.[0]?.message || error?.message || String(error));
        } finally {
          setLoading(false);
        }
      }}
    >
      {errorMessage ? <Alert style={{ marginBottom: 16 }} type="error" showIcon message={errorMessage} /> : null}
      <Form.Item name="uuid" rules={[{ required: true, message: t('Please enter a phone number') }]}>
        <Input autoComplete="tel" placeholder={t('Phone')} />
      </Form.Item>
      <Form.Item name="code" rules={[{ required: true, message: t('Please enter the verification code') }]}>
        <VerificationCode
          actionType="auth:signIn"
          verifier={verifier ?? ''}
          phone={phone}
          placeholder={t('Verification code')}
        />
      </Form.Item>
      <Form.Item style={{ marginBottom: 12 }}>
        <Button loading={loading} htmlType="submit" type="primary" block>
          {t('Sign in')}
        </Button>
      </Form.Item>
      {autoSignup ? (
        <Typography.Text type="secondary">{t('User will be registered automatically if not exists.')}</Typography.Text>
      ) : null}
    </Form>
  );
}
