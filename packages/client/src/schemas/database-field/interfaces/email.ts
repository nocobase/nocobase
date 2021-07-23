import { ISchema } from '@formily/react';
import { defaultProps } from './properties';

export const email: ISchema = {
  name: 'email',
  type: 'object',
  group: 'basic',
  order: 4,
  title: '电子邮箱',
  default: {
    dataType: 'string',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Input',
      'x-decorator': 'FormItem',
      'x-validator': 'email',
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
