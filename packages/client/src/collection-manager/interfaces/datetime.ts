import { dateTimeProps, defaultProps, operators } from './properties';
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
      type: 'string',
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
  filterable: {
    operators: operators.datetime,
  },
};
