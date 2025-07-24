/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createContext, useContext } from 'react';
import { FlowRuntimeContext } from '../flowContext';
import { FlowModel } from '../models';

const FlowSettingsContext = createContext<FlowRuntimeContext<FlowModel<any>> | null>(null);

export const FlowSettingsContextProvider = FlowSettingsContext.Provider;

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
