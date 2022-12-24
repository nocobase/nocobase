import { registerValidateRules } from '@formily/core';
import { defaultProps } from './properties';
import { IField } from './types';

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
  order: 4,
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
