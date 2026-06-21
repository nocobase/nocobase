/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useMemoizedFn } from 'ahooks';
import { getWorkflowCanvasPath, getWorkflowExecutionPath } from '../constants';

declare global {
  interface Window {
    __nocobase_modern_client_prefix__?: string;
  }
}

function hasModernClientPrefix() {
  return (
    typeof window !== 'undefined' &&
    typeof window.__nocobase_modern_client_prefix__ === 'string' &&
    window.__nocobase_modern_client_prefix__.trim().length > 0
  );
}

/**
 * Workflow's v2 React pieces are intentionally reused by both runtimes during
 * the progressive migration:
 *
 * - pure v2 runtime: mounted under the modern client prefix (`/v/admin/...` by
 *   default), with workflow canvas / execution routes at `/admin/workflow/...`
 * - legacy v1 runtime: some actions still render through v1 pages and must jump
 *   back to the legacy settings routes at `/admin/settings/workflow/...`
 *
 * The runtime marker is the server-injected
 * `window.__nocobase_modern_client_prefix__`. When it exists we are inside the
 * modern client shell; when it does not, the same reused component code is
 * running under the legacy shell and must navigate to the legacy workflow
 * routes. Callers should use these helpers instead of directly importing
 * `client-v2/constants.ts` when the code can execute in both shells.
 */
export function isWorkflowV2Runtime() {
  return hasModernClientPrefix();
}

export function getWorkflowCanvasRuntimePath(id: string | number) {
  if (isWorkflowV2Runtime()) {
    return getWorkflowCanvasPath(id);
  }
  return `/admin/settings/workflow/workflows/${id}`;
}

export function getWorkflowExecutionRuntimePath(id: string | number) {
  if (isWorkflowV2Runtime()) {
    return getWorkflowExecutionPath(id);
  }
  return `/admin/settings/workflow/executions/${id}`;
}

export function useWorkflowRuntimePaths() {
  const getCanvasPath = useMemoizedFn((id: string | number) => getWorkflowCanvasRuntimePath(id));
  const getExecutionPath = useMemoizedFn((id: string | number) => getWorkflowExecutionRuntimePath(id));

  return {
    isV2Runtime: isWorkflowV2Runtime(),
    getWorkflowCanvasPath: getCanvasPath,
    getWorkflowExecutionPath: getExecutionPath,
  };
}
