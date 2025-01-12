/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, useForm } from '@formily/react';
import { SchemaComponent } from '@nocobase/client';
import React from 'react';
import { VerificationCode } from '../VerificationCode';
import { SMS_OTP_VERIFICATION_TYPE } from '../../../constants';
import { VerificationFormProps } from '../../verification-manager';

const schema: ISchema = {
  type: 'object',
  name: 'phoneForm',
  'x-component': 'Form',
  properties: {
    phone: {
      type: 'string',
      required: true,
      'x-component': 'Input',
      'x-decorator': 'FormItem',
      title: '{{t("Phone")}}',
      'x-component-props': {
        style: {},
      },
      'x-read-pretty': '{{ phone ? true : false }}',
      default: '{{ phone }}',
    },
    code: {
      type: 'string',
      required: true,
      title: '{{t("Verification code")}}',
      'x-component': 'VerificationCode',
      'x-use-component-props': 'useVerificationCodeProps',
      'x-component-props': {
        targetFieldName: 'phone',
      },
      'x-decorator': 'FormItem',
    },
    actions: {
      type: 'void',
      'x-component': 'Action',
      'x-use-component-props': 'useVerifyActionProps',
      'x-component-props': {
        htmlType: 'submit',
        block: true,
        type: 'primary',
        style: { width: '100%' },
      },
    },
  },
};

export const VerificationForm = (props: VerificationFormProps) => {
  const { verificator, actionType, publicInfo, getUserVerifyInfo, useVerifyActionProps } = props;
  return (
    <SchemaComponent
      schema={schema}
      scope={{
        phone: publicInfo?.phone,
        useVerificationCodeProps: () => {
          return {
            actionType,
            verificator,
            getUserVerifyInfo,
          };
        },
        useVerifyActionProps,
      }}
      components={{ VerificationCode }}
    />
  );
};
