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
import type { WorkflowCanvasRecord, WorkflowRevision } from '../components/workflowCanvas';

/**
 * A canvas node — the live linked-list element produced by `linkNodes`: the flat
 * `flow_nodes` row plus the wired `upstream`/`downstream` object refs. Kept loose
 * (index signature) because node `config` shapes are per-instruction; the named
 * fields are the ones the canvas itself reads.
 */
export type CanvasNode = {
  // `flow_nodes` rows are integer-keyed (matches v1's `Set<number>` / `filterByTk`).
  id: number;
  key?: string;
  type?: string;
  title?: string;
  config?: Record<string, any>;
  upstreamId?: number | null;
  downstreamId?: number | null;
  branchIndex?: number | null;
  upstream?: CanvasNode | null;
  downstream?: CanvasNode | null;
  [key: string]: any;
};

/**
 * The canvas-root context value, shared by both canvases and matching v1's
 * `FlowContext.Provider` shapes:
 *   - editor canvas        → `{ workflow, nodes, refresh }`
 *   - execution canvas     → `{ workflow, nodes, execution, viewJob, setViewJob }`
 *   - manual-todo canvas   → `{ workflow, nodes, execution, userJob }`
 * All fields optional so a consumer reading e.g. only `nodes` is typed against
 * any canvas, and the bare-`{}` default (no provider) still satisfies it.
 */
export type WorkflowCanvasFlowContextValue = {
  workflow?: WorkflowCanvasRecord | null;
  nodes?: CanvasNode[];
  refresh?: () => void;
  /** Editor canvas: sibling versions of the workflow (the version dropdown). */
  revisions?: WorkflowRevision[];
  /** Execution canvas only: the execution being viewed (read-only nodes). */
  execution?: Record<string, any> | null;
  /** Execution canvas only: the job whose result modal is open. */
  viewJob?: Record<string, any> | null;
  /** Execution canvas only: open/close the job result modal. */
  setViewJob?: (job: Record<string, any> | null) => void;
  /** Manual-todo canvas only (plugin-workflow-manual): the current user job
   *  record whose form/status the todo card renders. */
  userJob?: Record<string, any> | null;
};

export const FlowContext = React.createContext<WorkflowCanvasFlowContextValue>({});

export function useFlowContext() {
  return useContext(FlowContext);
}

// Holds the bare workflow record (v1's split from FlowContext). Default `{}` (not null) preserves v1's behavior, so
// unguarded `.type`/`.config` reads at existing call sites stay safe; `Partial` makes the empty default assignable.
export const CurrentWorkflowContext = React.createContext<Partial<WorkflowCanvasRecord>>({});

export function useCurrentWorkflowContext() {
  return useContext(CurrentWorkflowContext);
}

// Default `{}` (not null) to match v1's `NodeContext` default, so existing v1 call sites that read
// `useNodeContext().config` without guarding are unaffected.
export const NodeContext = React.createContext<CanvasNode>({} as CanvasNode);

export function useNodeContext() {
  return useContext(NodeContext);
}

/**
 * The executed-version count of the workflow shown on the canvas — `> 0n` means
 * its nodes are read-only. A BigInt mirroring v1's `useWorkflowExecuted`, reading
 * the same `versionStats.executed` field (the workflow record has NO top-level
 * `executed` — the previous `workflow?.executed` read was always undefined, so
 * the canvas never went read-only after an execution). Callers needing a boolean
 * coerce with `Boolean(...)`.
 */
export function useWorkflowCanvasExecuted(): bigint {
  const { workflow } = useFlowContext() ?? {};
  return BigInt(workflow?.versionStats?.executed || 0);
}
