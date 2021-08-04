import { ISchema } from '@formily/react';
import { dateTimeProps, defaultProps } from './properties';

export const datetime: ISchema = {
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
    } as ISchema,
  },
  properties: {
    ...defaultProps,
    ...dateTimeProps,
  },
  operations: [
    { label: '等于', value: 'eq' },
    { label: '不等于', value: 'ne' },
  ],
};
