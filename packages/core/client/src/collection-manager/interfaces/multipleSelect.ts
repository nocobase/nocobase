import { dataSource, defaultProps, operators } from './properties';
import { IField } from './types';

export const multipleSelect: IField = {
  name: 'multipleSelect',
  type: 'object',
  group: 'choices',
  order: 3,
  title: '{{t("Multiple select")}}',
  default: {
    type: 'array',
    defaultValue: [],
    // name,
    uiSchema: {
      type: 'array',
      // title,
      'x-component': 'Select',
      'x-component-props': {
        mode: 'multiple',
      },
      enum: [],
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
