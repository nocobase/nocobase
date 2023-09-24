import { ISchema } from '@formily/react';

import { NAMESPACE } from '../locale';

export default {
  type: 'object',
  properties: {
    secretId: {
      title: `{{t("Secret Id", { ns: "${NAMESPACE}" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    secretKey: {
      title: `{{t("Secret Key", { ns: "${NAMESPACE}" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Password',
    },
    region: {
      title: `{{t("Region", { ns: "${NAMESPACE}" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    endpoint: {
      title: `{{t("Endpoint", { ns: "${NAMESPACE}" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      default: 'sms.tencentcloudapi.com',
    },
    SignName: {
      title: `{{t("Sign name", { ns: "${NAMESPACE}" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    SmsSdkAppId: {
      title: `{{t("Sms sdk app id", { ns: "${NAMESPACE}" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    TemplateId: {
      title: `{{t("Template Id", { ns: "${NAMESPACE}" })}}`,
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
  },
} as ISchema;
