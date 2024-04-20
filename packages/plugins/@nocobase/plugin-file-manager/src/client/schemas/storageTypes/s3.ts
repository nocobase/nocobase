import { NAMESPACE } from '../../locale';
import common from './common';

export default {
  title: `{{t("Amazon S3", { ns: "${NAMESPACE}" })}}`,
  name: 's3',
  properties: {
    title: common.title,
    name: common.name,
    baseUrl: common.baseUrl,
    options: {
      type: 'object',
      'x-component': 'div',
      properties: {
        region: {
          title: `{{t("Region", { ns: "${NAMESPACE}" })}}`,
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          required: true,
        },
        accessKeyId: {
          title: `{{t("AccessKey ID", { ns: "${NAMESPACE}" })}}`,
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          required: true,
        },
        secretAccessKey: {
          title: `{{t("AccessKey Secret", { ns: "${NAMESPACE}" })}}`,
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Password',
          required: true,
        },
        bucket: {
          title: `{{t("Bucket", { ns: "${NAMESPACE}" })}}`,
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          required: true,
        },
        endpoint: {
          title: `{{t("Endpoint", { ns: "${NAMESPACE}" })}}`,
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
    },
    path: common.path,
    rules: common.rules,
    default: common.default,
    paranoid: common.paranoid,
  },
};
