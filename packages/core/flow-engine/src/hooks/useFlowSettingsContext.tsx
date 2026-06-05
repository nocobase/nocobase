/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useContext } from 'react';
import { FlowRuntimeContext } from '../flowContext';
import { FlowContextProvider } from '../FlowContextProvider';
import { FlowModel } from '../models';

const FlowSettingsContext = createContext<FlowRuntimeContext<FlowModel<any>> | null>(null);

export const FlowSettingsContextProvider = ({ value, children }) => {
  return (
    <FlowContextProvider context={value}>
      <FlowSettingsContext.Provider value={value}>{children}</FlowSettingsContext.Provider>
    </FlowContextProvider>
  );
};

/**
 * Hook to access the flow settings context
 * @returns {FlowRuntimeContext} The flow runtime context in settings mode
 */
export const useFlowSettingsContext = <
  TModel extends FlowModel<any> = FlowModel<any>,
>(): FlowRuntimeContext<TModel> => {
  const context = useContext(FlowSettingsContext);
  if (!context) {
    throw new Error('useFlowSettingsContext must be used within a FlowSettingsContextProvider');
  }
  return context as FlowRuntimeContext<TModel>;
};
