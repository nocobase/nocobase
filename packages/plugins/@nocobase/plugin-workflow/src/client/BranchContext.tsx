/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useContext } from 'react';

export type BranchContextValue = {
  branchIndex: number | null;
  addable: boolean;
  syncOnly: boolean;
};

export const BranchContext = createContext<BranchContextValue | null>(null);

export function useBranchContext() {
  return useContext(BranchContext);
}

export function useBranchIndex() {
  return useBranchContext()?.branchIndex ?? null;
}

export function useBranchSyncOnly() {
  return useBranchContext()?.syncOnly ?? false;
}
