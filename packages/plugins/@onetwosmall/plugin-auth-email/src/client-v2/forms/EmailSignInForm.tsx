/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useApp } from '@nocobase/client-v2';
import { Alert, Button, Form } from 'antd';
import React, { useMemo, useState } from 'react';
import { type Authenticator } from '@nocobase/plugin-auth/client-v2';
import { useAuthEmailTranslation } from '../locale';
import { EMAIL_OTP_VERIFICATION_TYPE } from '../constants';

/**
 * Email OTP sign-in form for v2 client.
 *
 * Similar to v1's `SigninPage` but uses antd `Form` directly instead of
 * `@formily/react` `SchemaComponent`. The VerificationForm component is
 * resolved from the verification plugin's v2 verification manager at runtime.
 */
export default function EmailSignInForm({ authenticator }: { authenticator: Authenticator }) {
  const { t } = useAuthEmailTranslation();
  const [form] = Form.useForm();
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const app = useApp();

  const autoSignup = !!authenticator.options?.autoSignup;
  const verifier = authenticator.options?.verifier;

  // Resolve the VerificationForm from verification plugin's v2 manager at runtime
  const EmailVerificationForm = useMemo(() => {
    const verificationPlugin = app.pm.get('verification') as any;
    const emailVerification = verificationPlugin?.verificationManager?.getVerification(EMAIL_OTP_VERIFICATION_TYPE);
    const loader = emailVerification?.components?.VerificationFormLoader;
    if (!loader) return null;
    const LazyComponent = React.lazy(loader);
    return LazyComponent;
  }, [app]);

  const handleSignIn = async () => {
    setErrorMessage('');
    setLoading(true);
    try {
      const values = await form.validateFields();
      await app.apiClient.auth.signIn({ ...values, verifier, action: 'auth:signIn:email' }, authenticator.name);
      // Refresh current user state via /auth:check (v2 equivalent of refreshAsync)
      await app.apiClient
        .request({
          url: '/auth:check',
          skipAuth: true,
          skipNotify: true,
        })
        .catch(() => undefined);
      // Redirect
      const redirect = new URLSearchParams(window.location.search).get('redirect') || '/admin';
      app.router.navigate(redirect, { replace: true });
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.errors?.[0]?.message || error?.message || String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSignIn}>
      {errorMessage ? <Alert style={{ marginBottom: 16 }} type="error" showIcon message={errorMessage} /> : null}

      {EmailVerificationForm ? (
        <React.Suspense fallback={null}>
          <EmailVerificationForm verifier={verifier} actionType="auth:signIn:email" boundInfo={undefined} />
        </React.Suspense>
      ) : null}

      {autoSignup ? (
        <div style={{ color: '#ccc', marginBottom: 16, fontSize: 12 }}>
          {t('User will be registered automatically if not exists.')}
        </div>
      ) : null}

      <Form.Item style={{ marginBottom: 12 }}>
        <Button loading={loading} htmlType="submit" type="primary" block>
          {t('Sign in')}
        </Button>
      </Form.Item>
    </Form>
  );
}
