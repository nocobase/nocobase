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
import { VerificationCode } from '../../components/VerificationCode';
import { useVerificationTranslation } from '../../locale';
import type { BindFormProps } from '../../verification-manager';

/**
 * SMS-OTP bind form. Same shape as `VerificationForm` minus the bound
 * publicInfo path — when binding, the user is always typing in a new
 * phone number. Hosted inside the parent `<Form>` so `uuid` / `code`
 * land on the parent's `form.values`.
 */
export function BindForm(props: BindFormProps) {
  const { verifier, actionType, isLogged } = props;
  const { t } = useVerificationTranslation();
  const form = Form.useFormInstance();
  const phone = Form.useWatch('uuid', form);

  return (
    <>
      <Form.Item name="uuid" label={t('Phone')} rules={[{ required: true, message: t('Please enter a phone number') }]}>
        <Input />
      </Form.Item>
      <Form.Item
        name="code"
        label={t('Verification code')}
        rules={[{ required: true, message: t('Please enter the verification code') }]}
      >
        <VerificationCode actionType={actionType} verifier={verifier} phone={phone} isLogged={isLogged} />
      </Form.Item>
    </>
  );
}

export default BindForm;
