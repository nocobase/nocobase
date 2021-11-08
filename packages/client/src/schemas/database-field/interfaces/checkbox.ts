import { defaultProps } from './properties';
import { FieldOptions } from '.';

export const checkbox: FieldOptions = {
  name: 'checkbox',
  type: 'object',
  group: 'choices',
  order: 1,
  title: '{{t("Checkbox")}}',
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
    { label: '{{t("Yes")}}', value: '$isTruly', selected: true, noValue: true },
    { label: '{{t("No")}}', value: '$isFalsy', noValue: true },
  ],
};
