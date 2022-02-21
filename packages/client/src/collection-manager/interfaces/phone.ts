import { input } from './input';
import { defaultProps } from './properties';
import { IField } from './types';

export const phone: IField = {
  name: 'phone',
  type: 'object',
  group: 'basic',
  order: 3,
  title: '{{t("Phone")}}',
  sortable: true,
  default: {
    type: 'string',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Input',
      'x-decorator': 'FormItem',
      'x-validator': 'phone',
      'x-designable-bar': 'Input.DesignableBar',
    },
  },
  properties: {
    ...defaultProps,
  },
  operators: input.operators,
};
