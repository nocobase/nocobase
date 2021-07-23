import { ISchema } from '@formily/react';
import { defaultProps } from './properties';

export const textarea: ISchema = {
  name: 'textarea',
  type: 'object',
  group: 'basic',
  order: 2,
  title: '多行文本',
  default: {
    dataType: 'text',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
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
