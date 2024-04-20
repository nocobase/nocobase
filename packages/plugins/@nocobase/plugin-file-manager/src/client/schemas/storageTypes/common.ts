import { DEFAULT_MAX_FILE_SIZE } from '../../../constants';
import { NAMESPACE } from '../../locale';

export default {
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
  path: {
    'x-component': 'CollectionField',
    'x-decorator': 'FormItem',
  },
  rules: {
    type: 'object',
    'x-component': 'fieldset',
    properties: {
      size: {
        type: 'number',
        title: `{{t("File size limit (in bytes)", { ns: "${NAMESPACE}" })}}`,
        description: `{{t("Set to 0 as unlimited, default up to 1GB.", { ns: "${NAMESPACE}" })}}`,
        'x-component': 'InputNumber',
        'x-decorator': 'FormItem',
        'x-component-props': {
          min: 0,
          step: 1,
          placeholder: DEFAULT_MAX_FILE_SIZE,
        },
      },
      mimetype: {
        type: 'string',
        title: `{{t("File type (in MIME type format)", { ns: "${NAMESPACE}" })}}`,
        description: `{{t('Multi-types seperated with comma, for example: "image/*", "image/png", "image/*, application/pdf" etc.', { ns: "${NAMESPACE}" })}}`,
        'x-component': 'Input',
        'x-decorator': 'FormItem',
        'x-component-props': {
          placeholder: '*',
        },
      },
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
};
