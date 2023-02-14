import { every, some } from 'lodash';
import jsonLogic from './logic';
export const conditionAnalysis = (rules, form) => {
  const type = Object.keys(rules)[0] || '$and';
  const conditions = rules[type];
  const results = conditions.map((c) => {
    const operator = jsonLogic.get_operator(jsonLogic.get_values(c));
    const targetField = jsonLogic.get_operator(c);
    const value = jsonLogic.get_values(c)[operator];
    const result = jsonLogic.apply({ [operator]: [form.values?.[targetField], value] });
    return result;
  });
  if (type === '$and') {
    return every(results, (v) => v);
  } else {
    return some(results, (v) => v);
  }
};

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

export const linkageAction = (operator, field, linkageRuleCondition, form) => {
  switch (operator) {
    case 'required':
    case 'inRequired':
      field.required = conditionAnalysis(linkageRuleCondition, form);
      break;
    case 'visible':
    case 'hidden':
    case 'none':
      field.display = conditionAnalysis(linkageRuleCondition, form) ? operator : getReverseOperator(operator);
      break;
    case 'editable':
    case 'readOnly':
    case 'readPretty':
      field['x-pattern'] = conditionAnalysis(linkageRuleCondition, form) ? operator : getReverseOperator(operator);
      break;
    default:
      return null;
  }
};
