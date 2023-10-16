import type { ISchema } from '@formily/react';
import { last } from 'lodash';
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
  const disableResult = field?.linkageProperty?.disabled || [false];
  const displayResult = field?.linkageProperty?.display || ['visible'];

  switch (operator) {
    case ActionType.Visible:
      if (await conditionAnalyses({ rules: condition, formValues: values, variables, localVariables })) {
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
      if (await conditionAnalyses({ rules: condition, formValues: values, variables, localVariables })) {
        field.data = field.data || {};
        field.data.hidden = true;
      } else {
        field.data = field.data || {};
        field.data.hidden = false;
      }
      break;
    case ActionType.Disabled:
      if (await conditionAnalyses({ rules: condition, formValues: values, variables, localVariables })) {
        disableResult.push(true);
      }
      field.linkageProperty = {
        ...field.linkageProperty,
        disabled: disableResult,
      };
      field.disabled = last(disableResult);
      break;
    case ActionType.Active:
      if (await conditionAnalyses({ rules: condition, formValues: values, variables, localVariables })) {
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
