import { evaluators } from '@nocobase/evaluators/client';
import { cloneDeep, last } from 'lodash';
import { ActionType } from '../../../schema-settings/LinkageRules/type';
import { conditionAnalyse } from '../../common/utils/uitls';

export const linkageMergeAction = ({ operator, value }, field, condition, values) => {
  const requiredResult = field?.linkageProperty?.required || [field?.initProperty?.required || false];
  const displayResult = field?.linkageProperty?.display || [field?.initProperty?.display];
  const patternResult = field?.linkageProperty?.pattern || [field?.initProperty?.pattern];
  const valueResult = field?.linkageProperty?.value || [field.value || field?.initProperty?.value];
  const { evaluate } = evaluators.get('formula.js');

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
          const scope = cloneDeep(values);
          try {
            const result = evaluate(value.result || value.value, { ...scope, now: () => new Date().toString() });
            valueResult.push(result);
          } catch (error) {
            console.log(error);
          }
        } else if (value?.mode === 'constant') {
          valueResult.push(value?.value || value);
        } else {
          valueResult.push(null);
        }
      }
      field.linkageProperty = {
        ...field.linkageProperty,
        value: valueResult,
      };
      field.value = last(valueResult) === undefined ? field.value : last(valueResult);
      break;
    default:
      return null;
  }
};
