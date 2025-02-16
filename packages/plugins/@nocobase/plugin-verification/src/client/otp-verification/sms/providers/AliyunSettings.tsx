/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ISchema } from '@formily/react';
import { NAMESPACE } from '../../../locale';
import { SchemaComponent } from '@nocobase/client';

const schema = {
  type: 'object',
  properties: {
    accessKeyId: {
      title: `{{t("Access Key ID", { ns: "${NAMESPACE}" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'TextAreaWithGlobalScope',
      required: true,
    },
    accessKeySecret: {
      title: `{{t("Access Key Secret", { ns: "${NAMESPACE}" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'TextAreaWithGlobalScope',
      'x-component-props': { password: true },
      required: true,
    },
    endpoint: {
      title: `{{t("Endpoint", { ns: "${NAMESPACE}" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'TextAreaWithGlobalScope',
      required: true,
    },
    sign: {
      title: `{{t("Sign", { ns: "${NAMESPACE}" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'TextAreaWithGlobalScope',
      required: true,
    },
    template: {
      title: `{{t("Template code", { ns: "${NAMESPACE}" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'TextAreaWithGlobalScope',
      required: true,
    },
  },
} as ISchema;

export const AliyunSettings: React.FC = () => {
  return <SchemaComponent schema={schema} />;
};
