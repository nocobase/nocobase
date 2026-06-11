/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { VerifierSelect } from '@nocobase/plugin-verification/client-v2';
import { Checkbox, Form } from 'antd';
import React from 'react';
import { useAuthSMSTranslation } from '../locale';

/**
 * Admin-side configuration for an SMS authenticator. Rendered inside the
 * Authenticators page drawer below the common fields (`name`, `authType`,
 * `title`, `description`, `enabled`). Persists to
 * `options.public.verifier` / `options.public.autoSignup`, matching the
 * server-side reads in `sms-auth.ts` (`this.options.public?.verifier` /
 * `this.authenticator.options?.public?.autoSignup`).
 */
export default function SmsAdminSettings() {
  const { t } = useAuthSMSTranslation();

  return (
    <>
      <Form.Item
        name={['options', 'public', 'verifier']}
        label={t('Verifier')}
        rules={[{ required: true, message: t('Please select a verifier') }]}
      >
        <VerifierSelect scene="auth-sms" />
      </Form.Item>
      <Form.Item
        name={['options', 'public', 'autoSignup']}
        label={t('Sign up automatically when the user does not exist')}
        valuePropName="checked"
      >
        <Checkbox />
      </Form.Item>
    </>
  );
}
