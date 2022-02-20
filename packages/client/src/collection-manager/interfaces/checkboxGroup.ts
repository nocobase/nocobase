import { dataSource } from './properties';
import { IField } from './types';

export const checkboxGroup: IField = {
  name: 'checkboxGroup',
  type: 'object',
  group: 'choices',
  order: 5,
  title: '{{t("Checkbox group")}}',
  default: {
    interface: 'checkboxGroup',
    type: 'json',
    // name,
    uiSchema: {
      type: 'string',
      'x-component': 'Checkbox.Group',
    },
  },
  properties: {
    'uiSchema.enum': dataSource,
  },
};
