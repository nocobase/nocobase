import { conditionAnalyse } from '../../common/utils/uitls';
import { last } from 'lodash';

export const linkageMergeAction = ({ operator, value }, field, linkageRuleCondition, values) => {
  const requiredResult = field?.linkageProperty?.required || [field?.initProperty?.required];
  const displayResult = field?.linkageProperty?.display || [field?.initProperty?.display];
  const patternResult = field?.linkageProperty?.pattern || [field?.initProperty?.pattern];
  const valueResult = field?.linkageProperty?.value || [field?.initProperty?.value];
  switch (operator) {
    case 'required':
      if (conditionAnalyse(linkageRuleCondition, values)) {
        requiredResult.push(true);
      }
      field.linkageProperty = {
        ...field.linkageProperty,
        required: requiredResult,
      };
      console.log(field.linkageProperty?.required);
      field.required = last(field.linkageProperty?.required);
      break;
    case 'inRequired':
      if (conditionAnalyse(linkageRuleCondition, values)) {
        requiredResult.push(false);
      }
      field.linkageProperty = {
        ...field.linkageProperty,
        required: requiredResult,
      };
      field.required = last(field.linkageProperty?.required);
      break;
    case 'visible':
    case 'none':
    case 'hidden':
      if (conditionAnalyse(linkageRuleCondition, values)) {
        displayResult.push(operator);
      }
      field.linkageProperty = {
        ...field.linkageProperty,
        display: displayResult,
      };
      field.display = last(field.linkageProperty?.display);
      break;
    case 'editable':
    case 'readOnly':
    case 'readPretty':
      if (conditionAnalyse(linkageRuleCondition, values)) {
        patternResult.push(operator);
      }
      field.linkageProperty = {
        ...field.linkageProperty,
        pattern: patternResult,
      };
      field.pattern = last(patternResult);
      break;
    case 'value':
      if (conditionAnalyse(linkageRuleCondition, values)) {
        valueResult.push(value);
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
