import { every, some, get } from 'lodash';
import flat from 'flat';
import jsonLogic from '../../common/utils/logic';

function getDeepestProperty(obj) {
  let deepest = {
    operator: null,
    value: null,
  };
  let deepestLevel = 0;
  function traverse(obj, level) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'object') {
          traverse(obj[key], level + 1);
        } else {
          if (level > deepestLevel) {
            deepestLevel = level;
            deepest.operator = key;
            deepest.value = obj[key];
          }
        }
      }
    }
  }
  traverse(obj, 1);
  return deepest;
}
const getValue = (str, values) => {
  const regex = /{{(.*?)}}/;
  const matches = str?.match?.(regex);
  if (matches) {
    return getVariableValue(str, values);
  } else {
    return str;
  }
};
const getVariableValue = (str, values) => {
  const regex = /{{[^.]+\.([^}]+)}}/;
  const match = regex.exec(str);
  return values[match?.[1]];
};

export const conditionAnalyse = (rules, values) => {
  const type = Object.keys(rules)[0] || '$and';
  const conditions = rules[type];
  const results = conditions.map((c) => {
    const jsonlogic = getDeepestProperty(c);
    const operator = jsonlogic.operator;
    const value = getValue(jsonlogic.value, values);
    const targetField = Object.keys(flat(c))[0]?.replace?.(`.${operator}`, '');
    if (!operator) {
      return true;
    }
    try {
      const result = jsonLogic.apply({ [operator]: [flat(values)?.[targetField], value] });
      return result;
    } catch (error) {
      console.error(error);
    }
  });
  if (type === '$and') {
    return every(results, (v) => v);
  } else {
    return some(results, (v) => v);
  }
};
