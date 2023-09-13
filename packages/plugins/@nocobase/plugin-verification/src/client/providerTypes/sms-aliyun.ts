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
