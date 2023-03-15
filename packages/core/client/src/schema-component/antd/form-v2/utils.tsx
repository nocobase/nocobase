import { last, get } from 'lodash';
import * as functions from '@formulajs/formulajs';
import { conditionAnalyse } from '../../common/utils/uitls';
import { ActionType } from '../../../schema-settings/LinkageRules/type';

function now() {
  return new Date();
}

const fnNames = Object.keys(functions).filter((key) => key !== 'default');
const fns = fnNames.map((key) => functions[key]);
function formula(expression: string, scope = {}) {
  try {
    const fn = new Function(...fnNames, ...Object.keys(scope), `return ${expression}`);
    const result = fn(...fns, ...Object.values(scope));
    if (typeof result === 'number') {
      if (Number.isNaN(result) || !Number.isFinite(result)) {
        return null;
      }
      return functions.ROUND(result, 9);
    }
    if (typeof result === 'function') {
      return result();
    }
    return result;
  } catch (error) {
    return undefined;
  }
}

export function evaluate(expression: string, scope = {}) {
  const mergeScope = { ...scope, now };
  const exp = expression.trim().replace(/{{\s*([^{}]+)\s*}}/g, (_, v) => {
    const item: any = get(scope, v);
    const key = v.replace(/\.(\d+)/g, '["$1"]');
    return ` ${typeof item === 'function' ? item() : key} `;
  });
  return formula(exp, mergeScope);
}
export const linkageMergeAction = ({ operator, value }, field, condition, values) => {
  const requiredResult = field?.linkageProperty?.required || [field?.initProperty?.required || false];
  const displayResult = field?.linkageProperty?.display || [field?.initProperty?.display];
  const patternResult = field?.linkageProperty?.pattern || [field?.initProperty?.pattern];
  const valueResult = field?.linkageProperty?.value || [field.value || field?.initProperty?.value];

  switch (operator) {
    case ActionType.Required:
      if (conditionAnalyse(condition, values)) {
        requiredResult.push(true);
      }
      field.linkageProperty = {
        ...field.linkageProperty,
        required: requiredResult,
      };
      field.required = last(field.linkageProperty?.required);
      break;
    case ActionType.InRequired:
      if (conditionAnalyse(condition, values)) {
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
      if (conditionAnalyse(condition, values)) {
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
      if (conditionAnalyse(condition, values)) {
        patternResult.push(operator);
      }
      field.linkageProperty = {
        ...field.linkageProperty,
        pattern: patternResult,
      };
      field.pattern = last(field.linkageProperty.pattern);
      break;
    case ActionType.Value:
      if (conditionAnalyse(condition, values)) {
        if (value?.mode === 'express') {
          const result = evaluate(value.result || value.value, values);
          valueResult.push(result);
        } else {
          valueResult.push(value?.value || value);
        }
      }
      field.linkageProperty = {
        ...field.linkageProperty,
        value: valueResult,
      };
      setTimeout(() => (field.value = last(valueResult) === undefined ? field.value : last(valueResult)));
      break;
    default:
      return null;
  }
};
