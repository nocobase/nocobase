/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';

import { NAMESPACE } from '../locale';

export default {
  type: 'object',
  properties: {
    accessKeyId: {
      title: `{{t("Access Key ID", { ns: "${NAMESPACE}" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    accessKeySecret: {
      title: `{{t("Access Key Secret", { ns: "${NAMESPACE}" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Password',
    },
    endpoint: {
      title: `{{t("Endpoint", { ns: "${NAMESPACE}" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    sign: {
      title: `{{t("Sign", { ns: "${NAMESPACE}" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    template: {
      title: `{{t("Template code", { ns: "${NAMESPACE}" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
  },
} as ISchema;
