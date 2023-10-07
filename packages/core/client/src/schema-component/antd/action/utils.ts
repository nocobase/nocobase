import type { ISchema } from '@formily/react';
import { ActionType } from '../../../schema-settings/LinkageRules/type';
import { VariableOption, VariablesContextType } from '../../../variables/types';
import { conditionAnalyses } from '../../common/utils/uitls';
const validateJSON = {
  validator: `{{(value, rule)=> {
    if (!value) {
      return '';
    }
    try {
      const val = JSON.parse(value);
      if(!isNaN(val)) {
        return false;
      }
      return true;
    } catch(error) {
      console.error(error);
      return false;
    }
  }}}`,
  message: '{{t("Invalid JSON format")}}',
};

export const requestSettingsSchema: ISchema = {
  type: 'object',
  properties: {
    url: {
      type: 'string',
      title: '{{t("Request URL")}}',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    method: {
      type: 'string',
      title: '{{t("Request method")}}',
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
    headers: {
      type: 'string',
      title: '{{t("Request headers")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
      'x-validator': validateJSON,
    },
    params: {
      type: 'string',
      title: '{{t("Request query parameters")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
      'x-validator': validateJSON,
    },
    data: {
      type: 'string',
      title: '{{t("Request body")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
      'x-validator': validateJSON,
    },
  },
};

export const linkageAction = async ({
  operator,
  field,
  condition,
  values,
  variables,
  localVariables,
}: {
  operator;
  field;
  condition;
  values;
  variables: VariablesContextType;
  localVariables: VariableOption[];
}) => {
  field.data = field.data || {};

  switch (operator) {
    case ActionType.Visible:
      reset(field);
      if (await conditionAnalyses({ rules: condition, formValues: values, variables, localVariables })) {
        field._display = '_display' in field ? field._display : field.display;
        field.display = operator;
      } else {
        field.display = field._display;
      }
      break;
    case ActionType.Hidden:
      reset(field);
      if (await conditionAnalyses({ rules: condition, formValues: values, variables, localVariables })) {
        field.data.hidden = true;
      } else {
        field.data.hidden = false;
      }
      break;
    case ActionType.Disabled:
      reset(field);
      if (await conditionAnalyses({ rules: condition, formValues: values, variables, localVariables })) {
        field.data.disabled = true;
        field.disabled = true;
      } else {
        field.data.disabled = false;
        field.disabled = false;
      }
      break;
    case ActionType.Active:
      reset(field);
      if (await conditionAnalyses({ rules: condition, formValues: values, variables, localVariables })) {
        field.data.disabled = false;
        field.disabled = false;
      } else {
        field.data.disabled = true;
        field.disabled = true;
      }
      break;
    default:
      return null;
  }
};

function reset(field: any) {
  field.display = field._display;
  field.data.hidden = false;
  field.data.disabled = false;
  field.disabled = false;
}
