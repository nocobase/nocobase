/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Alert, Button, Form, Input, Result, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@nocobase/client-v2';
import { useAuthenticator } from '../authenticator';
import { useAuthTranslation } from '../locale';
import { useDocumentTitle } from '../hooks';

export default function ResetPasswordPage() {
  const app = useApp();
  const { t } = useAuthTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('resetToken');
  const name = searchParams.get('name');
  const authenticator = useAuthenticator(name);
  const [form] = Form.useForm();
  const [expired, setExpired] = useState(false);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useDocumentTitle(t('Reset password'));

  useEffect(() => {
    let active = true;

    if (!resetToken) {
      setExpired(true);
      setChecking(false);
      return;
    }

    app.apiClient.auth
      .checkResetToken({ resetToken })
      .then(() => {
        if (active) {
          setExpired(false);
          setChecking(false);
        }
      })
      .catch(() => {
        if (active) {
          setExpired(true);
          setChecking(false);
        }
      });

    return () => {
      active = false;
    };
  }, [app, resetToken]);

  if (!authenticator?.options?.enableResetPassword) {
    return <Navigate to="/signin" replace />;
  }

  if (!checking && (!resetToken || expired)) {
    return (
      <Result
        status="403"
        title={t('Reset link has expired')}
        extra={
          <Button type="primary" onClick={() => navigate('/signin')}>
            {t('Go to login')}
          </Button>
        }
      />
    );
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={async (values) => {
        setErrorMessage('');
        setSubmitting(true);
        try {
          await app.apiClient.auth.resetPassword({ ...values, resetToken });
          message.success(t('Password reset successful'));
          window.setTimeout(() => {
            navigate('/signin', { replace: true });
          }, 1000);
        } catch (error) {
          setErrorMessage(error?.response?.data?.errors?.[0]?.message || error?.message || String(error));
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {errorMessage ? <Alert style={{ marginBottom: 16 }} type="error" showIcon message={errorMessage} /> : null}
      <Form.Item
        label={t('New password')}
        name="password"
        rules={[{ required: true, message: t('Please enter new password') }]}
      >
        <Input.Password autoComplete="new-password" />
      </Form.Item>
      <Form.Item
        label={t('Confirm password')}
        name="confirmPassword"
        dependencies={['password']}
        rules={[
          { required: true, message: t('Please enter the same password again') },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error(t('The passwords entered twice are inconsistent')));
            },
          }),
        ]}
      >
        <Input.Password autoComplete="new-password" />
      </Form.Item>
      <Form.Item style={{ marginBottom: 12 }}>
        <Button loading={submitting || checking} htmlType="submit" type="primary" block>
          {t('Confirm')}
        </Button>
      </Form.Item>
      <Link to="/signin">{t('Go to login')}</Link>
    </Form>
  );
}
