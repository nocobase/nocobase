/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * The two canvas React contexts, shared by both canvases (ADR-0003, doc §9.4).
 *
 * Aligns with v1's two-context split:
 *   - FlowContext (canvas root) = `{ workflow, nodes, refresh }`
 *   - NodeContext (per node)    = the node object itself (with live
 *                                 `upstream`/`downstream` linked-list refs)
 *
 * Zero dependencies (bare `React.createContext`), so both v1 and v2 share this
 * one definition. v1 re-exports `NodeContext`/`useNodeContext` from here via the
 * allowed `v1 → v2` import direction.
 *
 * `workflow`/`upstreams` are derived via hooks (`useAvailableUpstreams`), never
 * bundled into the node-context value.
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

// Default `{}` (not null) to match v1's `NodeContext` default, so existing v1
// call sites that read `useNodeContext().config` without guarding are unaffected.
export const NodeContext = React.createContext<any>({});

export function useNodeContext() {
  return useContext(NodeContext);
}

/**
 * Whether the workflow shown on the canvas has been executed (its nodes are
 * read-only). Derived from the FlowContext workflow's `executed` count.
 */
export function useWorkflowCanvasExecuted(): boolean {
  const { workflow } = useFlowContext() ?? {};
  return Boolean(workflow?.executed);
}
