import { defaultProps } from './properties';
import { IField } from './types';

export const icon: IField = {
  name: 'icon',
  type: 'object',
  group: 'basic',
  order: 8,
  title: '{{t("Icon")}}',
  default: {
    type: 'string',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'IconPicker',
    },
  },
  hasDefaultValue: true,
  properties: {
    ...defaultProps,
  },
};
