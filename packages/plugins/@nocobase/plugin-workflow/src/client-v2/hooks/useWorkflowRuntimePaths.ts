/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useMemoizedFn } from 'ahooks';
import { getRouteRuntimeVersion, useApp } from '@nocobase/client-v2';
import { getWorkflowCanvasPath, getWorkflowExecutionPath } from '../constants';
export function isWorkflowV2Runtime() {
  return getRouteRuntimeVersion() === 'modern';
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
  const app = useApp();
  const isStandaloneSettings = app.pluginSettingsManager.getRoutePath('') === '/settings/';
  const isV2Runtime = isStandaloneSettings || isWorkflowV2Runtime();
  const getCanvasPath = useMemoizedFn((id: string | number) =>
    isV2Runtime ? getWorkflowCanvasPath(id) : `/admin/settings/workflow/workflows/${id}`,
  );
  const getExecutionPath = useMemoizedFn((id: string | number) =>
    isV2Runtime ? getWorkflowExecutionPath(id) : `/admin/settings/workflow/executions/${id}`,
  );

  return {
    isV2Runtime,
    getWorkflowCanvasPath: getCanvasPath,
    getWorkflowExecutionPath: getExecutionPath,
  };
}
