import { dataSource, defaultProps, operators, unique } from './properties';
import { IField } from './types';

export const select: IField = {
  name: 'select',
  type: 'object',
  group: 'choices',
  order: 2,
  title: '{{t("Single select")}}',
  sortable: true,
  default: {
    type: 'string',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Select',
      enum: [],
    },
  },
  hasDefaultValue: true,
  properties: {
    ...defaultProps,
    unique,
    'uiSchema.enum': dataSource,
  },
  filterable: {
    operators: operators.enumType,
  },
};
