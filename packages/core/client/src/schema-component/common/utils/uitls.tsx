/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { dayjs, getPickerFormat, Handlebars } from '@nocobase/utils/client';
import _, { every, findIndex, some } from 'lodash';
import { replaceVariableValue } from '../../../block-provider/hooks';
import { VariableOption, VariablesContextType } from '../../../variables/types';
import { isVariable } from '../../../variables/utils/isVariable';
import { transformVariableValue } from '../../../variables/utils/transformVariableValue';
import { inferPickerType } from '../../antd/date-picker/util';
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
  variableNameOfLeftCondition,
}: {
  ruleGroup;
  variables: VariablesContextType;
  localVariables: VariableOption[];
  /**
   * used to parse the variable name of the left condition value
   * @default '$nForm'
   */
  variableNameOfLeftCondition?: string;
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

    const targetVariableName = targetFieldToVariableString(getTargetField(condition), variableNameOfLeftCondition);
    const targetValue = variables
      .parseVariable(targetVariableName, localVariables, {
        doNotRequest: true,
      })
      .then(({ value }) => value);

    const parsingResult = isVariable(jsonlogic?.value)
      ? [variables.parseVariable(jsonlogic?.value, localVariables).then(({ value }) => value), targetValue]
      : [jsonlogic?.value, targetValue];

    try {
      const jsonLogic = getJsonLogic();
      const [value, targetValue] = await Promise.all(parsingResult);
      const targetCollectionField = await variables.getCollectionField(targetVariableName, localVariables);
      let currentInputValue = transformVariableValue(targetValue, { targetCollectionField });
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

      return jsonLogic.apply({
        [operator]: [currentInputValue, comparisonValue],
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
export function targetFieldToVariableString(targetField: string[], variableName = '$nForm') {
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
      console.log(error);
      return content;
    }
  } else {
    try {
      const html = await replaceVariableValue(content, variables, localVariables);
      return await defaultParse(html);
    } catch (error) {
      return content;
    }
  }
}
