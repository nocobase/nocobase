import { defaultProps, operators, unique } from './properties';
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
  hasDefaultValue: true,
  properties: {
    ...defaultProps,
    unique,
  },
  filterable: {
    operators: operators.string,
  },
};
