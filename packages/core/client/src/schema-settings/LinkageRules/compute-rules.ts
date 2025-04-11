/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { conditionAnalyses } from '../../schema-component/common/utils/uitls';
import { ActionType } from './type';
import { InputModeType } from './ValueDynamicComponent';
const getActionValue = (operator, value) => {
  const getValueByMode = (value) => {
    const mode = value?.mode as InputModeType;
    if (mode === 'constant') {
      return value.value;
    } else return null;
  };
  switch (true) {
    case [
      ActionType.Color,
      ActionType.BackgroundColor,
      ActionType.TextAlign,
      ActionType.FontSize,
      ActionType.FontWeight,
      ActionType.FontStyle,
    ].includes(operator):
      return getValueByMode(value);
    default:
      return null;
  }
};

const getSatisfiedActions = async ({ rules, variables, localVariables }, jsonLogic) => {
  const satisfiedRules = (
    await Promise.all(
      rules
        .filter((k) => !k.disabled)
        .map(async (rule) => {
          if (
            await conditionAnalyses(
              { ruleGroup: rule.condition, variables, localVariables, conditionType: rule.conditionType },
              jsonLogic,
            )
          ) {
            return rule;
          } else return null;
        }),
    )
  ).filter(Boolean);
  return satisfiedRules.map((rule) => rule.actions).flat();
};

const getSatisfiedValues = async ({ rules, variables, localVariables }, jsonLogic) => {
  return (await getSatisfiedActions({ rules, variables, localVariables }, jsonLogic)).map((action) => ({
    ...action,
    value: getActionValue(action.operator, action.value),
  }));
};

export const getSatisfiedValueMap = async ({ rules, variables, localVariables }, jsonLogic) => {
  const values = await getSatisfiedValues({ rules, variables, localVariables }, jsonLogic);
  const valueMap = values.reduce((a, v) => ({ ...a, [v.operator]: v.value }), {});
  return valueMap;
};
