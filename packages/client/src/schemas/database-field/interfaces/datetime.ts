import { ISchema } from '@formily/react';
import { dateTimeProps, defaultProps } from './properties';
import { FieldOptions } from '.';

export const datetime: FieldOptions = {
  name: 'datetime',
  type: 'object',
  group: 'datetime',
  order: 1,
  title: '{{t("Datetime")}}',
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
    { label: "{{ t('is') }}", value: '$dateOn', selected: true },
    { label: "{{ t('is not') }}", value: '$dateNotOn' },
    { label: "{{ t('is before') }}", value: '$dateBefore' },
    { label: "{{ t('is after') }}", value: '$dateAfter' },
    { label: "{{ t('is not before') }}", value: '$dateNotBefore' },
    { label: "{{ t('is not after') }}", value: '$dateNotAfter' },
    { label: "{{ t('is empty') }}", value: '$null', noValue: true },
    { label: "{{ t('is not empty') }}", value: '$notNull', noValue: true },
  ],
};
