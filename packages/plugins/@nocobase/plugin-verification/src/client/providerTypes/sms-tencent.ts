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
    secretId: {
      title: `{{t("Secret Id", { ns: "${NAMESPACE}" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'TextAreaWithGlobalScope',
    },
    secretKey: {
      title: `{{t("Secret Key", { ns: "${NAMESPACE}" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'TextAreaWithGlobalScope',
      'x-component-props': { password: true },
    },
    region: {
      title: `{{t("Region", { ns: "${NAMESPACE}" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'TextAreaWithGlobalScope',
    },
    endpoint: {
      title: `{{t("Endpoint", { ns: "${NAMESPACE}" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'TextAreaWithGlobalScope',
      default: 'sms.tencentcloudapi.com',
    },
    SignName: {
      title: `{{t("Sign name", { ns: "${NAMESPACE}" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'TextAreaWithGlobalScope',
    },
    SmsSdkAppId: {
      title: `{{t("Sms sdk app id", { ns: "${NAMESPACE}" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'TextAreaWithGlobalScope',
    },
    TemplateId: {
      title: `{{t("Template Id", { ns: "${NAMESPACE}" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'TextAreaWithGlobalScope',
    },
  },
} as ISchema;
