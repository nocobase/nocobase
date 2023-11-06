import { NAMESPACE } from '../../locale';

export default {
  title: `{{t("Local storage", { ns: "${NAMESPACE}" })}}`,
  name: 'local',
  properties: {
    title: {
      'x-component': 'CollectionField',
      'x-decorator': 'FormItem',
    },
    name: {
      'x-component': 'CollectionField',
      'x-decorator': 'FormItem',
      'x-disabled': '{{ !createOnly }}',
      required: true,
      default: '{{ useNewId("s_") }}',
      description:
        '{{t("Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.")}}',
    },
    baseUrl: {
      'x-component': 'CollectionField',
      'x-decorator': 'FormItem',
      'x-display': 'hidden',
      default: '/storage/uploads',
    },
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
    default: {
      'x-component': 'CollectionField',
      'x-decorator': 'FormItem',
      'x-content': `{{t("Default storage", { ns: "${NAMESPACE}" })}}`,
    },
    paranoid: {
      'x-component': 'CollectionField',
      'x-decorator': 'FormItem',
      'x-content': `{{t("Keep file in storage when destroy record", { ns: "${NAMESPACE}" })}}`,
    },
  },
};
