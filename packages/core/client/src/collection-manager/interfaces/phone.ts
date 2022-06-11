import { defaultProps, operators } from './properties';
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
      'x-component-props': {
        type: 'tel'
      },
      // 'x-validator': 'phone',
    },
  },
  properties: {
    ...defaultProps,
  },
  filterable: {
    operators: operators.string,
  },
};
