import { defaultProps, operators } from './properties';
import { IField } from './types';

export const input: IField = {
  name: 'input',
  type: 'object',
  group: 'basic',
  order: 1,
  title: '{{t("Single line text")}}',
  sortable: true,
  default: {
    interface: 'input',
    type: 'string',
    uiSchema: {
      type: 'string',
      'x-component': 'Input',
    },
  },
  properties: {
    ...defaultProps,
  },
  filterable: {
    operators: operators.string,
  },
};
