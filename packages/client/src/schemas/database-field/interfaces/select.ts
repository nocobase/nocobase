import { defaultProps, dataSource } from './properties';
import { FieldOptions } from '.';

export const select: FieldOptions = {
  name: 'select',
  type: 'object',
  group: 'choices',
  order: 2,
  title: '下拉选择（单选）',
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
      label: '等于',
      value: 'eq',
      selected: true,
      schema: { 'x-component': 'Select' },
    },
    { label: '不等于', value: 'ne', schema: { 'x-component': 'Select' } },
    {
      label: '包含',
      value: 'in',
      schema: { 'x-component': 'Select', 'x-component-props': { mode: 'tags' } },
    },
    {
      label: '不包含',
      value: 'notIn',
      schema: {
        'x-component': 'Select', 'x-component-props': { mode: 'tags' },
      },
    },
    { label: '非空', value: '$notNull', noValue: true },
    { label: '为空', value: '$null', noValue: true },
  ],
};
