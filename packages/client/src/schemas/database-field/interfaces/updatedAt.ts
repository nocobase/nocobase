import { datetime } from './datetime';
import { dateTimeProps, defaultProps } from './properties';
import { FieldOptions } from '.';

export const updatedAt: FieldOptions = {
  name: 'updatedAt',
  type: 'object',
  group: 'systemInfo',
  order: 2,
  title: '{{t("Last updated at")}}',
  sortable: true,
  default: {
    dataType: 'date',
    field: 'updated_at',
    // name,
    uiSchema: {
      type: 'datetime',
      title: '{{t("Last updated at")}}',
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
