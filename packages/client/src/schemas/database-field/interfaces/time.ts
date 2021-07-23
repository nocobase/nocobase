import { ISchema } from '@formily/react';
import { defaultProps } from './properties';

export const time: ISchema = {
  name: 'time',
  type: 'object',
  group: 'datetime',
  order: 2,
  title: '时间',
  default: {
    dataType: 'time',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'TimePicker',
      'x-decorator': 'FormItem',
      'x-designable-bar': 'TimePicker.DesignableBar',
    } as ISchema,
  },
  properties: {
    ...defaultProps,
  },
  operations: [
    { label: '等于', value: 'eq' },
    { label: '不等于', value: 'ne' },
  ],
};
