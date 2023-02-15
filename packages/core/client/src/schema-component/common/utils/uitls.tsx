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

export const conditionAnalyse = (rules, values) => {
  const type = Object.keys(rules)[0] || '$and';
  const conditions = rules[type];
  const results = conditions.map((c) => {
    const jsonlogic = getDeepestProperty(c);
    const operator = jsonlogic.operator;
    const value = jsonlogic.value;
    const targetField = Object.keys(flat(c))[0].replace(`.${operator}`, '');
    const result = jsonLogic.apply({ [operator]: [flat(values)?.[targetField], value] });
    return result;
  });
  if (type === '$and') {
    return every(results, (v) => v);
  } else {
    return some(results, (v) => v);
  }
};
