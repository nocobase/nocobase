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
interface VariableContextValue {
  value: any;
}

interface VariableProviderProps {
  variableName: string;
  children: React.ReactNode;
}

const VariableContext = createContext<VariableContextValue>({ value: null });

export const useVariable = () => {
  const context = useContext(VariableContext);
  if (!context) {
    throw new Error('useVariable must be used within a VariableProvider');
  }
  return context;
};

export const VariableProvider: React.FC<VariableProviderProps> = ({ variableName, children }) => {
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

  return <VariableContext.Provider value={{ value }}>{children}</VariableContext.Provider>;
};
