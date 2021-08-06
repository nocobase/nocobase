import { ISchema } from '@formily/react';
import { defaultProps, dataSource } from './properties';

export const multipleSelect: ISchema = {
  name: 'multipleSelect',
  type: 'object',
  group: 'choices',
  order: 3,
  title: '下拉选择（多选）',
  default: {
    dataType: 'json',
    // name,
    uiSchema: {
      type: 'array',
      // title,
      'x-component': 'Select',
      'x-component-props': {
        mode: 'multiple',
      },
      'x-decorator': 'FormItem',
      'x-designable-bar': 'Select.DesignableBar',
      enum: [],
    } as ISchema,
  },
  properties: {
    ...defaultProps,
    'uiSchema.enum': dataSource,
  },
  operations: [
    {
      label: '等于',
      value: '$match',
      selected: true,
      schema: { 'x-component': 'Select' },
    },
    {
      label: '不等于',
      value: '$notMatch',
      schema: { 'x-component': 'Select' },
    },
    { label: '包含', value: '$anyOf', schema: { 'x-component': 'Select' } },
    { label: '不包含', value: '$noneOf', schema: { 'x-component': 'Select' } },
    { label: '非空', value: '$notNull', noValue: true },
    { label: '为空', value: '$null', noValue: true },
  ],
};
