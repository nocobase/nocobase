import type { ISchema } from '@formily/react';
import { last } from 'lodash';
import { conditionAnalyse } from '../../common/utils/uitls';

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

export const linkageAction = (operator, field, linkageRuleCondition, form) => {
  const displayResult = [field.display];
  const disableResult = [field.disabled];

  switch (operator) {
    case 'visible':
    case 'hidden':
      if (conditionAnalyse(linkageRuleCondition, form)) {
        displayResult.push(operator);
      }
      field.display = last(displayResult);
      break;
    case 'disabled':
      if (conditionAnalyse(linkageRuleCondition, form)) {
        disableResult.push(true);
      }
      field.disabled = last(disableResult);
      break;
    case 'active':
      if (conditionAnalyse(linkageRuleCondition, form)) {
        disableResult.push(false);
      }
      field.disabled = last(disableResult);
      break;
    default:
      return null;
  }
};
