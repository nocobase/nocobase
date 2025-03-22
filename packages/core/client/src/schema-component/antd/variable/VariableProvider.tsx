/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isArray } from 'lodash';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocalVariables, useVariables } from '../../../variables';
import { useHelperObservables } from './Helpers/hooks/useHelperObservables';
interface VariableContextValue {
  value: any;
  helperObservables?: ReturnType<typeof useHelperObservables>;
}

interface VariableProviderProps {
  variableName: string;
  children: React.ReactNode;
  variableHelperMapping?: VariableHelperMapping;
  helperObservables?: ReturnType<typeof useHelperObservables>;
}

export interface VariableHelperRule {
  /** Pattern to match variables, supports glob patterns */
  variables: string;
  /** Array of allowed filter patterns, supports glob patterns */
  filters: string[];
}

export interface VariableHelperMapping {
  /** Array of rules defining which filters are allowed for which variables */
  rules: VariableHelperRule[];
  /** Optional flag to determine if unlisted combinations should be allowed */
  strictMode?: boolean;
}

const VariableContext = createContext<VariableContextValue>({ value: null });

export function useCurrentVariable(): VariableContextValue {
  const context = useContext(VariableContext);
  if (!context) {
    throw new Error('useCurrentVariable must be used within a VariableProvider');
  }
  return context;
}

export const VariableProvider: React.FC<VariableProviderProps> = ({ variableName, children, helperObservables }) => {
  const [value, setValue] = useState();
  const variables = useVariables();
  const localVariables = useLocalVariables();
  isArray(localVariables) ? localVariables : [localVariables];
  useEffect(() => {
    async function fetchValue() {
      const result = await variables.getVariableValue(variableName, localVariables);
      setValue(result.value);
    }
    fetchValue();
  }, [localVariables, variableName, variables]);

  return <VariableContext.Provider value={{ value, helperObservables }}>{children}</VariableContext.Provider>;
};
