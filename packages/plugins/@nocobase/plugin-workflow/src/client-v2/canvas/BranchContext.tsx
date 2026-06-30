/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Per-branch context, shared by BOTH canvases (ADR-0003). Carries the branch
 * index, whether the branch accepts added nodes, and whether the branch is
 * sync-only. Zero dependencies (bare `React.createContext`, no runtime hooks),
 * so — like `NodeContext` — a single definition serves both runtimes: v1
 * re-exports it from here via the allowed `v1 → v2` import direction. Each
 * canvas's own `Branch` component supplies the value; `syncOnly` is optional, so
 * the modern canvas (which doesn't set it) is unaffected.
 */

import React, { useContext } from 'react';
import { getWorkflowSingleton } from '../contextSingleton';

export type BranchContextValue = {
  branchIndex: number | null;
  addable: boolean;
  /** Whether the branch is restricted to synchronous nodes. Optional — only the
   *  legacy canvas's `Branch` sets it; consumers read it via `?.syncOnly`. */
  syncOnly?: boolean;
};

// Default `null` (matches v1): every consumer reads through `useBranchContext()?.`, so the absence of a provider is
// handled the same in both canvases.
export const BranchContext = getWorkflowSingleton('BranchContext', () =>
  React.createContext<BranchContextValue | null>(null),
);

export function useBranchContext() {
  return useContext(BranchContext);
}

export function useBranchIndex() {
  return useBranchContext()?.branchIndex ?? null;
}

export function useBranchSyncOnly() {
  return useBranchContext()?.syncOnly ?? false;
}
