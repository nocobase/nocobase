import { ArrayItems } from '@formily/antd';
import { cx, css } from '@emotion/css';

import { NAMESPACE } from '../locale';
import { useWorkflowVariableOptions } from '../variable';

export default {
  title: `{{t("HTTP request", { ns: "${NAMESPACE}" })}}`,
  type: 'request',
  group: 'extended',
  description: `{{t("Send HTTP request to a URL. You can use the variables in the upstream nodes as request headers, parameters and request body.", { ns: "${NAMESPACE}" })}}`,
  fieldset: {
    method: {
      type: 'string',
      required: true,
      title: `{{t("HTTP method", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
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
      default: 'POST',
    },
    url: {
      type: 'string',
      required: true,
      title: `{{t("URL", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-decorator-props': {},
      'x-component': 'Input',
      'x-component-props': {
        placeholder: 'https://www.nocobase.com',
        className: 'full-width',
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
                'x-component': 'Variable.Input',
                'x-component-props': {
                  scope: useWorkflowVariableOptions,
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
                'x-component': 'Variable.Input',
                'x-component-props': {
                  scope: useWorkflowVariableOptions,
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
      'x-component': 'Variable.JSON',
      'x-component-props': {
        scope: useWorkflowVariableOptions,
        autoSize: {
          minRows: 10,
        },
        placeholder: `{{t("Input request data", { ns: "${NAMESPACE}" })}}`,
        className: cx(
          'full-width',
          css`
            font-size: 90%;
            font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
          `,
        ),
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
      title: `{{t("Ignore fail request and continue workflow", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
  },
  view: {},
  scope: {},
  components: {
    ArrayItems,
  },
};
