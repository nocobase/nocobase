import { defaultProps, operators, unique } from './properties';
import { IField } from './types';

export const checkbox: IField = {
  name: 'checkbox',
  type: 'object',
  group: 'choices',
  order: 1,
  title: '{{t("Checkbox")}}',
  default: {
    type: 'boolean',
    // name,
    uiSchema: {
      type: 'boolean',
      'x-component': 'Checkbox',
    },
  },
  hasDefaultValue: true,
  properties: {
    ...defaultProps,
    unique
  },
  filterable: {
    operators: operators.boolean,
  },
};
