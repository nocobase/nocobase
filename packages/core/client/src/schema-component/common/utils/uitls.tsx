import _, { every, findIndex, some } from 'lodash';
import { VariableOption, VariablesContextType } from '../../../variables/types';
import { isVariable } from '../../../variables/utils/isVariable';
import { transformVariableValue } from '../../../variables/utils/transformVariableValue';
import { getJsonLogic } from '../../common/utils/logic';

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

export const getTargetField = (obj) => {
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
  ruleGroup,
  variables,
  localVariables,
}: {
  ruleGroup;
  variables: VariablesContextType;
  localVariables: VariableOption[];
}) => {
  const type = Object.keys(ruleGroup)[0] || '$and';
  const conditions = ruleGroup[type];

  let results = conditions.map(async (condition) => {
    // fix https://nocobase.height.app/T-3152
    if ('$and' in condition || '$or' in condition) {
      return await conditionAnalyses({ ruleGroup: condition, variables, localVariables });
    }

    const jsonlogic = getInnermostKeyAndValue(condition);
    const operator = jsonlogic?.key;

    if (!operator) {
      return true;
    }

    const targetVariableName = targetFieldToVariableString(getTargetField(condition));
    const targetValue = variables.parseVariable(targetVariableName, localVariables);

    const parsingResult = isVariable(jsonlogic?.value)
      ? [variables.parseVariable(jsonlogic?.value, localVariables), targetValue]
      : [jsonlogic?.value, targetValue];

    try {
      const jsonLogic = getJsonLogic();
      const [value, targetValue] = await Promise.all(parsingResult);
      const targetCollectionField = await variables.getCollectionField(targetVariableName, localVariables);
      return jsonLogic.apply({
        [operator]: [
          transformVariableValue(targetValue, { targetCollectionField }),
          transformVariableValue(value, { targetCollectionField }),
        ],
      });
    } catch (error) {
      throw error;
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
export function targetFieldToVariableString(targetField: string[]) {
  // Action 中的联动规则虽然没有 form 上下文但是在这里也使用的是 `$nForm` 变量，这样实现更简单
  return `{{ $nForm.${targetField.join('.')} }}`;
}
