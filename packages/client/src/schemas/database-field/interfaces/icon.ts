import { defaultProps } from './properties';
import { FieldOptions } from '.';

export const icon: FieldOptions = {
  name: 'icon',
  type: 'object',
  group: 'basic',
  order: 8,
  title: '图标',
  default: {
    dataType: 'string',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'IconPicker',
      'x-decorator': 'FormItem',
      'x-designable-bar': 'IconPicker.DesignableBar',
    },
  },
  properties: {
    ...defaultProps,
  },
};
