import { dataSource, defaultProps } from './properties';
import { IField } from './types';

export const multipleSelect: IField = {
  name: 'multipleSelect',
  type: 'object',
  group: 'choices',
  order: 3,
  title: '{{t("Multiple select")}}',
  default: {
    type: 'json',
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
    },
  },
  properties: {
    ...defaultProps,
    'uiSchema.enum': dataSource,
  },
  operations: [
    {
      label: '{{t("is")}}',
      value: '$match',
      selected: true,
      schema: { 'x-component': 'Select' },
    },
    {
      label: '{{t("is not")}}',
      value: '$notMatch',
      schema: { 'x-component': 'Select' },
    },
    {
      label: '{{t("contains")}}',
      value: '$anyOf',
      schema: { 'x-component': 'Select' },
    },
    {
      label: '{{t("does not contain")}}',
      value: '$noneOf',
      schema: { 'x-component': 'Select' },
    },
    { label: '{{t("is empty")}}', value: '$null', noValue: true },
    { label: '{{t("is not empty")}}', value: '$notNull', noValue: true },
  ],
};
