/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Per-branch context for the modern canvas (doc §9.6): carries the branch index
 * and whether the branch accepts added nodes. A second copy of v1
 * `BranchContext` (v2 canvas keeps its own; both are trivial).
 */

import React, { useContext } from 'react';

export type BranchContextValue = {
  branchIndex: number | null;
  addable: boolean;
};

export const BranchContext = React.createContext<BranchContextValue>({ branchIndex: null, addable: true });

export function useBranchContext() {
  return useContext(BranchContext);
}
