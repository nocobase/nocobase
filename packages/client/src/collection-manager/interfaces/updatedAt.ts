import { datetime } from './datetime';
import { dateTimeProps, defaultProps } from './properties';
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
    field: 'updated_at',
    // name,
    uiSchema: {
      type: 'datetime',
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
  operators: datetime.operators,
};
