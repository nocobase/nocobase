import { ISchema } from '@formily/react';
import { dateTimeProps, defaultProps } from './properties';
import { FieldOptions } from '.';

export const datetime: FieldOptions = {
  name: 'datetime',
  type: 'object',
  group: 'datetime',
  order: 1,
  title: '日期',
  sortable: true,
  default: {
    dataType: 'date',
    // name,
    uiSchema: {
      type: 'datetime',
      // title,
      'x-component': 'DatePicker',
      'x-component-props': {
        showTime: false,
      },
      'x-decorator': 'FormItem',
      'x-designable-bar': 'DatePicker.DesignableBar',
    },
  },
  properties: {
    ...defaultProps,
    ...dateTimeProps,
  },
  operations: [
    { label: '等于', value: '$dateOn', selected: true },
    { label: '不等于', value: '$dateNotOn' },
    { label: '早于', value: '$dateBefore' },
    { label: '晚于', value: '$dateAfter' },
    { label: '不早于', value: '$dateNotBefore' },
    { label: '不晚于', value: '$dateNotAfter' },
    { label: '非空', value: '$notNull', noValue: true },
    { label: '为空', value: '$null', noValue: true },
  ],
};
