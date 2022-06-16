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
    'uiSchema.x-component-props.gmt': {
      type: 'boolean',
      title: '{{t("GMT")}}',
      'x-component': 'Checkbox',
      'x-content': '{{t("Use the same time zone (GMT) for all users")}}',
      'x-decorator': 'FormItem',
      default: false,
    },
  },
  filterable: {
    operators: operators.datetime,
  },
};
