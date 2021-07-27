import { ISchema } from '@formily/react';
import { omit } from 'lodash';
import { defaultProps } from './properties';

export const checkbox: ISchema = {
  name: 'checkbox',
  type: 'object',
  group: 'choices',
  order: 1,
  title: '勾选',
  default: {
    dataType: 'boolean',
    // name,
    uiSchema: {
      type: 'boolean',
      // title,
      'x-component': 'Checkbox',
      'x-decorator': 'FormItem',
      'x-designable-bar': 'Checkbox.DesignableBar',
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
