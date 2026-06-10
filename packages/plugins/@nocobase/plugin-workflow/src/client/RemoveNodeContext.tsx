/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * The remove-node context + provider now live in client-v2 and are shared by both
 * canvases (ADR-0003). v1 keeps a thin wrapper that injects its own canvas runtime
 * (v1 `useAPIClient` / `FlowContext` / instruction registry) into the shared
 * provider, and re-exports the hook so existing v1 import sites
 * (`from './RemoveNodeContext'`) are unchanged. Delete on legacy-canvas retirement.
 *
 * This replaces v1's former Formily `Action.Modal` keep-branch dialog with the
 * shared antd one; the variable-reference safety check (which the modern canvas
 * previously lacked) is now the shared logic, so both canvases block deleting a
 * node whose result is still referenced.
 */

import React from 'react';
import { useAPIClient, usePlugin } from '@nocobase/client';
import {
  RemoveNodeContextProvider as SharedRemoveNodeContextProvider,
  type CanvasRemoveRuntime,
} from '../client-v2/canvas/RemoveNodeContext';
import { useFlowContext } from './FlowContext';
import PluginWorkflowClient from '.';

export { useRemoveNodeContext } from '../client-v2/canvas/RemoveNodeContext';

/** Legacy-canvas runtime source: v1's `useAPIClient`, `FlowContext`, and the v1
 *  instruction registry (for branch labels). */
function useLegacyCanvasRuntime(): CanvasRemoveRuntime {
  const api = useAPIClient();
  const { nodes, refresh } = useFlowContext() ?? {};
  const plugin = usePlugin(PluginWorkflowClient) as PluginWorkflowClient;
  return {
    api,
    nodes,
    refresh,
    getInstruction: (type: string) => plugin?.instructions.get(type),
  };
}

export function RemoveNodeContextProvider(props: { children: React.ReactNode }) {
  return (
    <SharedRemoveNodeContextProvider useCanvasRuntime={useLegacyCanvasRuntime}>
      {props.children}
    </SharedRemoveNodeContextProvider>
  );
}
