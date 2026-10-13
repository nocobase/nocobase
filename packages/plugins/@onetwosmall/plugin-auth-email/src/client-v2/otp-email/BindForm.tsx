/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Form, Input } from 'antd';
import React from 'react';
import { VerificationCode } from '../components/VerificationCode';
import { useAuthEmailTranslation } from '../locale';
import type { BindFormProps } from '../verification-manager';

/**
 * Email-OTP bind form. Same shape as `VerificationForm` minus the bound
 * publicInfo path — when binding, the user is always typing in a new
 * email address. Hosted inside the parent `<Form>` so `uuid` / `code`
 * land on the parent's `form.values`.
 */
export function BindForm(props: BindFormProps) {
  const { verifier, actionType, isLogged } = props;
  const { t } = useAuthEmailTranslation();
  const form = Form.useFormInstance();
  const email = Form.useWatch('uuid', form);

  return (
    <>
      <Form.Item
        name="uuid"
        label={t('Email')}
        rules={[
          { required: true, message: t('Please fill in your email address') },
          {
            type: 'email',
            message: t('Not a valid email address, please re-enter'),
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="code"
        label={t('Verification code')}
        rules={[{ required: true, message: t('Please enter the verification code') }]}
      >
        <VerificationCode actionType={actionType} verifier={verifier} email={email} isLogged={isLogged} />
      </Form.Item>
    </>
  );
}

export default BindForm;
