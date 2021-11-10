import { defaultProps } from './properties';
import { FieldOptions } from '.';

export const string: FieldOptions = {
  name: 'string',
  type: 'object',
  group: 'basic',
  order: 1,
  title: '{{t("Single line text")}}',
  sortable: true,
  default: {
    interface: 'string',
    dataType: 'string',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Input',
      'x-decorator': 'FormItem',
      'x-designable-bar': 'Input.DesignableBar',
    },
  },
  properties: {
    ...defaultProps,
  },
  operations: [
    { label: '{{t("contains")}}', value: '$includes', selected: true },
    { label: '{{t("does not contain")}}', value: '$notIncludes' },
    { label: '{{t("is")}}', value: 'eq' },
    { label: '{{t("is not")}}', value: 'ne' },
    { label: '{{t("is empty")}}', value: '$null', noValue: true },
    { label: '{{t("is not empty")}}', value: '$notNull', noValue: true },
  ],
};
