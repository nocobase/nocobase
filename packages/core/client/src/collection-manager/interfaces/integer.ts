import { defaultProps, operators } from './properties';
import { IField } from './types';

export const integer: IField = {
  name: 'integer',
  type: 'object',
  group: 'basic',
  order: 5,
  title: '{{t("Integer")}}',
  sortable: true,
  default: {
    type: 'integer',
    // name,
    uiSchema: {
      type: 'number',
      // title,
      'x-component': 'InputNumber',
      'x-component-props': {
        stringMode: true,
        step: '0',
      },
      'x-validator': 'integer',
    },
  },
  properties: {
    ...defaultProps,
  },
  filterable: {
    operators: operators.number,
  },
};
