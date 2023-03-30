import { every, some, findIndex } from 'lodash';
import flat from 'flat';
import jsonLogic from '../../common/utils/logic';

function getInnermostKeyAndValue(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return null;
  }
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (Object.prototype.toString.call(obj[key]) === '[object Object]' && obj[key] !== null) {
        return getInnermostKeyAndValue(obj[key]);
      } else {
        return { key, value: obj[key] };
      }
    }
  }
  return null;
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
const getTargetField = (obj) => {
  const keys = getAllKeys(obj);
  const index = findIndex(keys, (key, index, keys) => {
    if (key.includes('$') && index > 0) {
      return true;
    }
  });
  const result = keys.slice(0, index);
  return result;
};

function getAllKeys(obj) {
  const keys = [];
  function traverse(o) {
    Object.keys(o)
      .sort()
      .forEach(function (key) {
        keys.push(key);
        if (o[key] && typeof o[key] === 'object') {
          traverse(o[key]);
        }
      });
  }
  traverse(obj);
  return keys;
}

export const conditionAnalyse = (rules, values) => {
  const type = Object.keys(rules)[0] || '$and';
  const conditions = rules[type];
  const results = conditions.map((c) => {
    const jsonlogic = getInnermostKeyAndValue(c);
    const operator = jsonlogic?.key;
    const value = getValue(jsonlogic?.value, values);
    const targetField = getTargetField(c);
    if (!operator) {
      return true;
    }
    try {
      const currentValue = targetField.length > 1 ? flat(values)?.[targetField.join('.')] : values?.[targetField[0]];
      const result = jsonLogic.apply({ [operator]: [currentValue, value] });
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
