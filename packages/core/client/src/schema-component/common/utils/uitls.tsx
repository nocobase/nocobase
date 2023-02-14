import { every, some } from 'lodash';
import jsonLogic from '../../common/utils/logic';
export const conditionAnalyse = (rules, values) => {
  const type = Object.keys(rules)[0] || '$and';
  const conditions = rules[type];
  const results = conditions.map((c) => {
    const operator = jsonLogic.get_operator(jsonLogic.get_values(c));
    const targetField = jsonLogic.get_operator(c);
    const value = jsonLogic.get_values(c)[operator];
    const result = jsonLogic.apply({ [operator]: [values?.[targetField], value] });
    return result;
  });
  if (type === '$and') {
    return every(results, (v) => v);
  } else {
    return some(results, (v) => v);
  }
};