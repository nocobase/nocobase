import flat from 'flat';
import _, { every, findIndex, some } from 'lodash';
import { VariableOption, VariablesContextType } from '../../../variables/types';
import { isVariable } from '../../../variables/utils/isVariable';
import jsonLogic from '../../common/utils/logic';

type VariablesCtx = {
  /** 当前登录的用户 */
  $user?: Record<string, any>;
  $date?: Record<string, any>;
  $form?: Record<string, any>;
};

export const parseVariables = (str: string, ctx: VariablesCtx | any) => {
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

export const conditionAnalyses = async ({
  rules,
  formValues,
  variables,
  localVariables,
}: {
  rules;
  formValues;
  variables: VariablesContextType;
  localVariables: VariableOption[];
}) => {
  const type = Object.keys(rules)[0] || '$and';
  const conditions = rules[type];
  localVariables = localVariables.map((variable) => {
    if (variable.name === '$form') {
      return {
        ...variable,
        ctx: formValues,
      };
    }
    return variable;
  });

  let results = conditions.map(async (c) => {
    const jsonlogic = getInnermostKeyAndValue(c);
    const operator = jsonlogic?.key;
    const targetVariableName = targetFieldToVariableString(getTargetField(c));

    if (!operator) {
      return true;
    }

    const parsingResult = isVariable(jsonlogic?.value)
      ? [
          variables?.parseVariable(jsonlogic?.value, localVariables),
          variables?.parseVariable(targetVariableName, localVariables),
        ]
      : [jsonlogic?.value, variables?.parseVariable(targetVariableName, localVariables)];

    try {
      const [value, targetValue] = await Promise.all(parsingResult);
      return jsonLogic.apply({ [operator]: [targetValue, value] });
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        throw error;
      }
    }
  });
  results = await Promise.all(results);

  if (type === '$and') {
    return every(results, (v) => v);
  } else {
    return some(results, (v) => v);
  }
};

/**
 * 转化成变量字符串，方便解析出值
 * @param targetField
 * @returns
 */
function targetFieldToVariableString(targetField: string[]) {
  return `{{ $form.${targetField.join('.')} }}`;
}
