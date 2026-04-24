/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Alert, Button, Form, Input } from 'antd';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { type Authenticator } from '../authenticator';
import { useAuthTranslation } from '../locale';
import { useSignIn } from '../hooks';

export function BasicSignInForm({ authenticator }: { authenticator: Authenticator }) {
  const { t } = useAuthTranslation();
  const [form] = Form.useForm();
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const signIn = useSignIn(authenticator.name);
  const allowSignUp = !!authenticator?.options?.allowSignUp;
  const showForgotPassword = !!authenticator?.options?.enableResetPassword;

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={async (values) => {
        setErrorMessage('');
        setLoading(true);
        try {
          await signIn.run(values);
        } catch (error) {
          setErrorMessage(error?.response?.data?.errors?.[0]?.message || error?.message || String(error));
        } finally {
          setLoading(false);
        }
      }}
    >
      {errorMessage ? <Alert style={{ marginBottom: 16 }} type="error" showIcon message={errorMessage} /> : null}
      <Form.Item
        name="account"
        rules={[
          { required: true, message: t('Please enter your username or email') },
          {
            validator(_, value) {
              if (!value) {
                return Promise.resolve();
              }
              if (String(value).includes('@')) {
                return /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/.test(String(value))
                  ? Promise.resolve()
                  : Promise.reject(new Error(t('Please enter a valid email')));
              }
              return /^[^@<>"'/]{1,50}$/.test(String(value))
                ? Promise.resolve()
                : Promise.reject(new Error(t('Please enter a valid username')));
            },
          },
        ]}
      >
        <Input autoComplete="username" placeholder={t('Username/Email')} />
      </Form.Item>
      <Form.Item name="password" rules={[{ required: true, message: t('Please enter a password') }]}>
        <Input.Password autoComplete="current-password" placeholder={t('Password')} />
      </Form.Item>
      <Form.Item style={{ marginBottom: 12 }}>
        <Button loading={loading} htmlType="submit" type="primary" block>
          {t('Sign in')}
        </Button>
      </Form.Item>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        {allowSignUp ? <Link to={`/signup?name=${authenticator.name}`}>{t('Create an account')}</Link> : null}
        {showForgotPassword ? (
          <Link to={`/forgot-password?name=${authenticator.name}`}>{t('Forgot password')}</Link>
        ) : null}
      </div>
    </Form>
  );
}
