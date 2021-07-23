import { ISchema } from '@formily/react';
import { defaultProps, dataSource } from './properties';

export const checkboxGroup: ISchema = {
  name: 'checkboxGroup',
  type: 'object',
  group: 'choices',
  order: 5,
  title: '复选框',
  default: {
    interface: 'checkboxGroup',
    dataType: 'json',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Checkbox.Group',
      'x-decorator': 'FormItem',
      'x-designable-bar': 'Checkbox.Group.DesignableBar',
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
