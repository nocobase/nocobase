import { i18n } from '../../i18n';
import { defaultProps, operators, unique } from './properties';
import { IField } from './types';
import { registerValidateRules } from '@formily/core';

registerValidateRules({
  username(value) {
    return /^[^@.]{2,16}$/.test(value) || i18n.t("2 to 16 characters (excluding '@' and '.')");
  },
});

export const username: IField = {
  name: 'username',
  type: 'object',
  group: 'basic',
  order: 1,
  title: '{{t("Username")}}',
  sortable: true,
  default: {
    type: 'string',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Input',
      'x-validator': { username: true },
      required: true,
    },
  },
  availableTypes: ['string'],
  hasDefaultValue: false,
  properties: {
    ...defaultProps,
    unique,
  },
  filterable: {
    operators: operators.string,
  },
  titleUsable: true,
};
