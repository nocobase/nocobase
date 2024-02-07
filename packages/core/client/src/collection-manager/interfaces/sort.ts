import { defaultProps, operators } from './properties';
import { IField } from './types';

export const sort: IField = {
  name: 'sort',
  type: 'object',
  group: 'advanced',
  order: 1,
  title: '{{t("Sort")}}',
  sortable: true,
  default: {
    type: 'string',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Input',
      'x-component-props': {},
    },
  },
  availableTypes: ['string'],
  hasDefaultValue: false,
  properties: {
    ...defaultProps,
  },
  filterable: {
    operators: operators.string,
  },
  titleUsable: true,
};
