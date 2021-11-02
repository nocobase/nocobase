import { defaultProps, dataSource } from './properties';
import { select } from './select';
import { FieldOptions } from '.';

export const radioGroup: FieldOptions = {
  name: 'radioGroup',
  type: 'object',
  group: 'choices',
  order: 4,
  title: '{{t("Radio group")}}',
  default: {
    dataType: 'string',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Radio.Group',
      'x-decorator': 'FormItem',
      'x-designable-bar': 'Radio.DesignableBar',
    },
  },
  properties: {
    ...defaultProps,
    'uiSchema.enum': dataSource,
  },
  operations: select.operations,
};
