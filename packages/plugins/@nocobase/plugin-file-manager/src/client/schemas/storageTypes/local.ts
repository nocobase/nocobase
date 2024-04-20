import { NAMESPACE } from '../../locale';
import common from './common';

export default {
  title: `{{t("Local storage", { ns: "${NAMESPACE}" })}}`,
  name: 'local',
  properties: {
    title: common.title,
    name: common.name,
    baseUrl: common.baseUrl,
    options: {
      type: 'object',
      'x-component': 'div',
      properties: {
        documentRoot: {
          title: `{{t("Destination", { ns: "${NAMESPACE}" })}}`,
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-display': 'hidden',
          default: 'storage/uploads',
        },
      },
    },
    path: {
      'x-component': 'CollectionField',
      'x-decorator': 'FormItem',
      'x-component-props': {
        addonBefore: 'storage/uploads/',
      },
    },
    rules: common.rules,
    default: common.default,
    paranoid: common.paranoid,
  },
};
