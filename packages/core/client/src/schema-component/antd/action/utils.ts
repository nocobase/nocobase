import type { ISchema } from '@formily/react';
import { last } from 'lodash';
import { conditionAnalyse } from '../../common/utils/uitls';
import { ActionType } from '../../../schema-settings/LinkageRules/type';
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

export const linkageAction = (operator, field, condition, values, designable) => {
  const displayResult = [field.display];
  const disableResult = [field.disabled];
  switch (operator) {
    case ActionType.Visible:
      if (conditionAnalyse(condition, values)) {
        displayResult.push(operator);
      }
      field.display = last(displayResult);
      break;
    case ActionType.Hidden:
      if (conditionAnalyse(condition, values)) {
        if (!designable) {
          displayResult.push(operator);
        } else {
          field.data = field.data || {};
          field.data.hidden = true;
        }
      }
      field.display = last(displayResult);
      break;
    case ActionType.Disabled:
      if (conditionAnalyse(condition, values)) {
        disableResult.push(true);
      }
      field.disabled = last(disableResult);
      break;
    case ActionType.Active:
      if (conditionAnalyse(condition, values)) {
        disableResult.push(false);
      }
      field.disabled = last(disableResult);
      break;
    default:
      return null;
  }
};
