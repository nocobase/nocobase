import { ISchema } from '@formily/react';
import { defaultProps } from './properties';
import { FieldOptions } from '.';

export const createdBy: FieldOptions = {
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
      title: '创建人',
      'x-component': 'Select.Drawer',
      'x-component-props': {
        fieldNames: {
          value: 'id',
          label: 'nickname',
        },
      },
      'x-decorator': 'FormItem',
      'x-read-pretty': true,
      'x-designable-bar': 'Select.Drawer.DesignableBar',
    },
  },
  properties: {
    ...defaultProps,
  },
};
