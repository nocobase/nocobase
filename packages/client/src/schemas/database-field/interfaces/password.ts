import { ISchema } from '@formily/react';
import { defaultProps } from './properties';

export const password: ISchema = {
  name: 'password',
  type: 'object',
  group: 'basic',
  order: 7,
  title: '密码',
  default: {
    dataType: 'password',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Password',
      'x-decorator': 'FormItem',
      'x-designable-bar': 'Password.DesignableBar',
    } as ISchema,
  },
  properties: {
    ...defaultProps,
  },
};
