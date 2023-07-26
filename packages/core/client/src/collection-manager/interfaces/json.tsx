import { FormLayout } from '@formily/antd-v5';
import { registerValidateRules } from '@formily/core';
import React from 'react';
import { useCurrentAppInfo } from '../../appInfo';
import { FormItem } from '../../schema-component';
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
        message: error.message,
      };
    }
  },
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
      default: null,
    },
  },
  availableTypes: ['json', 'array'],
  hasDefaultValue: true,
  properties: {
    ...defaultProps,
    jsonb: {
      type: 'boolean',
      title: 'JSONB',
      'x-decorator': function Com({ children }) {
        const {
          data: { database },
        } = useCurrentAppInfo();

        return (
          <FormLayout style={{ display: database.dialect === 'postgres' ? 'block' : 'none' }}>
            <FormItem>{children}</FormItem>
          </FormLayout>
        );
      },
      'x-component': 'Checkbox',
    },
  },
  filterable: {},
};
