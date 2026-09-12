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
import type { VerificationFormProps } from '../../verification-manager';

/**
 * SMS-OTP verify form: phone number (read-only when bound) + verification
 * code field paired with a "send code" button. Hosted inside a parent
 * `<Form>` — antd Form.Item paths land on `uuid` (phone) and `code`,
 * matching the v1 schema so server-side handlers are unchanged.
 */
export function VerificationForm(props: VerificationFormProps) {
  const { verifier, actionType, boundInfo, isLogged } = props;
  const { t } = useVerificationTranslation();
  const form = Form.useFormInstance();
  const phone = Form.useWatch('uuid', form);
  const isPhoneBound = !!boundInfo?.publicInfo;

  return (
    <>
      <Form.Item
        name="uuid"
        label={t('Phone')}
        rules={[{ required: true, message: t('Please enter a phone number') }]}
        initialValue={boundInfo?.publicInfo}
      >
        <Input disabled={isPhoneBound} />
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

export default VerificationForm;
