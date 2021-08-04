import { ISchema } from '@formily/react';
import { defaultProps } from './properties';

export const time: ISchema = {
  name: 'time',
  type: 'object',
  group: 'datetime',
  order: 2,
  title: '时间',
  sortable: true,
  default: {
    dataType: 'time',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'TimePicker',
      'x-decorator': 'FormItem',
      'x-designable-bar': 'TimePicker.DesignableBar',
    } as ISchema,
  },
  properties: {
    ...defaultProps,
    'uiSchema.x-component-props.format': {
      type: 'string',
      title: '时间格式',
      'x-component': 'Radio.Group',
      'x-decorator': 'FormItem',
      default: 'HH:mm:ss',
      enum: [
        {
          label: '24小时制',
          value: 'HH:mm:ss',
        },
        {
          label: '12小时制',
          value: 'hh:mm:ss a',
        },
      ],
    },
  },
  operations: [
    { label: '等于', value: 'eq' },
    { label: '不等于', value: 'ne' },
  ],
};
