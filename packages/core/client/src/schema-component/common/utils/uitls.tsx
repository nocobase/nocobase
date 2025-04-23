/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { dayjs, getPickerFormat, Handlebars, getFormatFromDateStr } from '@nocobase/utils/client';
import _, { every, findIndex, some } from 'lodash';
import { replaceVariableValue } from '../../../block-provider/hooks';
import { VariableOption, VariablesContextType } from '../../../variables/types';
import { isVariable } from '../../../variables/utils/isVariable';
import { transformVariableValue } from '../../../variables/utils/transformVariableValue';
import { inferPickerType } from '../../antd/date-picker/util';

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

const parseVariableValue = async (targetVariable, variables, localVariables) => {
  const parsingResult = isVariable(targetVariable)
    ? [variables.parseVariable(targetVariable, localVariables).then(({ value }) => value)]
    : [targetVariable];

  try {
    const [value] = await Promise.all(parsingResult);
    return value;
  } catch (error) {
    console.error('Error in parseVariableValue:', error);
    throw error;
  }
};

export const conditionAnalyses = async (
  {
    ruleGroup,
    variables,
    localVariables,
    variableNameOfLeftCondition,
    conditionType,
  }: {
    ruleGroup;
    variables: VariablesContextType;
    localVariables: VariableOption[];
    variableNameOfLeftCondition?: string;
    conditionType?: 'advanced' | 'basic';
  },
  jsonLogic: any,
) => {
  const type = Object.keys(ruleGroup)[0] || '$and';
  const conditions = ruleGroup[type];

  const results = await Promise.all(
    conditions.map((condition) =>
      processCondition(condition, variables, localVariables, variableNameOfLeftCondition, conditionType, jsonLogic),
    ),
  );

  if (type === '$and') {
    return every(results, (v) => v);
  } else {
    if (results.length) {
      return some(results, (v) => v);
    }
    return true;
  }
};

const processCondition = async (
  condition,
  variables,
  localVariables,
  variableNameOfLeftCondition,
  conditionType,
  jsonLogic,
) => {
  if ('$and' in condition || '$or' in condition) {
    return await conditionAnalyses({ ruleGroup: condition, variables, localVariables, conditionType }, jsonLogic);
  }
  return conditionType === 'advanced'
    ? processAdvancedCondition(condition, variables, localVariables, jsonLogic)
    : processBasicCondition(condition, variables, localVariables, variableNameOfLeftCondition, jsonLogic);
};

const processAdvancedCondition = async (condition, variables, localVariables, jsonLogic) => {
  const operator = condition.op;
  const rightValue = await parseVariableValue(condition.rightVar, variables, localVariables);
  const leftValue = await parseVariableValue(condition.leftVar, variables, localVariables);
  if (operator) {
    return jsonLogic.apply({ [operator]: [leftValue, rightValue] });
  }
  return true;
};

const processBasicCondition = async (condition, variables, localVariables, variableNameOfLeftCondition, jsonLogic) => {
  const logicCalculation = getInnermostKeyAndValue(condition);
  const operator = logicCalculation?.key;
  if (!operator) return true;

  const targetVariableName = targetFieldToVariableString(getTargetField(condition), variableNameOfLeftCondition);
  const targetValue = variables
    .parseVariable(targetVariableName, localVariables, { doNotRequest: true })
    .then(({ value }) => value);

  const parsingResult = isVariable(logicCalculation?.value)
    ? [variables.parseVariable(logicCalculation?.value, localVariables).then(({ value }) => value), targetValue]
    : [logicCalculation?.value, targetValue];

  try {
    const [value, resolvedTargetValue] = await Promise.all(parsingResult);
    const targetCollectionField = await variables.getCollectionField(targetVariableName, localVariables);
    let currentInputValue = transformVariableValue(resolvedTargetValue, { targetCollectionField });
    const comparisonValue = transformVariableValue(value, { targetCollectionField });

    if (
      targetCollectionField?.type &&
      ['datetime', 'date', 'datetimeNoTz', 'dateOnly', 'unixTimestamp'].includes(targetCollectionField.type) &&
      currentInputValue
    ) {
      const picker = inferPickerType(comparisonValue);
      const format = getPickerFormat(picker);
      currentInputValue = dayjs(currentInputValue).format(format);
    }
    return jsonLogic.apply({ [operator]: [currentInputValue, comparisonValue] });
  } catch (error) {
    throw error;
  }
};

/**
 * 转化成变量字符串，方便解析出值
 * @param targetField
 * @returns
 */
function targetFieldToVariableString(targetField: string[], variableName = '$nForm') {
  // Action 中的联动规则虽然没有 form 上下文但是在这里也使用的是 `$nForm` 变量，这样实现更简单
  return `{{ ${variableName}.${targetField.join('.')} }}`;
}

const getVariablesData = (localVariables) => {
  const data = {};
  localVariables.map((v) => {
    data[v.name] = v.ctx;
  });
  return data;
};

export async function getRenderContent(templateEngine, content, variables, localVariables, defaultParse) {
  if (content && templateEngine === 'handlebars') {
    try {
      const renderedContent = Handlebars.compile(content);
      // 处理渲染后的内容
      const data = getVariablesData(localVariables);
      const { $nDate } = variables?.ctxRef?.current || {};
      const variableDate = {};
      Object.keys($nDate || {}).map((v) => {
        variableDate[v] = $nDate[v]();
      });
      const html = renderedContent({ ...variables?.ctxRef?.current, ...data, $nDate: variableDate });
      return await defaultParse(html);
    } catch (error) {
      if (!/VariablesProvider: .* is not found/.test(error.message)) {
        console.log(error);
      }
      return content;
    }
  } else {
    try {
      const html = await replaceVariableValue(content, variables, localVariables);
      return await defaultParse(html);
    } catch (error) {
      if (!/VariablesProvider: .* is not found/.test(error.message)) {
        console.log(error);
      }
      return content;
    }
  }
}
