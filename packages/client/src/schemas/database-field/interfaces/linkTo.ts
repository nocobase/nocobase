import { ISchema } from '@formily/react';
import { defaultProps } from './properties';

export const linkTo: ISchema = {
  name: 'linkTo',
  type: 'object',
  group: 'relation',
  order: 1,
  title: '关联字段',
  default: {
    dataType: 'belongsToMany',
    // name,
    uiSchema: {
      type: 'array',
      // title,
      'x-component': 'Select.Drawer',
      'x-component-props': {},
      'x-decorator': 'FormItem',
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
