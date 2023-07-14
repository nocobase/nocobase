import { defaultProps, operators } from './properties';
import { IField } from './types';

export const color: IField = {
  name: 'color',
  type: 'object',
  group: 'basic',
  order: 10,
  title: '{{t("Color")}}',
  default: {
    type: 'string',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'ColorPicker',
    },
  },
  availableTypes: ['string'],
  hasDefaultValue: true,
  properties: {
    ...defaultProps,
  },
  filterable: {
    operators: operators.string,
  },
};
