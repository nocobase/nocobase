import moment from 'dayjs';
import flat from 'flat';
import _, { every, findIndex, isArray, some } from 'lodash';
import { useMemo } from 'react';
import { useCurrentUserContext } from '../../../user';
import jsonLogic from '../../common/utils/logic';

type VariablesCtx = {
  /** 当前登录的用户 */
  $user: Record<string, any>;
  $date: Record<string, any>;
};

export const useVariablesCtx = (): VariablesCtx => {
  const { data } = useCurrentUserContext() || {};
  return useMemo(() => {
    return {
      $user: data?.data || {},
      $date: {
        now: () => moment().toISOString(),
      },
    };
  }, [data]);
};

export const isVariable = (str: unknown) => {
  if (typeof str !== 'string') {
    return false;
  }
  const regex = /{{(.*?)}}/;
  const matches = str?.match?.(regex);
  return matches ? true : false;
};

export const parseVariables = (str: string, ctx: VariablesCtx) => {
  const regex = /{{(.*?)}}/;
  const matches = str?.match?.(regex);
  if (matches) {
    const result = _.get(ctx, matches[1]);
    return _.isFunction(result) ? result() : result;
  } else {
    return str;
  }
};

export function getInnermostKeyAndValue(obj) {
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

const getFieldValue = (fieldPath, values) => {
  const v = fieldPath[0];
  const h = fieldPath[1];
  const regex = new RegExp('^' + v + '\\..+\\.' + h + '$'); // 构建匹配的正则表达式
  const matchedValues = [];
  const data = flat.flatten(values, { maxDepth: 3 });
  for (const key in data) {
    if (regex.test(key)) {
      matchedValues.push(data[key]);
    }
  }
  return matchedValues;
};

const getValue = (str: string, values) => {
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
  const targetField = match?.[1]?.split('.') || [];
  const isArrayField = isArray(values[targetField[0]]);
  if (isArrayField && targetField.length > 1) {
    //对多关系字段
    return getFieldValue(targetField, values);
  } else {
    return flat(values)[match?.[1]];
  }
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
      const isArrayField = isArray(values[targetField[0]]);
      if (isArrayField && targetField.length > 1) {
        //对多关系字段比较
        const currentValue = getFieldValue(targetField, values);
        const result = jsonLogic.apply({ [operator]: [currentValue, value] });
        return result;
      } else {
        const currentValue = targetField.length > 1 ? flat(values)?.[targetField.join('.')] : values?.[targetField[0]];
        const result = jsonLogic.apply({ [operator]: [currentValue, value] });
        return result;
      }
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
