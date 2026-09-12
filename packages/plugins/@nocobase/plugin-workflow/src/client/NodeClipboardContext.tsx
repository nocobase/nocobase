/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * The clipboard context + provider now live in client-v2 and are shared by both
 * canvases (ADR-0003). v1 keeps a thin wrapper that injects its own canvas
 * runtime source (v1 `FlowContext` + `versionStats.executed`) into the shared
 * provider, and re-exports the hook so existing v1 import sites
 * (`from './NodeClipboardContext'`) are unchanged. Delete on legacy-canvas
 * retirement.
 */

import React from 'react';
import {
  NodeClipboardContextProvider as SharedNodeClipboardContextProvider,
  type CanvasClipboardRuntime,
} from '../client-v2/canvas/NodeClipboardContext';
import { useFlowContext } from './FlowContext';
import { useWorkflowExecuted } from './hooks';

export { useNodeClipboardContext } from '../client-v2/canvas/NodeClipboardContext';

/** Legacy-canvas runtime source: v1's `FlowContext` + `versionStats.executed`
 *  (a BigInt count) coerced to the `executed` boolean the provider expects. */
function useLegacyCanvasRuntime(): CanvasClipboardRuntime {
  const { workflow, nodes, refresh } = useFlowContext() ?? {};
  const executed = useWorkflowExecuted();
  return { workflow, nodes, refresh, executed: Boolean(executed) };
}

export function NodeClipboardContextProvider(props: { children: React.ReactNode }) {
  return (
    <SharedNodeClipboardContextProvider useCanvasRuntime={useLegacyCanvasRuntime}>
      {props.children}
    </SharedNodeClipboardContextProvider>
  );
}
