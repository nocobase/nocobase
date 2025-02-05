/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isFunction } from 'lodash';
import { useMemo } from 'react';
import { useApp } from './';
import { VariableOption } from '../../variables/types';

export const useGlobalVariable = (key: string) => {
  const app = useApp();
  const variable = useMemo(() => {
    return app.getGlobalVar(key);
  }, [app, key]);

  if (isFunction(variable)) {
    try {
      return variable();
    } catch (error) {
      console.error(`Error calling global variable function for key: ${key}`, error);
      return undefined;
    }
  }

  return variable;
};

export const useGlobalVariables = () => {
  const app = useApp();

  const result = useMemo(() => {
    const variables = app.getGlobalVars();
    const uniqueValues = new Set();

    Object.entries(variables).forEach(([key, value]) => {
      if (!value) return;

      if (isFunction(value)) {
        try {
          uniqueValues.add(value());
        } catch (error) {
          console.error(`Error calling global variable function for key: ${key}`, error);
        }
      } else {
        uniqueValues.add(value);
      }
    });

    return [...uniqueValues];
  }, [app]);

  return result as any;
};

//获取全局变量的值
export const useGlobalVariablesCtx = () => {
  const app = useApp();
  const variablesCtx = app.getGlobalVarsCtx();
  const uniqueValues = new Set();
  Object.entries(variablesCtx).forEach(([key, value]) => {
    if (!value) return;
    uniqueValues.add({
      name: key,
      ctx: value,
    });
  });

  return [...uniqueValues] as VariableOption[];
};
