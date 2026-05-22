/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DrawerFormLayout, PasswordInput, UserCenterActionItemModel } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { useMemoizedFn } from 'ahooks';
import { Alert, Form } from 'antd';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsersTranslation } from '../locale';

/**
 * Drawer body for "Change password". Three antd `Form.Item`s, with
 * `confirmPassword` cross-validating against `newPassword`. On success,
 * the drawer closes and the user is redirected to `/signin` so they
 * sign back in with the new credentials.
 *
 * Server-side validation (`auth:changePassword`) catches the heavier
 * checks — mismatch / wrong old password / disabled by system setting —
 * and the error message is surfaced inline via an antd `<Alert>`.
 */
function ChangePasswordDrawerContent() {
  const { t } = useUsersTranslation();
  const ctx = useFlowContext();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = useMemoizedFn(async () => {
    const values = await form.validateFields();
    setErrorMessage('');
    setSubmitting(true);
    try {
      await ctx.api.resource('auth').changePassword({ values });
      form.resetFields();
      navigate('/signin');
    } catch (error: any) {
      const message = error?.response?.data?.errors?.[0]?.message || error?.message || String(error);
      setErrorMessage(message);
      throw error;
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <DrawerFormLayout
      title={t('Change password')}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
    >
      <Form form={form} layout="vertical">
        {errorMessage ? <Alert type="error" showIcon message={errorMessage} style={{ marginBottom: 16 }} /> : null}
        <Form.Item
          name="oldPassword"
          label={t('Old password')}
          rules={[{ required: true, message: t('Please enter the old password') }]}
        >
          <PasswordInput autoComplete="current-password" />
        </Form.Item>
        <Form.Item
          name="newPassword"
          label={t('New password')}
          rules={[{ required: true, message: t('Please enter the new password') }]}
        >
          <PasswordInput autoComplete="new-password" checkStrength />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label={t('Confirm password')}
          dependencies={['newPassword']}
          rules={[
            { required: true, message: t('Please confirm the new password') },
            // antd's validator with closure access to other field values —
            // mirrors v1's `x-reactions` based cross-field comparison.
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error(t('Password mismatch')));
              },
            }),
          ]}
        >
          <PasswordInput autoComplete="new-password" checkStrength />
        </Form.Item>
      </Form>
    </DrawerFormLayout>
  );
}

/**
 * "Change password" entry in the User Center dropdown. Section `profile`
 * with sort 100 puts it between `CurrentUserSummaryItemModel` (sort 0)
 * and `SignOutItemModel` (sort 1000) — same neighborhood as v1.
 *
 * `prepare()` reads `systemSettings.enableChangePassword`; when the
 * admin has explicitly disabled it, `ready = false` removes the entry
 * from the dropdown. Undefined / true both leave the entry visible
 * (matches v1: only an explicit `=== false` hides it).
 */
export class ChangePasswordItemModel extends UserCenterActionItemModel {
  static itemId = 'change-password';

  section = 'profile' as const;
  sort = 100;
  label = 'Change password';

  async prepare() {
    const systemSettings = await this.context.systemSettings.load();
    const enableChangePassword = systemSettings?.data?.enableChangePassword;
    this.ready = enableChangePassword !== false;
  }

  async onClick() {
    this.context.viewer.drawer({
      width: '50%',
      closable: true,
      content: () => <ChangePasswordDrawerContent />,
    });
  }
}

export default ChangePasswordItemModel;
