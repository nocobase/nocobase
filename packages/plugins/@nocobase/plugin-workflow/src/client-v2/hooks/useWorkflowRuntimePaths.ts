/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useMemoizedFn } from 'ahooks';
import { getRouteRuntimeVersion } from '@nocobase/client-v2';
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
  const getCanvasPath = useMemoizedFn((id: string | number) => getWorkflowCanvasRuntimePath(id));
  const getExecutionPath = useMemoizedFn((id: string | number) => getWorkflowExecutionRuntimePath(id));

  return {
    isV2Runtime: isWorkflowV2Runtime(),
    getWorkflowCanvasPath: getCanvasPath,
    getWorkflowExecutionPath: getExecutionPath,
  };
}
