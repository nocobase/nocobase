import { defaultProps, operators, unique } from './properties';
import { IField } from './types';
import { registerValidateRules } from '@formily/core';

registerValidateRules({
  json(value) {
    try {
      JSON.parse(value);
      return true;
    } catch (error) {
      return {
        type: 'error',
        message: error.message
      };
    }
  }
});

export const json: IField = {
  name: 'json',
  type: 'object',
  group: 'advanced',
  order: 3,
  title: '{{t("JSON")}}',
  sortable: true,
  default: {
    type: 'json',
    // name,
    uiSchema: {
      type: 'object',
      // title,
      'x-component': 'Input.JSON',
      'x-component-props': {
        autoSize: {
          minRows: 5,
          // maxRows: 20,
        },
      },
      default: null
    },
  },
  hasDefaultValue: true,
  properties: {
    ...defaultProps,
  },
  filterable: {
  }
};
