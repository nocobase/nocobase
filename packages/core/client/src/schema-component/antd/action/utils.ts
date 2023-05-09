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

export const formatParamsIntoObject = (object: { key: string; value: string }[]) => {
  return object.reduce((prev, curr) => {
    prev[curr?.key] = curr.value;
    return prev;
  }, {});
};

export const findTableOrFormBlockProviderByActionFieldSchema = (fieldSchema: Schema) => {
  let targetSchema = fieldSchema;
  let targetBlockName = '';
  if (targetSchema['x-action'] === 'customize:table:request') {
    targetBlockName = 'TableBlockProvider';
  } else if (targetSchema['x-action'] === 'customize:form:request') {
    targetBlockName = 'FormBlockProvider';
  }
  while (targetBlockName && targetSchema && targetSchema?.['x-decorator'] !== targetBlockName) {
    targetSchema = targetSchema?.parent;
  }
  return targetSchema;
};
