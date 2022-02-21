import { defaultProps } from './properties';
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
  properties: {
    ...defaultProps,
  },
  operators: [
    { label: '{{t("Yes")}}', value: '$isTruly', selected: true, noValue: true },
    { label: '{{t("No")}}', value: '$isFalsy', noValue: true },
  ],
};
