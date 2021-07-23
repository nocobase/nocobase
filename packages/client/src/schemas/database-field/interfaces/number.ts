import { ISchema } from '@formily/react';
import { defaultProps } from './properties';

export const number: ISchema = {
  name: 'number',
  type: 'object',
  group: 'basic',
  order: 5,
  title: '数字',
  default: {
    dataType: 'float',
    // name,
    uiSchema: {
      type: 'number',
      // title,
      'x-component': 'InputNumber',
      'x-decorator': 'FormItem',
      'x-designable-bar': 'InputNumber.DesignableBar',
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
