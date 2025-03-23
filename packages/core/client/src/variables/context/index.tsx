/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DateVariableContext } from '../date';
import { useImmer } from 'use-immer';
import { Updater } from 'use-immer';
import React, { createContext, useContext } from 'react';
import merge from 'lodash/merge';

type VariablesEvalContextType = {
  $dateV2: DateVariableContext;
};

type VariablesContextType = {
  vairableEvalContext: VariablesEvalContextType;
  setVariableEvalContext: Updater<VariablesEvalContextType>;
};
const VariablesContext = createContext<VariablesContextType | null>(null);

export const VariablesContextProvider = ({
  children,
  variablesCtx: variablesCtxProp,
}: {
  children: React.ReactNode;
  variablesCtx: Partial<VariablesEvalContextType>;
}) => {
  const clientTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const defaultVariablesCtx: VariablesEvalContextType = {
    $dateV2: {
      timezone: clientTZ,
      rangeConverter: 'start',
    },
  };
  const mergedVariablesCtx = merge(defaultVariablesCtx, variablesCtxProp);
  const [vairableEvalContext, setVariableEvalContext] = useImmer<VariablesEvalContextType>(mergedVariablesCtx);

  return (
    <VariablesContext.Provider value={{ vairableEvalContext, setVariableEvalContext }}>
      {children}
    </VariablesContext.Provider>
  );
};

export const useVariablesContext = () => {
  const variablesCtx = useContext(VariablesContext);
  if (!variablesCtx) {
    throw new Error('useVariablesContext must be used within a VariablesContextProvider');
  }
  return variablesCtx;
};
