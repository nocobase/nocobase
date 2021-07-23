import { ISchema } from '@formily/react';
import { defaultProps, dataSource } from './properties';

export const radioGroup: ISchema = {
  name: 'radioGroup',
  type: 'object',
  group: 'choices',
  order: 4,
  title: '单选框',
  default: {
    dataType: 'string',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Radio.Group',
      'x-decorator': 'FormItem',
      'x-designable-bar': 'Radio.DesignableBar',
    } as ISchema,
  },
  properties: {
    ...defaultProps,
    'uiSchema.enum': dataSource,
  },
  operations: [
    { label: '等于', value: 'eq' },
    { label: '不等于', value: 'ne' },
  ],
};
