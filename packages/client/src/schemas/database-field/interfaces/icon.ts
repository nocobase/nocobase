import { ISchema } from '@formily/react';
import { defaultProps } from './properties';

export const icon: ISchema = {
  name: 'icon',
  type: 'object',
  group: 'basic',
  order: 8,
  title: '图标',
  default: {
    dataType: 'string',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'IconPicker',
      'x-decorator': 'FormItem',
      'x-designable-bar': 'IconPicker.DesignableBar',
    } as ISchema,
  },
  properties: {
    ...defaultProps,
  },
};
