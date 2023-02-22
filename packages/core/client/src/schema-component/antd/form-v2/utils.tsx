import { last } from 'lodash';
import * as formulajs from '@formulajs/formulajs';
import { conditionAnalyse } from '../../common/utils/uitls';
import { ActionType } from '../../../schema-settings/LinkageRules/type';

function now() {
  return new Date();
}
export function evaluate(exp: string, scope = {}) {
  const mergeScope = { ...scope, now };
  const expression: any = exp.replace(/{{([^}]+)}}/g, (match, i) => {
    return mergeScope[i.trim()] || null;
  });
  try {
    const fn = new Function(...Object.keys(formulajs), ...Object.keys(mergeScope), `return ${expression}`);
    return fn(...Object.values(formulajs), ...Object.values(mergeScope));
  } catch (error) {
    return () => expression;
  }
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
          const result = evaluate(value.result || value.value, values);
          valueResult.push(typeof result === 'function' ? result() : result === Infinity ? null : result);
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
