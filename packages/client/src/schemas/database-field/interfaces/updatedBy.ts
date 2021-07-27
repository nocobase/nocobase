import { ISchema } from '@formily/react';
import { defaultProps } from './properties';

export const updatedBy: ISchema = {
  name: 'updatedBy',
  type: 'object',
  group: 'systemInfo',
  order: 4,
  title: '最后修改人',
  default: {
    dataType: 'belongsTo',
    target: 'users',
    foreignKey: 'updated_by_id',
    // name,
    uiSchema: {
      type: 'object',
      title: '最后修改人',
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
