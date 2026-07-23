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
import type { VerificationFormProps } from '../verification-manager';

/**
 * Email-OTP verify form: email address (read-only when bound) + verification
 * code field paired with a "send code" button. Hosted inside a parent
 * `<Form>` — antd Form.Item paths land on `uuid` (email) and `code`,
 * matching the v1 schema so server-side handlers are unchanged.
 */
export function VerificationForm(props: VerificationFormProps) {
  const { verifier, actionType, boundInfo, isLogged } = props;
  const { t } = useAuthEmailTranslation();
  const form = Form.useFormInstance();
  const email = Form.useWatch('uuid', form);
  const isEmailBound = !!boundInfo?.publicInfo;

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
        initialValue={boundInfo?.publicInfo}
      >
        <Input disabled={isEmailBound} />
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

export default VerificationForm;
