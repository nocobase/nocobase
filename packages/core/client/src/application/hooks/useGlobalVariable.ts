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

export const useGlobalVariableCtx = (key: string) => {
  const app = useApp();

  const variable = useMemo(() => {
    return app?.getGlobalVarCtx?.(key);
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
