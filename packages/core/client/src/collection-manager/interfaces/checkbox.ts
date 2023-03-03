import { defaultProps, operators } from './properties';
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
  },
  filterable: {
    operators: operators.boolean,
  },
};
