/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEffect, useState } from 'react';
import { VariableOption, VariablesContextType } from '../../variables/types';
import { conditionAnalyses } from '../../schema-component/common/utils/uitls';
import { useApp } from '../../application';
import { useCollectionRecord } from '../../data-source';

enum ActionType {
  Visible = 'visible',
  Hidden = 'hidden',
}

const linkageAction = async (
  {
    operator,
    condition,
    variables,
    localVariables,
    conditionType,
    displayResult,
  }: {
    operator;
    condition;
    variables: VariablesContextType;
    localVariables: VariableOption[];
    conditionType: 'advanced';
    displayResult: any[];
  },
  jsonLogic: any,
) => {
  switch (operator) {
    case ActionType.Visible:
      if (await conditionAnalyses({ ruleGroup: condition, variables, localVariables, conditionType }, jsonLogic)) {
        displayResult.push(ActionType.Visible);
      }
      return displayResult;
    case ActionType.Hidden:
      if (await conditionAnalyses({ ruleGroup: condition, variables, localVariables, conditionType }, jsonLogic)) {
        displayResult.push(ActionType.Hidden);
      }
      return displayResult;
    default:
      return null;
  }
};

export const useReactiveLinkageEffect = (
  linkageRules: any[],
  variables: VariablesContextType,
  localVariables: VariableOption[],
  triggerLinkageUpdate,
) => {
  const app = useApp();
  const jsonLogic = app.jsonLogic;
  const [displayResult, setDisplayResult] = useState<string[] | null>(null);
  const record = useCollectionRecord();
  useEffect(() => {
    const runLinkages = async () => {
      const result: string[] = [];

      for (const rule of linkageRules.filter((r) => !r.disabled)) {
        for (const action of rule.actions || []) {
          await linkageAction(
            {
              operator: action.operator,
              condition: rule.condition,
              variables,
              localVariables,
              conditionType: rule.conditionType,
              displayResult: result,
            },
            jsonLogic,
          );
        }
      }
      setDisplayResult(result);
    };

    runLinkages();
  }, [linkageRules, triggerLinkageUpdate, record]);

  return displayResult;
};
