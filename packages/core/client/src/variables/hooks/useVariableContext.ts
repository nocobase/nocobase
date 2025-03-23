/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCallback } from 'react';
import { useVariables } from './useVariables';
import { VariableOption } from '../types';

export function useVariableContext() {
  const { registerVariable, getVariable } = useVariables();

  /**
   * 注册一个带上下文的变量
   * @param variableOption 变量配置
   */
  const registerVariableWithContext = useCallback(
    (variableOption: VariableOption) => {
      registerVariable(variableOption);
    },
    [registerVariable],
  );

  /**
   * 获取变量的上下文配置
   * @param variableName 变量名称
   */
  const getVariableContext = useCallback(
    (variableName: string) => {
      const variable = getVariable(variableName);
      return variable?.variableContext;
    },
    [getVariable],
  );

  /**
   * 更新变量的上下文配置
   * @param variableName 变量名称
   * @param context 新的上下文配置
   */
  const updateVariableContext = useCallback(
    (variableName: string, context: VariableOption['variableContext']) => {
      const variable = getVariable(variableName);
      if (!variable) return;

      registerVariable({
        ...variable,
        variableContext: context,
      });
    },
    [getVariable, registerVariable],
  );

  return {
    registerVariableWithContext,
    getVariableContext,
    updateVariableContext,
  };
}
