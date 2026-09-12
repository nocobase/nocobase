/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useContext } from 'react';
import { getWorkflowSingleton } from '../utils/contextSingleton';

export type BranchNodeRenderer = React.ComponentType<{ data: any }>;

export const BranchRenderContext = getWorkflowSingleton('BranchRenderContext', () =>
  createContext<BranchNodeRenderer | null>(null),
);

export function useBranchNodeRenderer() {
  return useContext(BranchRenderContext);
}
