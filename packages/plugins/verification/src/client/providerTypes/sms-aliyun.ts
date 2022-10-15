import { ISchema } from '@formily/react';

export default {
  type: 'object',
  properties: {
    accessKeyId: {
      title: '{{t("Access Key ID")}}',
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    accessKeySecret: {
      title: '{{t("Access Key Secret")}}',
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Password',
    },
    endpoint: {
      title: '{{t("Endpoint")}}',
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    sign: {
      title: '{{t("Sign")}}',
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    template: {
      title: '{{t("Template name")}}',
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    }
  }
} as ISchema;
