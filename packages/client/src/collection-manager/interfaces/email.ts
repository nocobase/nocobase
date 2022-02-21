import { input } from './input';
import { defaultProps } from './properties';
import { IField } from './types';

export const email: IField = {
  name: 'email',
  type: 'object',
  group: 'basic',
  order: 4,
  title: '{{t("Email")}}',
  sortable: true,
  default: {
    type: 'string',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Input',
      'x-validator': 'email',
    },
  },
  properties: {
    ...defaultProps,
  },
  operators: input.operators,
};
