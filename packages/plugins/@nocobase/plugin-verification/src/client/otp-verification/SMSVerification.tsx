/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';
import { SchemaComponent } from '@nocobase/client';
import React from 'react';
import { VerificationCode } from './VerificationCode';
import { SMS_OTP_VERIFICATION_TYPE } from '../../constants';

const schema: ISchema = {
  type: 'object',
  name: 'phoneForm',
  'x-component': 'Form',
  properties: {
    phone: {
      type: 'string',
      required: true,
      'x-component': 'Input',
      'x-validator': 'phone',
      'x-decorator': 'FormItem',
      'x-component-props': { placeholder: '{{t("Phone")}}', style: {} },
    },
    code: {
      type: 'string',
      required: true,
      'x-component': 'VerificationCode',
      'x-use-component-props': 'useVerificationCodeProps',
      'x-component-props': {
        targetFieldName: 'phone',
        verificationType: SMS_OTP_VERIFICATION_TYPE,
      },
      'x-decorator': 'FormItem',
    },
    actions: {
      type: 'void',
      'x-component': 'Action',
      'x-use-component-props': 'useSubmitButtonProps',
      'x-component-props': {
        htmlType: 'submit',
        block: true,
        type: 'primary',
        style: { width: '100%' },
      },
    },
  },
};

export const SMSVerification = (props: { verificationCodeProps: any; submitButtonProps: any }) => {
  const { verificationCodeProps, submitButtonProps } = props;
  return (
    <SchemaComponent
      schema={schema}
      scope={{
        useVerificationCodeProps: () => verificationCodeProps,
        useSubmitButtonProps: () => submitButtonProps,
      }}
      components={{ VerificationCode }}
    />
  );
};
