import { conditionAnalyse } from '../../common/utils/uitls';
import { last } from 'lodash';
import { ActionType } from '../../../schema-settings/LinkageRules/type';
import * as formulajs from '@formulajs/formulajs';

export function evaluate(exp: string, scope = {}) {
  const expression =
    Object.keys(scope).length > 0
      ? exp.replace(/{{([^}]+)}}/g, (match, i) => {
          return scope[i.trim()] || null;
        })
      : '';
  const fn = new Function(...Object.keys(formulajs), ...Object.keys(scope), `return ${expression}`);
  return fn(...Object.values(formulajs), ...Object.values(scope));
}

export const linkageMergeAction = ({ operator, value }, field, linkageRuleCondition, values) => {
  const requiredResult = field?.linkageProperty?.required || [field?.initProperty?.required];
  const displayResult = field?.linkageProperty?.display || [field?.initProperty?.display];
  const patternResult = field?.linkageProperty?.pattern || [field?.initProperty?.pattern];
  const valueResult = field?.linkageProperty?.value || [field?.initProperty?.value];
  switch (operator) {
    case ActionType.Required:
      if (conditionAnalyse(linkageRuleCondition, values)) {
        requiredResult.push(true);
      }
      field.linkageProperty = {
        ...field.linkageProperty,
        required: requiredResult,
      };
      field.required = last(field.linkageProperty?.required);
      break;
    case ActionType.InRequired:
      if (conditionAnalyse(linkageRuleCondition, values)) {
        requiredResult.push(false);
      }
      field.linkageProperty = {
        ...field.linkageProperty,
        required: requiredResult,
      };
      field.required = last(field.linkageProperty?.required);
      break;
    case ActionType.Visible:
    case ActionType.None:
    case ActionType.Hidden:
      if (conditionAnalyse(linkageRuleCondition, values)) {
        displayResult.push(operator);
      }
      field.linkageProperty = {
        ...field.linkageProperty,
        display: displayResult,
      };
      field.display = last(field.linkageProperty?.display);
      break;
    case ActionType.Editable:
    case ActionType.ReadOnly:
    case ActionType.ReadPretty:
      if (conditionAnalyse(linkageRuleCondition, values)) {
        patternResult.push(operator);
      }
      field.linkageProperty = {
        ...field.linkageProperty,
        pattern: patternResult,
      };
      field.pattern = last(field.linkageProperty.pattern);
      break;
    case ActionType.Value:
      if (conditionAnalyse(linkageRuleCondition, values)) {
        if (value.mode === 'express') {
          valueResult.push(evaluate(value.result || value.value, values));
        } else {
          valueResult.push(value?.value || value);
        }
      }
      field.linkageProperty = {
        ...field.linkageProperty,
        value: valueResult,
      };
      field.value = last(field.linkageProperty.value);
      break;
    default:
      return null;
  }
};
