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
    showUnchecked: {
      type: 'boolean',
      title: '{{t("Display X when unchecked")}}',
      default: false,
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    }
  },
  filterable: {
    operators: operators.boolean,
  },
};
