import { conditionAnalyse } from '../../common/utils/uitls';
export const getReverseOperator = (operator) => {
  switch (operator) {
    case 'visible':
      return 'hidden';
    case 'hidden':
    case 'none':
      return 'visible';
    case 'editable':
      return 'readOnly';
    case 'readOnly':
    case 'readPretty':
      return 'editable';
    case 'required':
      return false;
    case 'inRequired':
      return true;
    default:
      return '';
  }
};

export const linkageAction = ({ operator, value }, field, linkageRuleCondition, values) => {
  switch (operator) {
    case 'required':
      field.required = conditionAnalyse(linkageRuleCondition, values);
      break;
    case 'inRequired':
      field.required = !conditionAnalyse(linkageRuleCondition, values);
      break;
    case 'visible':
    case 'none':
    case 'hidden':
      field.display = conditionAnalyse(linkageRuleCondition, values) ? operator : getReverseOperator(operator);
      break;
    case 'editable':
    case 'readOnly':
    case 'readPretty':
      field.pattern = conditionAnalyse(linkageRuleCondition, values) ? operator : getReverseOperator(operator);
      break;
    case 'value':
      field.value = conditionAnalyse(linkageRuleCondition, values) ? value : field.value || field.initialValue;
      break;
    default:
      return null;
  }
};
