import { NAMESPACE } from '../../locale';
import common from './common';

export default {
  title: `{{t("Tencent COS", { ns: "${NAMESPACE}" })}}`,
  name: 'tx-cos',
  properties: {
    title: common.title,
    name: common.name,
    baseUrl: common.baseUrl,
    options: {
      type: 'object',
      'x-component': 'div',
      properties: {
        Region: {
          title: `{{t("Region", { ns: "${NAMESPACE}" })}}`,
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          required: true,
        },
        SecretId: {
          title: `{{t("SecretId", { ns: "${NAMESPACE}" })}}`,
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          required: true,
        },
        SecretKey: {
          title: `{{t("SecretKey", { ns: "${NAMESPACE}" })}}`,
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Password',
          required: true,
        },
        Bucket: {
          title: `{{t("Bucket", { ns: "${NAMESPACE}" })}}`,
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          required: true,
        },
      },
    },
    path: common.path,
    rules: common.rules,
    default: common.default,
    paranoid: common.paranoid,
  },
};
