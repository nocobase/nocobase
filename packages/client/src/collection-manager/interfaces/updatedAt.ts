import { dateTimeProps, defaultProps, operators } from './properties';
import { IField } from './types';

export const updatedAt: IField = {
  name: 'updatedAt',
  type: 'object',
  group: 'systemInfo',
  order: 2,
  title: '{{t("Last updated at")}}',
  sortable: true,
  default: {
    type: 'date',
    field: 'updatedAt',
    // name,
    uiSchema: {
      type: 'string',
      title: '{{t("Last updated at")}}',
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
