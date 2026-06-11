/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DrawerFormLayout, UserCenterActionItemModel } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { useMemoizedFn } from 'ahooks';
import { Alert, Form, Input, theme } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useT } from '../locale';

interface EditProfileValues {
  nickname?: string;
  username?: string;
  email?: string;
  phone?: string;
}

function validateUsername(value: unknown) {
  return typeof value === 'string' && /^[^@<>"'/]{1,50}$/.test(value);
}

function EditProfileDrawerContent() {
  const ctx = useFlowContext();
  const t = useT();
  const { token } = theme.useToken();
  const [form] = Form.useForm<EditProfileValues>();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const initialValues = useMemo<EditProfileValues>(
    () => ({
      nickname: ctx.user?.nickname,
      username: ctx.user?.username,
      email: ctx.user?.email,
      phone: ctx.user?.phone,
    }),
    [ctx.user?.email, ctx.user?.nickname, ctx.user?.phone, ctx.user?.username],
  );

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  const handleSubmit = useMemoizedFn(async () => {
    const values = await form.validateFields();
    setErrorMessage('');
    setSubmitting(true);
    try {
      await ctx.api.resource('users').updateProfile({ values });
      if (ctx.user && typeof ctx.user === 'object') {
        Object.assign(ctx.user, values);
      }
      form.resetFields();
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { errors?: { message?: string }[] } }; message?: string };
      const message = apiError?.response?.data?.errors?.[0]?.message || apiError?.message || String(error);
      setErrorMessage(message);
      throw error;
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <DrawerFormLayout
      title={t('Edit profile')}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
    >
      <Form form={form} layout="vertical">
        {errorMessage ? (
          <Alert type="error" showIcon message={errorMessage} style={{ marginBottom: token.marginMD }} />
        ) : null}
        <Form.Item name="nickname" label={t('Nickname')}>
          <Input autoComplete="name" />
        </Form.Item>
        <Form.Item
          name="username"
          label={t('Username')}
          rules={[
            { required: true, message: t('Username is required') },
            {
              validator: async (_, value) => {
                if (!value || validateUsername(value)) {
                  return;
                }
                throw new Error(t('Must be 1-50 characters in length (excluding @.<>"\'/)'));
              },
            },
          ]}
        >
          <Input autoComplete="username" />
        </Form.Item>
        <Form.Item
          name="email"
          label={t('Email')}
          rules={[{ type: 'email', message: t('Please enter a valid email address') }]}
        >
          <Input autoComplete="email" />
        </Form.Item>
        <Form.Item name="phone" label={t('Phone')}>
          <Input autoComplete="tel" />
        </Form.Item>
      </Form>
    </DrawerFormLayout>
  );
}

export class EditProfileItemModel extends UserCenterActionItemModel {
  static itemId = 'edit-profile';

  section = 'profile' as const;
  sort = 50;
  label = 'Edit profile';

  async prepare() {
    const systemSettings = await this.context.systemSettings.load();
    const enableEditProfile = systemSettings?.data?.enableEditProfile;
    this.ready = enableEditProfile !== false;
  }

  async onClick() {
    this.context.viewer.open({
      type: 'drawer',
      width: '50%',
      closable: true,
      content: () => <EditProfileDrawerContent />,
    });
  }
}

export default EditProfileItemModel;
