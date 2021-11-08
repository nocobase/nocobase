import { defaultProps, dataSource } from './properties';
import { FieldOptions } from '.';

export const select: FieldOptions = {
  name: 'select',
  type: 'object',
  group: 'choices',
  order: 2,
  title: '{{t("Single select")}}',
  default: {
    dataType: 'string',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Select',
      'x-decorator': 'FormItem',
      'x-designable-bar': 'Select.DesignableBar',
      enum: [],
    },
  },
  properties: {
    ...defaultProps,
    'uiSchema.enum': dataSource,
  },
  operations: [
    {
      label: '{{t("is")}}',
      value: 'eq',
      selected: true,
      schema: { 'x-component': 'Select' },
    },
    {
      label: '{{t("is not")}}',
      value: 'ne',
      schema: { 'x-component': 'Select' },
    },
    {
      label: '{{t("contains")}}',
      value: 'in',
      schema: {
        'x-component': 'Select',
        'x-component-props': { mode: 'tags' },
      },
    },
    {
      label: '{{t("does not contain")}}',
      value: 'notIn',
      schema: {
        'x-component': 'Select',
        'x-component-props': { mode: 'tags' },
      },
    },
    { label: '{{t("is empty")}}', value: '$null', noValue: true },
    { label: '{{t("is not empty")}}', value: '$notNull', noValue: true },
  ],
};
