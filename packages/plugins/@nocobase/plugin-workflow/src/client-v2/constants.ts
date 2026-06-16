/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// The canvas page is registered directly under `admin` (not `admin.settings`), so it renders in the admin content area
// without the settings left menu. `admin.workflow.*` is a shared namespace so sibling pages (e.g. executions at
// `/admin/workflow/executions/:id`) can line up under the same prefix, mirroring v1's `admin.workflow.workflows.id`
// route.
export const WORKFLOW_CANVAS_ROUTE_NAME = 'admin.workflow.workflows.id';
export const WORKFLOW_CANVAS_ROUTE_PATH = '/admin/workflow/workflows/:id';

export function getWorkflowCanvasPath(id: string | number) {
  return `/admin/workflow/workflows/${id}`;
}

// Execution detail page, a sibling of the canvas under the same `admin.workflow` namespace — mirrors v1's
// `admin.workflow.executions.id` route.
export const WORKFLOW_EXECUTION_ROUTE_NAME = 'admin.workflow.executions.id';
export const WORKFLOW_EXECUTION_ROUTE_PATH = '/admin/workflow/executions/:id';

export function getWorkflowExecutionPath(id: string | number) {
  return `/admin/workflow/executions/${id}`;
}
