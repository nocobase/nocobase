import { ISchema } from '@formily/react';
import { defaultProps } from './properties';

export const phone: ISchema = {
  name: 'phone',
  type: 'object',
  group: 'basic',
  order: 3,
  title: '手机号码',
  sortable: true,
  default: {
    dataType: 'string',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Input',
      'x-decorator': 'FormItem',
      "x-validator": 'phone',
      'x-designable-bar': 'Input.DesignableBar',
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
