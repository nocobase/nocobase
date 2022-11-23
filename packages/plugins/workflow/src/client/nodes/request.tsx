import { NAMESPACE } from '../locale';
import { ArrayItems } from '@formily/antd';
import React from 'react';
import EjsTextArea from '../components/EjsTextArea';



export default {
  title: `{{t("HTTP request", { ns: "${NAMESPACE}" })}}`,
  type: 'request',
  group: 'extended',
  fieldset: {
    'config.url': {
      type: 'string',
      name: 'config.url',
      required: true,
      title: `{{t("URL", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-decorator-props': {},
      'x-component': 'EjsTextArea',
      'x-component-props': {
        autoSize: {
          minRows: 1,
        },
        placeholder: 'https://xxxxxx',
        description: `{{t("You can use the above available variables in URL.", { ns: "${NAMESPACE}" })}}`,
      },
    },
    'config.timeout': {
      type: 'number',
      name: 'config.timeout',
      required: true,
      title: `{{t("Timeout config", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-decorator-props': {},
      'x-component': 'InputNumber',
      'x-component-props': {
        addonAfter: `{{t("ms", { ns: "${NAMESPACE}" })}}`,
        min: 1,
        step: 1000,
        defaultValue: 5000,
      },
    },
    'config.headers': {
      type: 'array',
      name: 'config.headers',
      'x-component': 'ArrayItems',
      'x-decorator': 'FormItem',
      title: `{{t("Request headers", { ns: "${NAMESPACE}" })}}`,
      description: `{{t("Default headers is Content-Type: application/json", { ns: "${NAMESPACE}" })}}`,
      items: {
        type: 'object',
        properties: {
          space: {
            type: 'void',
            'x-component': 'Space',
            properties: {
              name: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {
                  placeholder: `{{t("Name(e.g. Content-Type)", { ns: "${NAMESPACE}" })}}`,
                },
              },
              value: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {
                  placeholder: `{{t("Value(e.g. Application/json)", { ns: "${NAMESPACE}" })}}`,
                },
              },
              remove: {
                type: 'void',
                'x-decorator': 'FormItem',
                'x-component': 'ArrayItems.Remove',
              },
            },
          },
        },
      },
      properties: {
        add: {
          type: 'void',
          title: `{{t("Add request header", { ns: "${NAMESPACE}" })}}`,
          'x-component': 'ArrayItems.Addition',
        },
      },
    },
    'config.method': {
      type: 'string',
      name: 'config.method',
      required: true,
      title: `{{t("HTTP method", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        defaultValue: 'POST',
        showSearch: false,
        allowClear: false,
      },
      enum: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'PATCH', value: 'PATCH' },
        { label: 'DELETE', value: 'DELETE' },
      ],
    },
    'config.data': {
      type: 'string',
      name: 'config.data',
      'x-hidden': false,
      title: `{{t("Request data", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-decorator-props': {},
      'x-component': 'EjsTextArea',
      'x-component-props': {
        autoSize: {
          minRows: 5,
        },
        placeholder: `{{t("Input request data", { ns: "${NAMESPACE}" })}}`,
        description: `{{t("You can use the above available variables in request data.", { ns: "${NAMESPACE}" })}}`,
      },

    },
    'config.ignoreFail': {
      type: 'boolean',
      name: 'config.ignoreFail',
      title: `{{t("Ignore fail request and continue workflow", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    }
  },
  view: {},
  scope: {},
  components: {
    ArrayItems,
    EjsTextArea,
  },
};
