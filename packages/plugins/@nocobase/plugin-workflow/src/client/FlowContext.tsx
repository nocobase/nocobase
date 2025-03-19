/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext } from 'react';

export const FlowContext = React.createContext<any>({});

export function useFlowContext() {
  return useContext(FlowContext);
}

export const CurrentWorkflowContext = React.createContext<any>({});

export function useCurrentWorkflowContext() {
  return useContext(CurrentWorkflowContext);
}
