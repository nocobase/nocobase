import { dateTimeProps, defaultProps } from './properties';
import { IField } from './types';

export const datetime: IField = {
  name: 'datetime',
  type: 'object',
  group: 'datetime',
  order: 1,
  title: '{{t("Datetime")}}',
  sortable: true,
  default: {
    type: 'date',
    // name,
    uiSchema: {
      type: 'datetime',
      // title,
      'x-component': 'DatePicker',
      'x-component-props': {
        showTime: false,
      },
    },
  },
  properties: {
    ...defaultProps,
    ...dateTimeProps,
  },
  operators: [
    { label: "{{ t('is') }}", value: '$dateOn', selected: true },
    { label: "{{ t('is not') }}", value: '$dateNotOn' },
    { label: "{{ t('is before') }}", value: '$dateBefore' },
    { label: "{{ t('is after') }}", value: '$dateAfter' },
    { label: "{{ t('is on or after') }}", value: '$dateNotBefore' },
    { label: "{{ t('is on or before') }}", value: '$dateNotAfter' },
    { label: "{{ t('is empty') }}", value: '$null', noValue: true },
    { label: "{{ t('is not empty') }}", value: '$notNull', noValue: true },
  ],
};
