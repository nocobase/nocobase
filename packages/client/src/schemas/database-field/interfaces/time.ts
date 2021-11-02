import { defaultProps } from './properties';
import { FieldOptions } from '.';

export const time: FieldOptions = {
  name: 'time',
  type: 'object',
  group: 'datetime',
  order: 2,
  title: '{{t("Time")}}',
  sortable: true,
  default: {
    dataType: 'time',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'TimePicker',
      'x-decorator': 'FormItem',
      'x-designable-bar': 'TimePicker.DesignableBar',
    },
  },
  properties: {
    ...defaultProps,
    'uiSchema.x-component-props.format': {
      type: 'string',
      title: '{{t("Time format")}}',
      'x-component': 'Radio.Group',
      'x-decorator': 'FormItem',
      default: 'HH:mm:ss',
      enum: [
        {
          label: '{{t("12 hour")}}',
          value: 'hh:mm:ss a',
        },
        {
          label: '{{t("24 hour")}}',
          value: 'HH:mm:ss',
        },
      ],
    },
  },
  operations: [
    { label: '{{t("is")}}', value: 'eq', selected: true },
    { label: '{{t("is not")}}', value: 'neq' },
    // { label: '大于', value: 'gt' },
    // { label: '大于等于', value: 'gte' },
    // { label: '小于', value: 'lt' },
    // { label: '小于等于', value: 'lte' },
    { label: '{{t("is empty")}}', value: '$null', noValue: true },
    { label: '{{t("is not empty")}}', value: '$notNull', noValue: true },
  ],
};
