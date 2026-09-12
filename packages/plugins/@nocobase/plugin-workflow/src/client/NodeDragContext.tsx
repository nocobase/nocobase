/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * The node drag-to-reorder provider now lives in client-v2 and is shared by both
 * canvases (ADR-0003). v1 keeps a thin wrapper that injects its own canvas runtime
 * (v1 `useAPIClient` / `lang` / `useCompile` / instruction registry /
 * `useWorkflowExecuted`) into the shared provider, and re-exports the hook so
 * existing v1 import sites (`from './NodeDragContext'`) are unchanged. The pure
 * drop-impact graph walks are likewise re-exported from their client-v2 home.
 * Delete on legacy-canvas retirement.
 */

import React from 'react';
import { useAPIClient, useCompile, usePlugin } from '@nocobase/client';
import {
  NodeDragContextProvider as SharedNodeDragContextProvider,
  type CanvasDragRuntime,
} from '../client-v2/canvas/NodeDragContext';
import WorkflowPlugin from '.';
import { useWorkflowExecuted } from './hooks';
import { lang } from './locale';

export { useNodeDragContext } from '../client-v2/canvas/NodeDragContext';
export { collectDownstreams, collectBranchSubtree } from '../client-v2/canvas/dropImpact';

/** Legacy-canvas runtime source: v1's `useAPIClient`, the two v1 translators
 *  (`lang` for plain keys, `useCompile()` for `{{t("…")}}` titles), the v1
 *  instruction registry, and `versionStats.executed` (a BigInt) coerced to the
 *  `executed` boolean the provider expects. */
function useLegacyCanvasRuntime(): CanvasDragRuntime {
  const api = useAPIClient();
  const compile = useCompile();
  const plugin = usePlugin(WorkflowPlugin) as InstanceType<typeof WorkflowPlugin>;
  const executed = useWorkflowExecuted();
  return {
    api,
    lang: (key: string, options?: Record<string, unknown>) => lang(key, options),
    compile: (source: string) => compile(source),
    getInstruction: (type: string) => plugin?.instructions.get(type),
    executed: Boolean(executed),
  };
}

export function NodeDragContextProvider(props: { children: React.ReactNode }) {
  return (
    <SharedNodeDragContextProvider useCanvasRuntime={useLegacyCanvasRuntime}>
      {props.children}
    </SharedNodeDragContextProvider>
  );
}
