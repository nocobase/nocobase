import { defaultProps } from './properties';
import { FieldOptions } from '.';

export const checkbox: FieldOptions = {
  name: 'checkbox',
  type: 'object',
  group: 'choices',
  order: 1,
  title: '勾选',
  default: {
    dataType: 'boolean',
    // name,
    uiSchema: {
      type: 'boolean',
      // title,
      'x-component': 'Checkbox',
      'x-decorator': 'FormItem',
      'x-designable-bar': 'Checkbox.DesignableBar',
    },
  },
  properties: {
    ...defaultProps,
  },
  operations: [
    { label: '是', value: '$isTruly', selected: true, noValue: true },
    { label: '否', value: '$isFalsy', noValue: true },
  ],
};
