/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Alert, Button, Checkbox, Form, Input, Select, message } from 'antd';
import React, { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Schema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { useApp } from '@nocobase/client-v2';
import { useAuthTranslation } from '../locale';
import { useAuthenticator } from '../authenticator';

type SignUpFormProps = {
  authenticatorName: string;
};

function renderDynamicField(field: any, t: (key: string) => string, fieldT: (key: string) => string) {
  const uiSchema = field?.uiSchema || {};
  const componentName = uiSchema['x-component'];
  const titleText = uiSchema.title ? fieldT(Schema.compile(uiSchema.title, { t })) : field.field;
  const rules = [];

  if (field.required) {
    rules.push({
      required: true,
      message: t(`Please enter ${field.field}`),
    });
  }

  if (field.field === 'email') {
    rules.push({
      type: 'email' as const,
      message: t('Please enter a valid email address'),
    });
  }

  let inputNode: React.ReactNode = <Input />;
  if (uiSchema.enum?.length) {
    inputNode = (
      <Select
        options={uiSchema.enum.map((item: any) => ({
          label: item.label || item.value,
          value: item.value,
        }))}
      />
    );
  } else if (componentName === 'Checkbox') {
    inputNode = <Checkbox />;
  } else if (componentName === 'Input.TextArea' || componentName === 'TextArea') {
    inputNode = <Input.TextArea rows={4} />;
  }

  return (
    <Form.Item
      key={field.field}
      name={field.field}
      label={titleText}
      valuePropName={componentName === 'Checkbox' ? 'checked' : 'value'}
      rules={rules}
    >
      {inputNode}
    </Form.Item>
  );
}

export function BasicSignUpForm({ authenticatorName }: SignUpFormProps) {
  const app = useApp();
  const navigate = useNavigate();
  const { t } = useAuthTranslation();
  const { t: fieldT } = useTranslation('lm-collections');
  const authenticator = useAuthenticator(authenticatorName);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fields = useMemo(() => {
    return (authenticator?.options?.signupForm || []).filter((item: any) => item?.show);
  }, [authenticator]);

  if (!authenticator?.options?.allowSignUp) {
    return <Navigate to="/not-found" replace />;
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={async (values) => {
        setErrorMessage('');
        setSubmitting(true);
        try {
          await app.apiClient.auth.signUp(values, authenticatorName);
          message.success(t('Sign up successfully, and automatically jump to the sign in page'));
          window.setTimeout(() => {
            navigate('/signin', { replace: true });
          }, 2000);
        } catch (error) {
          setErrorMessage(error?.response?.data?.errors?.[0]?.message || error?.message || String(error));
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {errorMessage ? <Alert style={{ marginBottom: 16 }} type="error" showIcon message={errorMessage} /> : null}
      {fields.map((field: any) => renderDynamicField(field, t, fieldT))}
      <Form.Item
        label={t('Password')}
        name="password"
        rules={[{ required: true, message: t('Please enter a password') }]}
      >
        <Input.Password autoComplete="new-password" />
      </Form.Item>
      <Form.Item
        label={t('Confirm password')}
        name="confirm_password"
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
        <Button loading={submitting} htmlType="submit" type="primary" block>
          {t('Sign up')}
        </Button>
      </Form.Item>
      <Link to="/signin">{t('Log in with an existing account')}</Link>
    </Form>
  );
}
