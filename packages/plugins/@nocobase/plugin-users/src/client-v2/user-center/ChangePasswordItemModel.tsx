/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  DrawerFormLayout,
  getCurrentV2RedirectPath,
  PasswordInput,
  redirectToV2Signin,
  UserCenterActionItemModel,
} from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { useMemoizedFn } from 'ahooks';
import { Alert, Form, theme } from 'antd';
import React, { useState } from 'react';
import { useUsersTranslation } from '../locale';
import { PluginUsersClientV2 } from '../plugin';

/**
 * Drawer body for "Change password". Three antd `Form.Item`s, with `confirmPassword` cross-validating against `newPassword`. On success, the drawer closes and the user is redirected to `/signin` so they sign back in with the new credentials.
 *
 * Server-side validation (`auth:changePassword`) catches the heavier checks — mismatch / wrong old password / disabled by system setting — and the error message is surfaced inline via an antd `<Alert>`.
 */
function ChangePasswordDrawerContent() {
  const { t } = useUsersTranslation();
  const ctx = useFlowContext();
  const { token } = theme.useToken();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Async client-side validator that fans out to every PasswordValidator registered on PluginUsersClientV2 (typically contributed by plugin-password-policy). `username: undefined` matches v1's ChangePassword flow — the policy's `cantIncludeUsername` rule is intentionally skipped here, because the user-center form has no username field to feed it.
  const validateNewPassword = useMemoizedFn(async (_rule: unknown, value: unknown) => {
    if (typeof value !== 'string' || !value) return;
    const plugin = ctx.app?.pm?.get?.(PluginUsersClientV2) as PluginUsersClientV2 | undefined;
    const validators = plugin?.getPasswordValidators?.() || [];
    for (const validator of validators) {
      const message = await validator(value, { username: undefined });
      if (message) {
        throw new Error(message);
      }
    }
  });

  const handleSubmit = useMemoizedFn(async () => {
    const values = await form.validateFields();
    setErrorMessage('');
    setSubmitting(true);
    try {
      await ctx.api.resource('auth').changePassword({ values });
      form.resetFields();
      redirectToV2Signin(ctx.app, getCurrentV2RedirectPath(ctx.app, window.location), {
        replace: true,
      });
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
      title={t('Change password')}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
    >
      <Form form={form} layout="vertical">
        {errorMessage ? (
          <Alert type="error" showIcon message={errorMessage} style={{ marginBottom: token.marginMD }} />
        ) : null}
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
          rules={[{ required: true, message: t('Please enter the new password') }, { validator: validateNewPassword }]}
        >
          <PasswordInput autoComplete="new-password" checkStrength />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label={t('Confirm password')}
          dependencies={['newPassword']}
          rules={[
            { required: true, message: t('Please confirm the new password') },
            // antd's validator with closure access to other field values — mirrors v1's `x-reactions` based cross-field comparison.
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
 * "Change password" entry in the User Center dropdown. Section `profile` with sort 100 puts it between `CurrentUserSummaryItemModel` (sort 0) and `SignOutItemModel` (sort 1000) — same neighborhood as v1.
 *
 * `prepare()` reads `systemSettings.enableChangePassword`; when the admin has explicitly disabled it, `ready = false` removes the entry from the dropdown. Undefined / true both leave the entry visible (matches v1: only an explicit `=== false` hides it).
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
    this.context.viewer.open({
      type: 'drawer',
      width: '50%',
      closable: true,
      content: () => <ChangePasswordDrawerContent />,
    });
  }
}

export default ChangePasswordItemModel;
