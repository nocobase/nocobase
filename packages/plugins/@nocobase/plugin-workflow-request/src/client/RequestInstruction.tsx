import { ArrayItems } from '@formily/antd-v5';

import {
  Instruction,
  WorkflowVariableInput,
  WorkflowVariableJSON,
  WorkflowVariableTextArea,
  defaultFieldNames,
} from '@nocobase/plugin-workflow/client';

import { NAMESPACE } from '../locale';

export default class extends Instruction {
  title = `{{t("HTTP request", { ns: "${NAMESPACE}" })}}`;
  type = 'request';
  group = 'extended';
  description = `{{t("Send HTTP request to a URL. You can use the variables in the upstream nodes as request headers, parameters and request body.", { ns: "${NAMESPACE}" })}}`;
  fieldset = {
    method: {
      type: 'string',
      required: true,
      title: `{{t("HTTP method", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        showSearch: false,
        allowClear: false,
        className: 'auto-width',
      },
      enum: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'PATCH', value: 'PATCH' },
        { label: 'DELETE', value: 'DELETE' },
      ],
      default: 'POST',
    },
    url: {
      type: 'string',
      required: true,
      title: `{{t("URL", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-decorator-props': {},
      'x-component': 'WorkflowVariableTextArea',
      'x-component-props': {
        placeholder: 'https://www.nocobase.com',
      },
    },
    headers: {
      type: 'array',
      'x-component': 'ArrayItems',
      'x-decorator': 'FormItem',
      title: `{{t("Headers", { ns: "${NAMESPACE}" })}}`,
      description: `{{t('"Content-Type" only support "application/json", and no need to specify', { ns: "${NAMESPACE}" })}}`,
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
                  placeholder: `{{t("Name")}}`,
                },
              },
              value: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'WorkflowVariableInput',
                'x-component-props': {
                  useTypedConstant: true,
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
    params: {
      type: 'array',
      'x-component': 'ArrayItems',
      'x-decorator': 'FormItem',
      title: `{{t("Parameters", { ns: "${NAMESPACE}" })}}`,
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
                  placeholder: `{{t("Name")}}`,
                },
              },
              value: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'WorkflowVariableInput',
                'x-component-props': {
                  useTypedConstant: true,
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
          title: `{{t("Add parameter", { ns: "${NAMESPACE}" })}}`,
          'x-component': 'ArrayItems.Addition',
        },
      },
    },
    data: {
      type: 'string',
      title: `{{t("Body", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-decorator-props': {},
      'x-component': 'WorkflowVariableJSON',
      'x-component-props': {
        changeOnSelect: true,
        autoSize: {
          minRows: 10,
        },
        placeholder: `{{t("Input request data", { ns: "${NAMESPACE}" })}}`,
      },
      description: `{{t("Only support standard JSON data", { ns: "${NAMESPACE}" })}}`,
    },
    timeout: {
      type: 'number',
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
    ignoreFail: {
      type: 'boolean',
      title: `{{t("Ignore failed request and continue workflow", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
  };
  components = {
    ArrayItems,
    WorkflowVariableInput,
    WorkflowVariableTextArea,
    WorkflowVariableJSON,
  };
  useVariables({ key, title }, { types, fieldNames = defaultFieldNames }) {
    return {
      [fieldNames.value]: key,
      [fieldNames.label]: title,
    };
  }
}
