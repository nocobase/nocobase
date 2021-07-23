import { ISchema } from '@formily/react';
import { defaultProps } from './properties';

export const createdBy: ISchema = {
  name: 'createdBy',
  type: 'object',
  group: 'systemInfo',
  order: 3,
  title: '创建人',
  default: {
    dataType: 'belongsTo',
    target: 'users',
    foreignKey: 'created_by_id',
    // name,
    uiSchema: {
      type: 'object',
      // title,
      'x-component': 'Select.Drawer',
      'x-component-props': {},
      'x-decorator': 'FormItem',
      'x-read-pretty': true,
      'x-designable-bar': 'Select.Drawer.DesignableBar',
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
