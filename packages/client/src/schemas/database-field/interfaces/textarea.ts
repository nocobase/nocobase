import { defaultProps } from './properties';
import { FieldOptions } from '.';

export const textarea: FieldOptions = {
  name: 'textarea',
  type: 'object',
  group: 'basic',
  order: 2,
  title: '{{t("Long text")}}',
  default: {
    dataType: 'text',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
      'x-designable-bar': 'Input.DesignableBar',
    },
  },
  properties: {
    ...defaultProps,
  },
};
