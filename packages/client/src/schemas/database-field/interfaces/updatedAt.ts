import { ISchema } from '@formily/react';
import { datetime } from './datetime';
import { dateTimeProps, defaultProps } from './properties';

export const updatedAt: ISchema = {
  name: 'updatedAt',
  type: 'object',
  group: 'systemInfo',
  order: 2,
  title: '最后更新时间',
  sortable: true,
  default: {
    dataType: 'date',
    field: 'updated_at',
    // name,
    uiSchema: {
      type: 'datetime',
      title: '最后更新时间',
      'x-component': 'DatePicker',
      'x-component-props': {},
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-designable-bar': 'DatePicker.DesignableBar',
    } as ISchema,
  },
  properties: {
    ...defaultProps,
    ...dateTimeProps,
  },
  operations: datetime.operations,
};
