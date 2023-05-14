import { last } from 'lodash';
import { conditionAnalyse } from '../../common/utils/uitls';
import { ActionType } from '../../../schema-settings/LinkageRules/type';
import { Schema } from '@formily/json-schema';

export const linkageAction = (operator, field, condition, values) => {
  const disableResult = field?.linkageProperty?.disabled || [false];
  const displayResult = field?.linkageProperty?.display || ['visible'];
  switch (operator) {
    case ActionType.Visible:
      if (conditionAnalyse(condition, values)) {
        displayResult.push(operator);
        field.data = field.data || {};
        field.data.hidden = false;
      }
      field.linkageProperty = {
        ...field.linkageProperty,
        display: displayResult,
      };
      field.display = last(displayResult);
      break;
    case ActionType.Hidden:
      if (conditionAnalyse(condition, values)) {
        field.data = field.data || {};
        field.data.hidden = true;
      } else {
        field.data = field.data || {};
        field.data.hidden = false;
      }
      break;
    case ActionType.Disabled:
      if (conditionAnalyse(condition, values)) {
        disableResult.push(true);
      }
      field.linkageProperty = {
        ...field.linkageProperty,
        disabled: disableResult,
      };
      field.disabled = last(disableResult);
      break;
    case ActionType.Active:
      if (conditionAnalyse(condition, values)) {
        disableResult.push(false);
      }
      field.linkageProperty = {
        ...field.linkageProperty,
        disabled: disableResult,
      };
      field.disabled = last(disableResult);
      break;
    default:
      return null;
  }
};

export const findTableOrFormBlockProviderByActionFieldSchema = (fieldSchema: Schema) => {
  let targetSchema = fieldSchema;
  let targetBlockName = '';
  if (targetSchema?.['x-action'] === 'customize:table:request') {
    targetBlockName = 'TableBlockProvider';
  } else if (targetSchema?.['x-action'] === 'customize:form:request') {
    targetBlockName = 'FormBlockProvider';
  }
  while (targetBlockName && targetSchema && targetSchema?.['x-decorator'] !== targetBlockName) {
    targetSchema = targetSchema?.parent;
  }
  return targetSchema;
};

export const getCustomRequestSchema = () => {
  return {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        title: '{{t("Request name")}}',
        required: true,
        'x-decorator': 'FormItem',
        'x-component': 'Input',
      },
      method: {
        type: 'string',
        title: '{{t("HTTP method")}}',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        default: 'POST',
        enum: [
          { label: 'POST', value: 'POST' },
          { label: 'GET', value: 'GET' },
          { label: 'PUT', value: 'PUT' },
          { label: 'PATCH', value: 'PATCH' },
          { label: 'DELETE', value: 'DELETE' },
        ],
      },
      url: {
        type: 'string',
        title: '{{t("URL")}}',
        required: true,
        'x-decorator': 'FormItem',
        'x-component': 'Input',
      },
      headers: {
        type: 'array',
        title: '{{t("Request headers")}}',
        'x-decorator': 'FormItem',
        'x-component': 'ArrayItems',
        items: {
          type: 'object',
          properties: {
            space: {
              type: 'void',
              'x-component': 'Space',
              'x-component-props': {
                align: 'bottom',
              },
              properties: {
                key: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                  'x-component-props': {
                    placeholder: '{{t("Fields")}}',
                    style: { width: 270 },
                  },
                },
                value: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                  'x-component-props': {
                    placeholder: '{{t("Fields values")}}',
                    style: { width: 270 },
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
        description: `{{t('"Content-Type" only support "application/json", and no need to specify')}}`,
        properties: {
          add: {
            type: 'void',
            title: '{{t("Add request header")}}',
            'x-component': 'ArrayItems.Addition',
          },
        },
      },
      params: {
        type: 'array',
        title: '{{t("Request query parameters")}}',
        'x-decorator': 'FormItem',
        'x-component': 'ArrayItems',
        items: {
          type: 'object',
          properties: {
            space: {
              type: 'void',
              'x-component': 'Space',
              properties: {
                key: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                  'x-component-props': {
                    placeholder: '{{t("Fields")}}',
                    style: { width: 270 },
                  },
                },
                value: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                  'x-component-props': {
                    placeholder: '{{t("Fields values")}}',
                    style: { width: 270 },
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
            title: '{{t("Add parameter")}}',
            'x-component': 'ArrayItems.Addition',
          },
        },
      },
      data: {
        type: 'string',
        title: '{{t("Request body")}}',
        'x-decorator': 'FormItem',
        'x-component': 'JSONInput',
        'x-component-props': {
          autoSize: {
            minRows: 6,
          },
          placeholder: `{{t("Input request data")}}`,
        },
        description: `{{t("Only support standard JSON data")}}`,
      },
      timeout: {
        type: 'number',
        title: `{{t("Timeout config")}}`,
        'x-decorator': 'FormItem',
        'x-decorator-props': {},
        'x-component': 'InputNumber',
        'x-component-props': {
          addonAfter: `{{t("ms")}}`,
          min: 1,
          step: 1000,
          defaultValue: 5000,
        },
      },
    },
  };
};
