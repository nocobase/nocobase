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
    { label: "{{ t('Is') }}", value: '$dateOn', selected: true },
    { label: "{{ t('Is not') }}", value: '$dateNotOn' },
    { label: "{{ t('Is before') }}", value: '$dateBefore' },
    { label: "{{ t('Is after') }}", value: '$dateAfter' },
    { label: "{{ t('Is not before') }}", value: '$dateNotBefore' },
    { label: "{{ t('Is not after') }}", value: '$dateNotAfter' },
    { label: "{{ t('Is empty') }}", value: '$null', noValue: true },
    { label: "{{ t('Is not empty') }}", value: '$notNull', noValue: true },
  ],
};
