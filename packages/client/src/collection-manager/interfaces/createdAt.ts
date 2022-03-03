import { dateTimeProps, defaultProps, operators } from './properties';
import { IField } from './types';

export const createdAt: IField = {
  name: 'createdAt',
  type: 'object',
  group: 'systemInfo',
  order: 1,
  title: '{{t("Created at")}}',
  sortable: true,
  default: {
    type: 'date',
    field: 'createdAt',
    // name,
    uiSchema: {
      type: 'datetime',
      title: '{{t("Created at")}}',
      'x-component': 'DatePicker',
      'x-component-props': {},
      'x-read-pretty': true,
    },
  },
  properties: {
    ...defaultProps,
    ...dateTimeProps,
  },
  filterable: {
    operators: operators.datetime,
  },
};
