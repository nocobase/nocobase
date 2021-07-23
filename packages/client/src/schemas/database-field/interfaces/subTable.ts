import { ISchema } from '@formily/react';
import { defaultProps } from './properties';

export const subTable: ISchema = {
  name: 'subTable',
  type: 'object',
  group: 'relation',
  order: 2,
  title: '子表格',
  default: {
    dataType: 'hasMany',
    // name,
    uiSchema: {
      type: 'array',
      // title,
      'x-decorator': 'FormItem',
      'x-component': 'Table',
      'x-component-props': {},
      'x-designable-bar': 'Table.DesignableBar',
      enum: [],
    } as ISchema,
  },
  properties: {
    ...defaultProps,
    'children': {
      type: 'array',
      title: '子表格字段',
      'x-decorator': 'FormItem',
      'x-component': 'DatabaseField',
    },
  },
};
