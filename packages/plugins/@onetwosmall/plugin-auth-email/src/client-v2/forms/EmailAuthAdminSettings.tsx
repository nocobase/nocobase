/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Form, Checkbox } from 'antd';
import React from 'react';
import { VerifierSelect } from '@nocobase/plugin-verification/client-v2';
import { useAuthEmailTranslation } from '../locale';

/**
 * Admin settings form for the Email auth type.
 * Allows administrator to select a verifier and enable auto-signup.
 *
 * This is rendered inside the Authenticators page drawer when editing
 * an authenticator of type "Email".
 */
export function EmailAuthAdminSettings() {
  const { t } = useAuthEmailTranslation();

  return (
    <>
      <Form.Item
        name={['options', 'verifier']}
        label={t('Verifier')}
        rules={[{ required: true, message: t('Please select a verifier') }]}
      >
        <VerifierSelect scene="auth-email" />
      </Form.Item>
      <Form.Item
        name={['options', 'autoSignup']}
        label={t('Sign up automatically when the user does not exist')}
        valuePropName="checked"
      >
        <Checkbox />
      </Form.Item>
    </>
  );
}

export default EmailAuthAdminSettings;
