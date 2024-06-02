/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionType } from './type';
import { InputModeType } from './ValueDynamicComponent';
import { conditionAnalyses } from '../../schema-component/common/utils/uitls';
const getActionValue = (operator, value) => {
  const getValueByMode = (value) => {
    const mode = value?.mode as InputModeType;
    if (mode === 'constant') {
      return value.value;
    } else return null;
  };
  switch (true) {
    case [ActionType.Color, ActionType.BackgroundColor].includes(operator):
      return getValueByMode(value);
    default:
      return null;
      break;
  }
};

const getSatisfiedActions = async ({ rules, variables, localVariables }) => {
  const satisfiedRules = (
    await Promise.all(
      rules
        .filter((k) => !k.disabled)
        .map(async (rule) => {
          if (await conditionAnalyses({ ruleGroup: rule.condition, variables, localVariables })) {
            return rule;
          } else return null;
        }),
    )
  ).filter(Boolean);
  return satisfiedRules.map((rule) => rule.actions).flat();
};

const getSatisfiedValues = async ({ rules, variables, localVariables }) => {
  return (await getSatisfiedActions({ rules, variables, localVariables })).map((action) => ({
    ...action,
    value: getActionValue(action.operator, action.value),
  }));
};

export const getSatisfiedValueMap = async ({ rules, variables, localVariables }) => {
  const values = await getSatisfiedValues({ rules, variables, localVariables });
  const valueMap = values.reduce((a, v) => ({ ...a, [v.operator]: v.value }), {});
  return valueMap;
};
