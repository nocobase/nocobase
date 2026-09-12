/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Alert, Button, Form, Input, message } from 'antd';
import React, { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@nocobase/client-v2';
import { useAuthenticator } from '../authenticator';
import { useAuthTranslation } from '../locale';
import { useDocumentTitle } from '../hooks';

export default function ForgotPasswordPage() {
  const app = useApp();
  const { t } = useAuthTranslation();
  const [searchParams] = useSearchParams();
  const name = searchParams.get('name');
  const authenticator = useAuthenticator(name);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useDocumentTitle(t('Reset password'));

  if (!authenticator?.options?.enableResetPassword) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={async (values) => {
        setErrorMessage('');
        setSubmitting(true);
        try {
          await app.apiClient.auth.lostPassword(values);
          message.success(t('Reset email sent successfully'));
          form.resetFields();
        } catch (error) {
          setErrorMessage(error?.response?.data?.errors?.[0]?.message || error?.message || String(error));
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {errorMessage ? <Alert style={{ marginBottom: 16 }} type="error" showIcon message={errorMessage} /> : null}
      <Form.Item
        label={t('Reset password')}
        name="email"
        rules={[
          { required: true, message: t('Please fill in your email address') },
          { type: 'email', message: t('Please enter a valid email') },
        ]}
      >
        <Input placeholder={t('Please enter your email')} />
      </Form.Item>
      <Form.Item style={{ marginBottom: 12 }}>
        <Button loading={submitting} htmlType="submit" type="primary" block>
          {t('Send reset email')}
        </Button>
      </Form.Item>
      <Link to="/signin">{t('Back to login')}</Link>
    </Form>
  );
}
