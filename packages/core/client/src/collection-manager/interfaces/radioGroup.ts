import { dataSource, defaultProps, operators } from './properties';
import { IField } from './types';

export const radioGroup: IField = {
  name: 'radioGroup',
  type: 'object',
  group: 'choices',
  order: 4,
  title: '{{t("Radio group")}}',
  sortable: true,
  default: {
    type: 'string',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Radio.Group',
    },
  },
  availableTypes: ['string', 'integer', 'boolean', 'integer'],
  hasDefaultValue: true,
  properties: {
    ...defaultProps,
    'uiSchema.enum': dataSource,
  },
  filterable: {
    operators: operators.enumType,
  },
  titleUsable: true,
};
