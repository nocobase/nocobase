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
import { VerificationCode } from '../VerificationCode';
import { BindFormProps } from '../../verification-manager';

const schema: ISchema = {
  type: 'void',
  name: 'sms-otp',
  properties: {
    uuid: {
      type: 'string',
      required: true,
      'x-component': 'Input',
      'x-decorator': 'FormItem',
      title: '{{t("Phone")}}',
      'x-component-props': {
        style: {},
      },
    },
    code: {
      type: 'string',
      required: true,
      title: '{{t("Verification code")}}',
      'x-component': 'VerificationCode',
      'x-component-props': {
        targetFieldName: 'phone',
        actionType: '{{ actionType }}',
        verifier: '{{ verifier }}',
      },
      'x-decorator': 'FormItem',
    },
  },
};

export const BindForm = (props: BindFormProps) => {
  const { verifier, actionType } = props;
  return <SchemaComponent scope={{ verifier, actionType }} schema={schema} components={{ VerificationCode }} />;
};
