import { ArrayItems } from '@formily/antd';
import { css } from '@emotion/css';

import { NAMESPACE } from '../locale';
import { useWorkflowVariableOptions } from '../variable';



export default {
  title: `{{t("HTTP request", { ns: "${NAMESPACE}" })}}`,
  type: 'request',
  group: 'extended',
  fieldset: {
    'config.method': {
      type: 'string',
      name: 'config.method',
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
      default: 'POST'
    },
    'config.url': {
      type: 'string',
      name: 'config.url',
      required: true,
      title: `{{t("URL", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-decorator-props': {
        className: css`
          .ant-formily-item-control-content-component{
            .ant-input-affix-wrapper,
            .ant-input{
              width: 100%;
            }
          }
        `
      },
      'x-component': 'Input',
      'x-component-props': {
        placeholder: 'https://www.nocobase.com',
      },
    },
    'config.headers': {
      type: 'array',
      name: 'config.headers',
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
                  scope: useWorkflowVariableOptions
                }
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
    'config.params': {
      type: 'array',
      name: 'config.params',
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
                  scope: useWorkflowVariableOptions
                }
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
    'config.data': {
      type: 'string',
      name: 'config.data',
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
        className: css`
          font-size: 85%;
          font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
        `
      },
      description: `{{t("Only support standard JSON data", { ns: "${NAMESPACE}" })}}`,
    },
    'config.timeout': {
      type: 'number',
      name: 'config.timeout',
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
  },
};
