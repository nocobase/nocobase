import { dataSource, defaultProps, operators } from './properties';
import { IField } from './types';

export const checkboxGroup: IField = {
  name: 'checkboxGroup',
  type: 'object',
  group: 'choices',
  order: 5,
  title: '{{t("Checkbox group")}}',
  default: {
    interface: 'checkboxGroup',
    type: 'array',
    defaultValue: [],
    // name,
    uiSchema: {
      type: 'string',
      'x-component': 'Checkbox.Group',
    },
  },
  hasDefaultValue: true,
  properties: {
    ...defaultProps,
    'uiSchema.enum': dataSource,
  },
  filterable: {
    operators: operators.array,
  },
};
