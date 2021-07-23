import { ISchema } from '@formily/react';
import { defaultProps } from './properties';

export const createdAt: ISchema = {
  name: 'createdAt',
  type: 'object',
  group: 'systemInfo',
  order: 1,
  title: '创建时间',
  default: {
    dataType: 'date',
    field: 'created_at',
    // name,
    uiSchema: {
      type: 'datetime',
      // title,
      'x-component': 'DatePicker',
      'x-component-props': {},
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-designable-bar': 'DatePicker.DesignableBar',
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
