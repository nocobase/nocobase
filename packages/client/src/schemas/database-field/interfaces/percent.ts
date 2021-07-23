import { ISchema } from '@formily/react';
import { defaultProps } from './properties';

export const percent: ISchema = {
  name: 'percent',
  type: 'object',
  group: 'basic',
  order: 6,
  title: '百分比',
  default: {
    dataType: 'float',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'InputNumber',
      'x-decorator': 'FormItem',
      'x-designable-bar': 'InputNumber.DesignableBar',
    } as ISchema,
  },
  properties: {
    ...defaultProps
  },
  operations: [
    { label: '等于', value: 'eq' },
    { label: '不等于', value: 'ne' },
  ],
};
