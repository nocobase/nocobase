import { defaultProps } from './properties';
import { IField } from './types';

export const password: IField = {
  name: 'password',
  type: 'object',
  group: 'basic',
  order: 7,
  title: '{{t("Password")}}',
  default: {
    type: 'password',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Password',
      'x-decorator': 'FormItem',
      'x-designable-bar': 'Password.DesignableBar',
    },
  },
  properties: {
    ...defaultProps,
  },
};
