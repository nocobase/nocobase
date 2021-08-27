import { datetime } from './datetime';
import { dateTimeProps, defaultProps } from './properties';
import { FieldOptions } from '.';

export const createdAt: FieldOptions = {
  name: 'createdAt',
  type: 'object',
  group: 'systemInfo',
  order: 1,
  title: '添加时间',
  sortable: true,
  default: {
    dataType: 'date',
    field: 'created_at',
    // name,
    uiSchema: {
      type: 'datetime',
      title: '添加时间',
      'x-component': 'DatePicker',
      'x-component-props': {},
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-designable-bar': 'DatePicker.DesignableBar',
    },
  },
  properties: {
    ...defaultProps,
    ...dateTimeProps,
  },
  operations: datetime.operations,
};
